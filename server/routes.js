'use strict';
const errors = require('./components/errors');
const pages = require('./components/pages');

module.exports = (app) => {
  app.use('/auth', require('./auth'));
  app.use('/services', require('./api/services'));
  app.use((req, res, next) => {
    const m = /.*\/server\/((.*)[\?]\??(.*)?|(.*))/.exec(req.url);
    return m ? require('./api/service')(req, res) : next();
  });
  app.route('/api').get(pages.api);
  app.route('/:url(api|auth|components|app|assets)/*').get(errors[404]);
};
