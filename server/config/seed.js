/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

const User = require('../api/user/user.model');
const Service = require('../api/service/service.model');


User.deleteMany({}, () => {
  User.create({
    _id: '54b3e04cde6279a8211b42fe',
    provider: 'local',
    name: 'test',
    email: 'test@test.com',
    password: 'test',
    temporary: true
  }, {
    _id: '54b3e04cde6279a8211b42fd',
    provider: 'local',
    role: 'admin',
    name: 'admin',
    email: 'leo.olmi@gmail.com',
    password: 'admin',
    temporary: true
  }, () => {
    console.log('finished populating users');
  });
});

Service.deleteMany({}, () => {
  Service.create({
    owner: '54b3e04cde6279a8211b42fe',
    name: 'test-service1',
    active: true,
    dbo: '',
    path: '',
    calls: []
  }, {
    owner: '54b3e04cde6279a8211b42fd',
    name: 'ciccio lillo',
    active: true,
    dbo: '',
    path: '',
    calls: []
  }, {
    owner: '54b3e04cde6279a8211b42fd',
    name: 'disabled-service',
    active: false,
    dbo: '',
    path: '',
    calls: []
  }, () => {
    console.log('finished populating services');
  });
});
