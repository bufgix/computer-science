const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const bcrypt = require('bcryptjs');

module.exports = (passport) => {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },(email, password, done) => {
        // Match email
        if (email === "" || password === "") {
            return done(null, false, {message: "Tüm alanları doldurun"});
        }
        User.findOne({email: email}, (err, user) => {
            if (err) throw err;
            if(!user){
                return done(null, false, {message: 'Sanırım yanlış tuşa bastın. Tekrar dene istersen'});
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch){
                    return done(null, user, {message: 'Giriş yaptın'});
                }else {
                    return done(null, false, {message: 'Sanırım yanlış tuşa bastın. Tekrar dene istersen'});
                }
            })
        })
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    })
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        })
    })
} 