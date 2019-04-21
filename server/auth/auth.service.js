'use strict';

const _ = require('lodash');
const passport = require('passport');
const config = require('../config/environment');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const Users = require('../api/user/user.model');
const validateJwt = expressJwt({ secret: config.secrets.session });

exports.code = {
  ok: 'ok',
  none: 'none',
  idle: 'idle'
};

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403/401
 * @param: [check]
 */
function isAuthenticated(check) {
  return compose()
    // Validate jwt
    .use((req, res, next) => validateJwt(req, res, next))
    // Attach user to request
    .use((req, res, next) => Users.findOne({_id:req.user._id}, (err, user) => {
      if (err) return next(err);
      if (!user) return res.send(404);
      req.user = user;
      next();
    }))
    // Security check
    .use((req, res, next) => _.isFunction(check) ?
      check(req, function (err, result) {
        if (err) {return next(err);}
        if (!result) {return res.send(403);}
        next();
      }) : next());
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');
  return compose()
    .use(isAuthenticated())
    .use((req, res, next) => (req.user && config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) ? next() : res.send(403));
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({ _id: id }, config.secrets.session, { expiresIn: config.tokenExpiration || '60m' });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) { return res.json(404, { message: 'Something went wrong, please try again.'}); }
  const token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
