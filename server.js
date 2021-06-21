var express = require('express');
var app = express();
const bodyParser  = require('body-parser');
const mongoose = require('mongoose');
const sessionStorage = require('sessionstorage');
const session = require('express-session');

const User= require('./models/user');
const SessionObject = require('./models/session');

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const passport = require('passport');
const { Session } = require('express-session');
var userProfile;

app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }
  }));

// ==== SET PASSPORT ===
passport.serializeUser(function (user, done) {
    console.log('serializing', user)
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log('deserializing', user);
    done(null, user);
});

passport.use(new GoogleStrategy(
    {
        clientID: '659897565100-j95a63onol6ioqv5octuupj0of49kkeq.apps.googleusercontent.com',
        clientSecret: 'CENjYuljGR5DZBO6dt9u300Y',
        callbackURL: "/auth/google/redirect"
    },
    function (accessToken, refreshToken, profile, done) {
        const user = new User({
            id: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value
        })

        const session = new SessionObject({
            accessToken: accessToken,
            refreshToken: refreshToken
        });
        session.save().then(res => console.log(res));
        userProfile = profile;
        user.save().then((res) => {
            sessionStorage.setItem('userId', res._id);
            return done(null, userProfile);
        })
    }
));
// ==== END PASSPORT ====

// ==== DATABASE ====
mongoose.connect('mongodb://localhost/projeto_sgi', {useNewUrlParser: true});
mongoose.connection.once('open',function(){
    console.log('Database connected Successfully');
}).on('error',function(err){
    console.log('Error', err);
})

// ==== END DATABASE ====

// Check if user is Authenticated
function ensureAuthenticated(req, res, next) {
    console.log('user', req.session);
    if (!sessionStorage.getItem('userId')) {
        res.redirect('/not-authenticated')
    } else {
        User.findById(sessionStorage.getItem('userId'), (err, user) => {
            if (user){
                userProfile = user;
                return next();
            }
            if (err) {
                res.redirect('/not-authenticated')
            }
        });
    }
    
    
}

// Routes
app.get('/', (req, res) => {
    res.render('pages/welcome');
});

app.get('/login', (req, res) => {
    res.render('pages/login')
})

app.get('/home', ensureAuthenticated, (req, res) => {
    res.render('pages/home', {
        user: userProfile
    });
})

app.get('/not-authenticated', (req, res) => {
    res.render('pages/not-authenticated');
})
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/redirect',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function (req, res) {
        res.redirect('/home');
});

app.listen(3000);
console.log('Server is listening on port 3000');