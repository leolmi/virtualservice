'use strict';

const User = require('../api/user/user.model');
const Service = require('../api/service/service.model');
const args = process.argv.slice(2);

User.findOne({role:'admin'}, (err, user) => {
  if (!user) {
    User.create({
      _id: '54b3e04cde6279a8211b42fd',
      provider: 'local',
      role: 'admin',
      name: 'admin',
      email: 'leo.olmi@gmail.com',
      password: 'admin',
      temporary: true  
    }, () => {
      console.log('finished checking users');
    });  
  } else {
    console.log('finished checking users');
  }
});


if (args.indexOf('-t')||args.indexOf('--test')) {
  Service.deleteMany({}, () => {
    Service.create({
      owner: '54b3e04cde6279a8211b42fd',
      name: 'ciccio lillo',
      description: '',
      active: true,
      dbo: '',
      path: 'testa',
      calls: [{
        path: 'appalla',
        verb: 'get',
        response: '',
        file: '',
        respType: '',
        rules: [{
          expression: '',
          path: '',
          error: 'Undefined!',
          code:500
        }]
      }, {
        path: 'dilegno',
        verb: 'post',
        response: '',
        file: '',
        respType: '',
        rules: [{
          expression: '',
          path: '',
          error: 'Corrupted!',
          code: 502
        }]
      }]
    }, {
      owner: '54b3e04cde6279a8211b42fd',
      name: 'disabled-service',
      description: 'servizio disabilitato per vedere come si visualizza',
      active: false,
      dbo: '',
      path: '',
      calls: []
    }, () => {
      console.log('finished populating services (test mode)');
    });
  });
}
