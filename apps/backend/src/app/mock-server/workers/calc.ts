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
): Promise<CalcResult> => {
  return new Promise((res, rej) => {
    const timeout: number =
      tmo ||
      (parseInt(process.env['CALC_CODE_EXECUTING_TIMEOUT'] ?? '10000', 10) ||
        10000) + 1000;

    const workerOptions = {
      workerData: {
        exp,
        scope,
        timeout,
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

    const calcSource = path.join(__dirname, 'calc.js');
    let tm: ReturnType<typeof setTimeout> | null = null;

    const worker = new Worker(calcSource, workerOptions);

    worker.on('message', (m: CalcResult) => {
      if (tm) clearTimeout(tm);
      res(m);
    });

    worker.on('error', (err: Error) => {
      if (tm) clearTimeout(tm);
      rej(err);
    });

    worker.on('exit', (code: number) => {
      if (tm) clearTimeout(tm);
      if (code !== 0) {
        rej(new Error(`Calc stopped with exit code ${code}`));
      }
    });

    tm = setTimeout(() => {
      rej(new Error('Calc execution timed out!'));
      void worker.terminate();
    }, timeout);
  });
};

export default calc;
