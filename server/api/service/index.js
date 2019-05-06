'use strict';

const express = require('express');
const controller = require('./service.controller');
const management = require('./service.management');
const auth = require('../../auth/auth.service');

const router = express.Router();

// elenco dei servizi
router.get('/', auth.isAuthenticated(), controller.index);
// elenco templates
router.get('/templates', auth.isAuthenticated(), controller.templates);
// restituisce il log
router.get('/monitor/:id/?:last', auth.isAuthenticated(), controller.monitor);
// restituisce il singolo servizio
router.get('/:id', auth.isAuthenticated(), controller.read);
// salva il servizio
router.post('/', auth.isAuthenticated(), controller.save);
// salva il servizio
router.post('/template', auth.hasRole('admin'), controller.saveTemplate);
// admin management
router.post('/execute', auth.hasRole('admin'), management.execute)
// elimina il servizio
router.delete('/:id', auth.isAuthenticated(), controller.delete);
// elimina il servizio
router.delete('/template/:id', auth.hasRole('admin'), controller.deleteTemplate);
// pulishe il log monitor
router.delete('/monitor/:owner', auth.isAuthenticated(), controller.deleteMonitor);

module.exports = router;