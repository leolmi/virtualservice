'use strict';

const express = require('express');
const controller = require('./user.controller');
const config = require('../../config/environment');
const auth = require('../../auth/auth.service');

const router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/me', auth.isAuthenticated(), controller.me);
router.post('/', controller.create);
router.post('/me', auth.isAuthenticated(), controller.changePassword);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
