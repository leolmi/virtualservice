var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function (User, config) {
  passport.use(new LocalStrategy({
    usernameField: 'name',
    passwordField: 'password' // this is the virtual field on the model
  }, (name, password, done) => {
    User.findOne({
      name: name
    }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'This user is not registered.' });
      if (!user.authenticate(password)) return done(null, false, { message: 'This password is not correct.' });
      return done(null, user);
    });
  }));
};
