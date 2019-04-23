'use strict';

const config = require('../../config/environment');
const u = require('../../utils');
const _ = require('lodash');
const Service = require('./service.model');
const Player = require('../player');
const Log = require('../player/log.model');

// elenco dei servizi
exports.index = function(req, res) {
  Service.find({owner:req.user._id}, (err, services) => err ? u.error(res, err) : u.ok(res, services));
};

// elenco dei servizi
exports.templates = function(req, res) {
  Service.find({owner:u.constants.TEMPLATE_ID}, (err, services) => err ? u.error(res, err) : u.ok(res, services));
};

// restituisce il singolo servizio
exports.read = function(req, res) {
  Service.findOne({owner:req.user._id, _id:req.params.id}, (err, service) => err ? u.error(res, err) : u.ok(res, service));
};

// crea/aggiorna il servizio
exports.save = function(req, res) {
  const service = req.body||{};
  if (!service) return u.error(res, 'Undefined service!');
  if (!service.path) return u.error(res, 'Undefined service base path!');
  // verifica che il base path non sia utilizzato poi salva
  Service.find({path: service.path, _id:{ '$ne': service._id }}, (err, services) => {
    if (err) return u.error(res, err);
    if (services && services.length>0) return u.error(res, 'Base path in use, modify it and try again!');
    service.owner = req.user._id;
    service.lastChange = Date.now();
    if (service._id) {
      // update
      Service.findOne({owner:req.user._id, _id:service._id}, (err, xservice) => {
        if (err) return u.error(res, err);
        const updated = _.merge(xservice, service, (a,b) => _.isArray(a) ? b : undefined);
        //updated.markModified('any-mixed-content');
        updated.save((err) => err ? u.error(res, err) : u.ok(res, xservice));
        Player('flush', service._id);
      });
    } else {
      // save new
      service.author = req.user.name;
      service.creationDate = Date.now();
      Service.create(service, (err, nservice) => err ? u.error(res, err) : u.ok(res, nservice));
    }
  });
};

// salva come template
exports.saveTemplate = function(req, res) {
  const service = req.body||{};
  if (!service) return u.error(res, 'Undefined service!');
  delete service._id;
  delete service.path;
  service.owner = u.constants.TEMPLATE_ID;
  service.lastChange = Date.now();
  service.creationDate = Date.now();
  service.active = true;
  Service.create(service, (err, nservice) => err ? u.error(res, err) : u.ok(res, nservice));
}

// elimina il servizio
exports.delete = function(req, res) {
  if ((!req.params||{}).id) return u.error(res, 'Undefined service!'); 
  Service.findOne({owner:req.user._id, _id:req.params.id}, 
    (err, xservice) => err ? u.error(res, err) : 
      (xservice ? xservice.remove(rerr => rerr ? u.error(res, rerr) : u.deleted(res, xservice)) : u.error(res, 'Service not found!'))); 
};

// elimina il servizio
exports.deleteTemplate = function(req, res) {
  if ((!req.params||{}).id) return u.error(res, 'Undefined service!'); 
  Service.findOne({owner:u.constants.TEMPLATE_ID, _id:req.params.id}, 
    (err, xservice) => err ? u.error(res, err) : 
      (xservice ? xservice.remove(rerr => rerr ? u.error(res, rerr) : u.deleted(res, xservice)) : u.error(res, 'Service not found!'))); 
};

// visualizza il log delle chiamate
exports.monitor = function(req, res) {
  console.log('monitor request', req.params);
  // Log.find({owner: req.params.id}, (err, items) => {
  Log.find({
    owner: req.params.id, 
    time: {$gt: parseInt(req.params.last)}
  }, (err, items) => {
    if (err) return u.error(res, err);
    u.ok(res, items);
  });
}
