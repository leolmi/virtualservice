'use strict';
const path = require('path');
const root = path.normalize(__dirname + '/../../..');
const DEFAULT_PORT = 9010;

// Export the config object
// ==============================================
module.exports = {
  env: 'development',
  // Root path of server
  root: root,
  // Server ip
  ip: process.env.VIRTUALSERVICE_IP,
  // Server port
  port: process.env.VIRTUALSERVICE_PORT||DEFAULT_PORT,
  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'virtualservice-secret'
  },
  // Log options
  log: {
    // Enabled log on file (server-side)
    file: true
  },
  // Path del server
  serverPath: path.normalize(__dirname + '/../..'),
  // Path del client
  clientPath: '',
  // Token expires in minutes
  tokenExpiration: 5,
  // List of user roles
  userRoles: ['guest', 'user', 'admin']
};
