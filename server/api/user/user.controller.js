'use strict';
const User = require('./user.model');
const passport = require('passport');
const config = require('../../config/environment');
const jwt = require('jsonwebtoken');

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
  newUser.save((err, user) => {
    if (err) return validationError(res, err);
    const token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  });
};

/**
 * Get a single user
 */
exports.role = (req, res, next) => {
  const userId = req.params.id;
  User.findById(userId, (err, user) => {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.role);
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
      user.temporary = false;
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
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = (req, res, next) => res.redirect('/');


/*
function _error(res, err, code) {
  return res.json(code || 422, err);
}

function _encryptPassword(user, password) {
  if (!password || !user.salt) {return '';}
  var salt = Buffer.from(user.salt, 'base64');
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1').toString('base64');
}

function _authenticate(user, psw) {
  return _encryptPassword(user, psw) === user.hashedPassword;
}

function _salt() {
  return crypto.randomBytes(16).toString('base64');
}

exports.index = function(req, res) {
  const users = _.map(store, function(us){
    return _.omit(us, ['salt','hashedPassword']);
  });
  res.json(200, users);
};

exports.me = function(req, res, next) {
  var userId = (req.user||{})._id;
  const user = _.find(store, function(us){
    return us._id === userId;
  });
  return user ? res.json(user) : res.json(404);
};

exports.role = function(req, res) {
  const userId = req.params.id;
  if (!userId) {return res.json(404); }
  const user = _.find(store, function(us){
    return us._id === userId;
  });
  return user ? res.json(user.role) : res.json(404);
};


function _find(o, cb) {
  if (!o) {return cb({ message: 'Cannot find the user.' });}
  var user = null;
  if (o.id || o._id) {
    const id = o.id || o._id;
    user = _.find(store, function(us){
      return us._id === id;
    });
  } else if (o.name) {
    user = _.find(store, function(us){
      return us.name === o.name;
    });
  }
  if (!user) {
    cb({ message: 'Cannot find the user.' });
  } else {
    cb(null, user);
  }
}
exports.find = _find;

function _token(user) {
  var expiration = config.tokenExpiration || 5;
  if (!_.isNumber(expiration) || expiration < 1) {expiration = 5;}
  return jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * expiration});
}

function _update() {
  u.io.save(users_store_path, store, function(err) {
    err ? console.error(err) : console.log('Users store updated');
  });
}

function _save(user, cb) {
  store.push(user);
  _update();
}

exports.create = function (req, res, next) {
  var user = req.body;
  user.role = 'user';
  // validazioni
  if (!user.name) {return _error(res, {message:'Unspecified username'});}
  if (!user.password) {return _error(res, {message:'Unspecified password!'});}
  _find({name:user.name}, function(err, ex){
    if (ex) {return _error(res, 'The specified username is already in use.');}
    user._id = u.guid();
    user.salt = _salt();
    user.hashedPassword =  _encryptPassword(user, user.password);
    _save(user, function(err){
      if (err) {return _error(res, err);}
      res.json({ token: _token(user) });
    });
  });
};

exports.delete = function (req, res) {
  const userId = req.params.id;
  if (!userId) {return res.json(404); }
  const user = _.find(store, function(us){
    return us._id === userId;
  });
  if (!user) {return res.json(404);}
  if (user._id === req.user._id) {return _error(res, 'Cannot delete yourself!');}
  _.pull(store, user);
  _update();
  res.send(204);
};


// INIT:
var _toUpdate = false;
(store||[]).forEach(function(user) {
  if (user._default) {
    user.salt = _salt();
    user.hashedPassword =  _encryptPassword(user, user._default);
    delete user._default;
    _toUpdate = true;
  }
});
if (_toUpdate) {_update();}
*/
