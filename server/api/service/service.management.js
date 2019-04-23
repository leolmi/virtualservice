'use strict';
const User = require('../user/user.model');
const u = require('../../utils');
const _ = require('lodash');


function resetPassword(res, args) {
  if (!args.password) return u.error(res, 'Undefined pasword!');
  if ((args.password||'').trim().length<3) return u.error(res, 'Wrong pasword!');
  const userId = req.user._id;
  User.findById(userId, (err, user) => {
    if (err) return u.error(res, err);
    user.password = args.password;
    user.save(err => err ? u.error(res, err) : res.send(200));
  });
}

function confirmUser(res, args) {
  if (!args.id) return u.error(res, 'Undefined user identity!');
  User.findById(args.id, (err, user) => {
    if (err) return u.error(res, err);
    user.lock = null;
    user.save(err => err ? u.error(res, err) : res.send(200));
  });
}

const MANAGER = {
  resetUsers: (res) => User.deleteMany({}, (err) => err ? u.error(res, err) : u.ok(res)),
  resetPassword: (res, args) => resetPassword(res, args),
  confirmUser: (res, args) => confirmUser(res, args)
};

exports.execute = function(req, res) {
  if (_.isFunction(MANAGER[req.body.command])) {
    MANAGER[req.body.command](res, req.body.args);
  } else {
    u.error(res, 'Unrecognized management command!')
  }
}