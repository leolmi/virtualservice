'use strict';

console.log(`
 __   __  ___   ______    _______  __   __  _______  ___     
|  | |  ||   | |    _ |  |       ||  | |  ||   _   ||   |    
|  |_|  ||   | |   | ||  |_     _||  | |  ||  |_|  ||   |    
|       ||   | |   |_||_   |   |  |  |_|  ||       ||   |    
|       ||   | |    __  |  |   |  |       ||       ||   |___ 
 |     | |   | |   |  | |  |   |  |       ||   _   ||       |
  |___|  |___| |___|  |_|  |___|  |_______||__| |__||_______|
 _______  _______  ______    __   __  ___   _______  _______ 
|       ||       ||    _ |  |  | |  ||   | |       ||       |
|  _____||    ___||   | ||  |  |_|  ||   | |       ||    ___|
| |_____ |   |___ |   |_||_ |       ||   | |       ||   |___ 
|_____  ||    ___||    __  ||       ||   | |      _||    ___|
 _____| ||   |___ |   |  | | |     | |   | |     |_ |   |___ 
|_______||_______||___|  |_|  |___|  |___| |_______||_______|
 _               __            
| |__  _   _    / /  ___  ___  
| '_ \\| | | |  / /  / _ \\/ _ \\ 
| |_) | |_| | / /__|  __/ (_) |
|_.__/ \\__, | \\____/\\___|\\___/ 
       |___/                   
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
