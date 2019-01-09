'use strict';
console.log('-----------------------------------------------\nVIRTUAL-SERVICE starting...');
const express = require('express');
const config = require('./config/environment');
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

Scenario.startup();

// Start server
server.listen(config.port, config.ip, () => console.log('VIRTUAL-SERVICE listening on %d\n-----------------------------------------------', config.port));

// Expose app
exports = module.exports = app;
