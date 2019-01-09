'use strict';
const errors = require('./components/errors');

module.exports = (app) => {
  app.use('/auth', require('./auth'));
  app.use('/services', require('./api/services'));
  app.use((req, res, next) => {
    const m = /.*\/server\/((.*)[\?]\??(.*)?|(.*))/.exec(req.url);
    return m ? require('./api/service')(req, res) : next();
  });
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|assets)/*').get(errors[404]);
};
