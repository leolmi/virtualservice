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
    return res.json(401, 'You have tryed access too many time. Wait for 5 minutes and retry!');
  } else if (now - _cache[org] < 300000) {
    return res.json(401, 'You have tryed access too many time. Wait for few minutes and retry!');
  } else {
    _cache[org] = 1;
  }
  passport.authenticate('local', (err, user, info) => {
    const error = err || info;
    if (error) return res.json(401, error);
    const code = !user ? auth.code.none : auth.code.ok;
    const token = !user ? null : auth.signToken(user._id, user.role);
    if (!!token) delete _cache[org];
    res.json({token: token, code: code});
  })(req, res, next);
});

module.exports = router;
