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
  none: 'none'
};

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403/401
 * @param: [check]
 */
function isAuthenticated(check) {
  return compose()
    // Validate jwt
    .use(function (req, res, next) {
      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function (req, res, next) {
      Users.findOne({_id:req.user._id}, (err, user) => {
        if (err) return next(err);
        if (!user) return res.send(404);
        req.user = user;
        next();
      });
    })
    // Security check
    .use(function (req, res, next) {
      if (_.isFunction(check)) {
        check(req, function (err, result) {
          if (err) {return next(err);}
          if (!result) {return res.send(403);}
          next();
        });
      } else {
        next();
      }
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (req.user && config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.send(403);
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({ _id: id }, config.secrets.session, { expiresIn: '5m' });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) {return res.json(404, { message: 'Something went wrong, please try again.'});}
  const token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
