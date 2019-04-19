'use strict';

const express = require('express');
const passport = require('passport');
const auth = require('../auth.service');
const _cache = {};
const router = express.Router();

router.post('/', (req, res, next) => {
  const org = req.socket.remoteAddress||'unknown';
  console.log('TRY ACCESS FROM %s', org);
  _cache[org] = _cache[org] || 0;
  const now = Date.now();
  if (_cache[org]<3)  {
    _cache[org]++;
  } else if (_cache[org]===3) {
    _cache[org] = now;
    return res.status(401).json('You have tryed access too many time. Wait for 5 minutes and retry!');
  } else if (now - _cache[org] < 300000) {
    return res.status(401).json('You have tryed access too many time. Wait for few minutes and retry!');
  } else {
    _cache[org] = 1;
  }
  passport.authenticate('local', (err, user, info) => {
    const error = err || info;
    if (!!error && error.code !== auth.code.none) return res.status(401).json(error);
    const code = !user ? auth.code.none : (!!user.lock ? auth.code.idle : auth.code.ok);
    const token = (code != auth.code.ok) ? null : auth.signToken(user._id, user.role);
    if (!!token) delete _cache[org];
    res.json({token: token, code: code});
  })(req, res, next);
});

module.exports = router;
