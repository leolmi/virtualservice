'use strict';
const errors = require('./components/errors');
const pages = require('./components/pages');

module.exports = (app) => {
  app.use('/auth', require('./auth'));
  // app.use('/sign', require('./sign'));
  app.use('/user', require('./api/user'));
  app.use('/services', require('./api/service'));
  app.use((req, res, next) => {
    const m = /.*\/service\/((.*)[\?]\??(.*)?|(.*))/.exec(req.url);
    return m ? require('./api/player')(req, res) : next();
  });
  app.route('/api').get(pages.api);
  app.route('/:url(api|auth|components|app|assets)/*').get(errors[404]);
};
