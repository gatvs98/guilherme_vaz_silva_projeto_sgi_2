var express = require('express');
var app = express();
const bodyParser  = require('body-parser');
const mongoose = require('mongoose');

const cookieSession = require("cookie-session");

const User= require('./models/user');

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const passport = require('passport');
let userProfile;

app.set('view engine', 'ejs');

const cookieKey = "2bcDhT6BNedQywiu";

app.use(cookieSession({
    keys:[cookieKey],
    maxAge: 60 * 60 * 1000
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



// ==== SET PASSPORT ===
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy(
    {
        clientID: '659897565100-j95a63onol6ioqv5octuupj0of49kkeq.apps.googleusercontent.com',
        clientSecret: 'CENjYuljGR5DZBO6dt9u300Y',
        callbackURL: "/auth/google/redirect"
    },
    function (accessToken, refreshToken, profile, done) {
        userProfile = {
            username: profile.displayName,
            email: profile.emails[0].value
        };
        User.findOne({'google.id': profile.id}).then((user) =>{
            if(user) {  
                return done(null, userProfile);
            } else {
                const newUser = new User({
                    google: profile
                })
                newUser.save().then((newUser) => {
                    return done(null, newUser);
                })
            }
        })
    }
));
// ==== END PASSPORT ====

// ==== DATABASE ====
mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});
mongoose.connection.once('open',function(){
    console.log('Database connected Successfully');
}).on('error',function(err){
    console.log('Error', err);
})

// ==== END DATABASE ====

// Check if user is Authenticated
function ensureAuthenticated(req, res, next) {
    if (!req.user || !userProfile) {
        res.redirect('/not-authenticated')
    } else {
        let user = userProfile;
        return next(null, user)
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
    let user = userProfile;
    console.log('IN HOME', user)
    res.render('pages/home', user);
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