'use strict';
const User = require('./user.model');
const u = require('../../utils');
const Sign = require('../../sign/sign.controller');

const validationError = (res, err) => res.json(422, err);

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = (req, res) => User.find({}, '-salt -hashedPassword', (err, users) => err ? res.send(500, err) : res.json(200, users));

/**
 * Creates a new user
 */
exports.create = (req, res, next) => {
  const newUser = new User(req.body);
  newUser.role = 'user';
  newUser.lock = u.salt();
  newUser.save((err, user) => {
    if (err) return validationError(res, err);
    Sign.sendMail(user);
    res.send(200);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = (req, res) => User.findByIdAndRemove(req.params.id, (err, user) => err ? res.send(500, err) : res.send(204));

/**
 * Change a users password
 */
exports.changePassword = (req, res, next) => {
  const userId = req.user._id;
  const oldPass = String(req.body.oldPassword);
  const newPass = String(req.body.newPassword);
  if (!oldPass || !newPass) return validationError(res, 'Undefined credentials!');
  User.findById(userId, (err, user) => {
    if (err) return validationError(res, err);
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(err => err ? validationError(res, err) : res.send(200));
    } else {
      res.send(403);
    }
  });
};

/**
 * Get my info
 */
exports.me = (req, res, next) => {
  const userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', (err, user) => { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(404);
    if (user.lock) return res.json(404);
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = (req, res, next) => res.redirect('/');
