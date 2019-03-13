'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
  time: Number,
  owner: String,
  error: Schema.Types.Mixed,
  content: Schema.Types.Mixed,
  call: Schema.Types.Mixed
}, { versionKey: false });

module.exports = mongoose.model('Log', LogSchema);