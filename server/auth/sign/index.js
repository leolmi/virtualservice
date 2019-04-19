'use strict';

const express = require('express');
const u = require('../../utils');
const User = require('../../api/user/user.model');
const router = express.Router();
const auth = require('../auth.service');

router.post('/', (req, res, next) => {
  const code = (req.body||{}).code;
  if (!code) return u.error(res, 'Undefined sign code!', 404);
  User.findOne({lock: code}, (err, user) => {
    if (err) return u.error(res, err);
    if (!user) return u.error(res, 'User not found!', 404);
    user.lock = null;
    user.save((err, user) => {
      if (err) return u.error(res, err);
      const token = auth.signToken(user._id, user.role);
      res.json({token: token, code: auth.code.ok});
    });
  });
});

module.exports = router;