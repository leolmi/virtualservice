const _ = require('lodash');
const { isMainThread, parentPort, workerData } = require('worker_threads');
const vm = require('vm');
const samples = require('../samples').default;

const _guid = (mask) =>
  (mask || 'xx-x-x-x-xxx').replace(/[x]/g, () =>
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
  );

const _isPromiseLike = (prm) => _.isObject(prm) && _.isFunction(prm.then);

const _isJson = (exp) => /^[{[]/g.test((exp || '').trim());

if (isMainThread) {
  console.warn('Calc is available on secondary thread only!');
} else {
  const data = workerData;
  const scope = { ...data.scope };
  scope._ = _;
  scope.setTimeout = setTimeout;
  scope.samples = samples;
  scope.guid = _guid;
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
        (r) => parentPort.postMessage({ value: r, db: scope.db }),
        (err) => parentPort.postMessage({ error: err }),
      );
    } else {
      parentPort.postMessage({ value: scope.result, db: scope.db });
    }
  } catch (err) {
    if (data.verbose) console.log('EXPRESSION ERROR: ', err);
    parentPort.postMessage({ error: err });
  }
}
