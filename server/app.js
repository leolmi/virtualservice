'use strict';

console.log(`
 _____ _     _           _ _____             _         
|  |  |_|___| |_ _ _ ___| |   __|___ ___ _ _|_|___ ___ 
|  |  | |  _|  _| | | .'| |__   | -_|  _| | | |  _| -_|
 \\___/|_|_| |_| |___|__,|_|_____|___|_|  \\_/|_|___|___| by Leo

 `);
console.log('starting...');
const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/environment');
// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options).then(() => console.log('Mongo db connected!'), err => console.error('Mongo db connection error:', err));
// Check DB data
require('./config/seed');

// console.log('ENVIROMENT VARIABLES', process.env);
// Setup server
const app = express();
const server = require('http').createServer(app);
const socketio = require('socket.io')(server, {
  serveClient: (config.env !== 'production'),
  path: '/socket.io'
});

require('./config/socketio')(socketio);
require('./config/server')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, () => console.log('listening on %d\n-----------------------------------------------', config.port));

// Expose app
exports = module.exports = app;
