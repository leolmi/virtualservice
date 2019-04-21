'use strict';
const User = require('../user/user.model');
const u = require('../../utils');
const _ = require('lodash');

const MANAGER = {
  resetUsers: (res) => User.deleteMany({}, (err) => err ? u.error(res, err) : u.ok(res))
};



exports.execute = function(req, res) {
  if (_.isFunction(MANAGER[req.body.command])) {
    MANAGER[req.body.command](res, req.body.args);
  } else {
    u.error(res, 'Unrecognized management command!')
  }
}