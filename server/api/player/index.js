'use strict';

const _ = require('lodash');
const u = require('../../utils');
const Service = require('../service/service.model');
const fs = require('fs');
const path = require('path');
const _base_url = '/service/';
const _db_object = {};


function _pathValue(path, o) {
  let s = o;
  path.split('.').forEach((p) => s = s[p]);
  // console.log('PATH VALUE:  path=%s  value=%s  OBJECT:', path, s, o);
  return s;
}

function _evalExp(exp, scope, o) {
  o = o || {};
  let k = [null];
  k = k.concat(_.keys(scope));
  k.push((!!o.script) ? exp : 'return ' + exp);
  // console.log('EVAL EXP: %s', exp);
  const args = _.map(_.keys(scope), (a) => scope[a]);
  /* jshint evil: true */
  const validator = new (Function.prototype.bind.apply(Function, k));
  try {
    const result = validator.apply(validator, args);
    return { value: result };
  } catch(err) {
    console.log('EXPRESSION ERROR: ', err);
    return { error: err };
  }
}

function _validateExp(exp, scope) {
  const result = _evalExp(exp, scope);
  // console.log('EVALUATE EXP', scope, result);
  return (result.error) ? false : !!result.value;
}

function _getData(o) {
  return (o.verb === 'post') ? o.data : o.params;
}

function _validatedb(s, o) {
  o.context = s._id;
  if (!_db_object[o.context]) _db_object[o.context] = (_.isString(s.dbo)) ? u.parseJS(s.dbo)||{} : {};
}
function _getExpressionScope(o, path = null) {
  return {
    _: _,
    params: o.params,
    data: o.data,
    db: _db_object[o.context],
    headers: o.headers,
    cookies: o.cookies,
    pathValue: o.pathValue||{},
    value: path ? _pathValue(path, _getData(o)) : null
  }
}
function _validatePath(call, o) {
  const cp = u.splitUrl(call._path);
  const op = u.splitUrl(o.path);
  cp.forEach((part, index) => {
    const m = (/\{(.*?)\}/g).exec(part);
    if (m) o.pathValue[m[1]] = op[index]
  });
}
function _validate(call, o, cb) {
  let error = '';
  let code = 500;
  _validatePath(call, o);
  (call.rules || []).forEach((r) => {
    const scope = _getExpressionScope(o, r.path);
    if (!_validateExp(r.expression, scope)) {
      if (error) error += '\n';
      error += r.error;
      code = r.code || 500;
    }
  });
  cb(error, code);
}
function _getValue(v, o) {
  switch (v.type) {
    case 'data':
      return u.generateTable(v.settings || {});
    // case 'manual':
    default:
      const scope = _getExpressionScope(o); 
      return _evalExp((v.settings || {}).value || 'value', scope).value || '';
  }
}

// function _parseValues(resp, values, o) {
//   _.keys(resp).forEach((k) => {
//     if (_.isString(resp[k]) && resp[k].indexOf('{{')===0) {
//       const rgx = new RegExp('\\{\\{(.*)\\}\\}');
//       const m = rgx.exec(resp[k]);
//       if (m) {
//         const v = _.find(values, (xv) => xv.name===m[1]);
//         if (v) resp[k] = _getValue(v, o);
//       }
//     } else if (_.isObject(resp[k])) {
//       _parseValues(resp[k], values);
//     }
//   });
// }

function _result(res, call, o) {
  const resp = call.response;
  if (_.isString(resp)) {
    try {
      if (_.startsWith(resp, '=')) {
        // è un'espressione
        resp = resp.substr(1);
        const scope = _getExpressionScope(o);
        //_.extend(scope, call.values); 
        const result = _evalExp(resp, scope, {script:true});
        if (result.error) return u.error(res, result.error);
        resp = result.value;
        // console.log('CALC RESULT', call.response);
      } else {
        // è un oggetto
        resp = JSON.parse(resp);
        //_parseValues(call.response, call.values, o);
      }
    } catch (err) {
      return u.error(res, err);
    }
  }
  u.ok(res, resp);
}
function _getFixedPath(path) {
  const m = (/^(.*?)(\/\{|$)/g).exec(path||'');
  return m ? m[1] : path;
}
function _isPath(callpath, urlpath) {
  let fixed_path = (_getFixedPath(callpath)||'').trim();
  return (urlpath||'').indexOf(fixed_path) == 0;
}
function _findCall(service, o, cb) {
  const call = _.find(service.calls||[], (c) => _isPath(u.path(service.path, c.path), o.pathname) && (o.verb==='options' || u.equal(c.verb, o.verb)));
  const err = (!call) ? 'No call can reply!' : null;
  cb(err, call);
}

function _download(res, call) {
  if (!call.file) return u.error(res, 'Undefined file!');
  fs.stat(call.file, (err, stats) => {
    if (err) return u.error(res, err);
    const filename = path.basename(call.file);
    res.download(call.file, filename);
  });
}

function _finder(o) {
  return function() {
    return _.startsWith(o.pathname||'', this.path + '/');
  }
}

module.exports = (req, res) => {
  if (_.isString(req)) {
    switch (req) {
      case 'flush': return delete _db_object[res];
      default: return;
    }
  }
  const o = u.parseUrl(req, _base_url);
  Service.find({
    $where: _finder(o)   //'\''+(o.pathname||'')+'\'.indexOf(this.path + \'/\') === 0'
  }, (err, services) => {
    if (err) return u.error(res, err);
    if (!services || services.length<1) return u.error(res, 'No service can reply!');
    if (services.length>1) return u.error(res, 'More than one service!');
    const srv = services[0];
    if (srv.active === false) return u.error(res, 'Service not active!');
    _findCall(srv, o, (err, call) => {
      if (err) return u.error(res, err);
      if (o.verb === 'options') return u.ok(res);
      call._path = u.path(srv.path, call.path);
      _validatedb(srv, o);
      _validate(call, o, (err, code) => {
        if (err) return u.error(res, err, code);
        if (call.respType === 'file') return _download(res, call);
        _result(res, call, o);
      });
    });
  });
};