const _ = require('lodash');
const { isMainThread, parentPort, workerData } = require('worker_threads');
const vm = require('vm');
const samples = require('./samples').default;

const _guid = (mask) =>
  (mask || 'xx-x-x-x-xxx').replace(/[x]/g, () =>
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
  );

const _isPromiseLike = (prm) => _.isObject(prm) && _.isFunction(prm.then);

const _isJson = (exp) => /^[{[]/g.test((exp || '').trim());

// Marker usato da throwError per distinguere i throw "intenzionali"
// dalle eccezioni generiche. Viene riconosciuto nel catch per produrre
// una CalcResult con errorCode.
const VS_THROW = '__vsThrow';

// Interpreta un errore catturato: se è un marker throwError estrae
// message/errorCode, altrimenti lo restituisce com'è.
const _toErrorPayload = (err) => {
  if (err && typeof err === 'object' && err[VS_THROW]) {
    return { error: err.message, errorCode: err.code };
  }
  return { error: err };
};

if (isMainThread) {
  console.warn('Calc is available on secondary thread only!');
} else {
  const data = workerData;
  const scope = { ...data.scope };
  scope._ = _;
  scope.setTimeout = setTimeout;
  scope.samples = samples;
  scope.guid = _guid;

  // ── Scope-injected control functions (response-only use case) ──────────────
  // setExitCode(code): override dello status code della response "di successo".
  // throwError(message, code=500): interrompe e produce una response di errore.
  if (data.controls) {
    scope.setExitCode = (code) => { scope.__exitCode = code; };
    scope.throwError = (message, code) => {
      const err = { [VS_THROW]: true, message, code: code || 500 };
      throw err;
    };
  }
  scope.__exitCode = undefined;

  let exp = (data.exp || '').trim();
  if (_.startsWith(exp, '=')) exp = exp.substring(1);
  if (_isJson(exp)) exp = `return ${exp}`;
  exp = `result = (function(){${exp}})();`;
  scope.result = null;
  if (data.verbose) console.log('EVAL EXP', exp);

  const script = new vm.Script(exp);
  const context = vm.createContext(scope, {
    codeGeneration: {
      strings: false,
      wasm: false,
    },
  });
  try {
    script.runInNewContext(context, {
      timeout: data.timeout || 10000,
      contextCodeGeneration: {
        strings: false,
        wasm: false,
      },
    });
    if (_isPromiseLike(scope.result)) {
      scope.result?.then(
        (r) => parentPort.postMessage({ value: r, db: scope.db, exitCode: scope.__exitCode }),
        (err) => parentPort.postMessage({ ..._toErrorPayload(err), db: scope.db }),
      );
    } else {
      parentPort.postMessage({ value: scope.result, db: scope.db, exitCode: scope.__exitCode });
    }
  } catch (err) {
    if (data.verbose) console.log('EXPRESSION ERROR: ', err);
    parentPort.postMessage({ ..._toErrorPayload(err), db: scope.db });
  }
}
