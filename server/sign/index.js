'use strict';

const express = require('express');
const controller = require('./sign.controller');

const router = express.Router();

router.get('/:id', controller.sign);

module.exports = router;