'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
  _id: String,
  time: Number,
  prevId: String,
  owner: String,
  error: Schema.Types.Mixed,
  content: Schema.Types.Mixed,
  call: Schema.Types.Mixed,
  path: String,
  author: String,
  verb: String,
  elapsed: Number
}, { versionKey: false });

module.exports = mongoose.model('Log', LogSchema);