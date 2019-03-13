var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function (User, config) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, (email, password, done) => {
    User.findOne({
      email: email
    }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'This user is not registered.', code: 'none' });
      if (user.idle) return done(null, false, { message: '.', code: 'idle' });

      
      if (!user.authenticate(password)) return done(null, false, { message: 'This password is not correct.' });



      return done(null, user);
    });
  }));
};
