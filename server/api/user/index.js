'use strict';

const express = require('express');
const controller = require('./user.controller');
const config = require('../../config/environment');
const auth = require('../../auth/auth.service');

const router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/:id', auth.isAuthenticated(), controller.role); //<- restituisce il profilo dell'utente
router.post('/', auth.hasRole('admin'), controller.create);
router.post('/me', auth.isAuthenticated(), controller.changePassword);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
