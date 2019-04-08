const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

exports.setup = function (User, config) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, (email, password, done) => {
    User.findOne({
      email: email
    }, (err, user) => {
      // errore di autenticazione
      if (err) return done(err);
      // utente non censito
      if (!user) return done(null, false, { message: 'This user is not registered.', code: 'none' });
      // utente in attesa di conferma
      if (user.idle) return done(null, false, { message: '.', code: 'idle' });
      // verifica della password
      if (!user.authenticate(password)) return done(null, false, { message: 'This password is not correct.' });
      // ok
      return done(null, user);
    });
  }));
};
