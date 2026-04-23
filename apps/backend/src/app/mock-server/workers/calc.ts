import { Worker } from 'worker_threads';
import * as path from 'path';
import { CalcResult } from '../interfaces/scope.interface';

/**
 * ENV VARIABLES:
 *   CALC_CODE_EXECUTING_TIMEOUT        Timeout esecuzione script in ms (default 10000)
 *   CALC_MAX_YOUNG_GENERATION_SIZE_MB  Dimensione heap giovane in MB (default 64)
 *   CALC_MAX_OLD_GENERATION_SIZE_MB    Dimensione heap vecchio in MB (default 64)
 *   CALC_CODE_RANGE_SIZE_MB            Dimensione range codice pre-allocato in MB (default 64)
 */
const calc = (
  exp: string,
  scope: Record<string, unknown>,
  tmo = 0,
  /** Se true inietta setExitCode/throwError nello scope (usato solo per la response) */
  controls = false,
): Promise<CalcResult> => {
  return new Promise((resolve, reject) => {
    const timeout: number =
      tmo ||
      (parseInt(process.env['CALC_CODE_EXECUTING_TIMEOUT'] ?? '10000', 10) ||
        10000) + 1000;

    const workerOptions = {
      workerData: {
        exp,
        scope,
        timeout,
        controls,
      },
      resourceLimits: {
        maxYoungGenerationSizeMb: parseInt(
          process.env['CALC_MAX_YOUNG_GENERATION_SIZE_MB'] ?? '64',
          10,
        ),
        maxOldGenerationSizeMb: parseInt(
          process.env['CALC_MAX_OLD_GENERATION_SIZE_MB'] ?? '64',
          10,
        ),
        codeRangeSizeMb: parseInt(
          process.env['CALC_CODE_RANGE_SIZE_MB'] ?? '64',
          10,
        ),
      },
    };

    const calcSource = path.join(__dirname, 'calc-worker.js');
    let tm: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const settle = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      if (tm) clearTimeout(tm);
      fn();
    };

    let worker: Worker;
    try {
      worker = new Worker(calcSource, workerOptions);
    } catch (err) {
      reject(
        new Error(
          `Failed to start calc worker: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      return;
    }

    worker.on('message', (m: CalcResult) => {
      settle(() => resolve(m));
    });

    worker.on('error', (err: Error) => {
      settle(() => reject(err));
    });

    worker.on('exit', (code: number) => {
      // Se la promise è già risolta (message/error) non fare nulla.
      // Se il worker esce senza aver inviato un messaggio → reject.
      settle(() =>
        reject(
          new Error(
            code !== 0
              ? `Calc stopped with exit code ${code}`
              : 'Calc worker exited without producing a result',
          ),
        ),
      );
    });

    tm = setTimeout(() => {
      settle(() => reject(new Error('Calc execution timed out!')));
      void worker.terminate();
    }, timeout);
  });
};

export default calc;
