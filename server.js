var express = require('express');
var app = express();
const bodyParser  = require('body-parser');
const mongoose = require('mongoose');
const sessionStorage = require('sessionstorage');

const User= require('./models/user');

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const passport = require('passport');
const { Session } = require('express-session');
var userProfile;

app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ==== SET PASSPORT ===
passport.serializeUser(function (user, cb) {
    console.log('user', user)
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
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

        const session = new Session({
            
        })
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