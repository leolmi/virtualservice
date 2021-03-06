'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const u = require('../../utils');

const ServiceCallRuleSchema = new Schema({
  expression: String,
  path: String,
  error: String,
  code: {type:Number, default:500}
});

const ServiceCallSchema = new Schema({
  path: String,
  verb: String,
  description: String,
  response: String,
  file: String,
  respType: String,
  rules: [ServiceCallRuleSchema]
});

const ServiceSchema = new Schema({
  owner: String,
  lastChange: Number,
  creationDate: Number,
  author: String,
  name: String,
  description: String,
  active: {type: Boolean, default:true},
  dbo: String,
  path: String,
  calls: [ServiceCallSchema]
}, { versionKey: false });

module.exports = mongoose.model('Service', ServiceSchema);