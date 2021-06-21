const express = require('express');
const app = express();
const session = require('express-session');
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const passport = require('passport');
var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET'
}));

app.get('/', function (req, res) {
    res.render('pages/auth');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));

app.get('/success', (req, res) => res.send(userProfile));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

// Setup qual a estratégia ser usada pelo passport. Neste caso, usaremos o Google
passport.use(new GoogleStrategy(
    {
        clientID: '659897565100-j95a63onol6ioqv5octuupj0of49kkeq.apps.googleusercontent.com',
        clientSecret: 'CENjYuljGR5DZBO6dt9u300Y',
        callbackURL: "/auth/google/redirect"
    },
    function (accessToken, refreshToken, profile, done) {
        userProfile = profile;
        return done(null, userProfile);
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/redirect',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function (req, res) {
        // Successful authentication, redirect success.
        res.redirect('/success');
    });