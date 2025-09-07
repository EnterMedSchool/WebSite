const passport = require('passport')
const dotenv = require('dotenv')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/userModel')
dotenv.config()

module.exports = (app) => {
    app.use(passport.initialize())
    app.use(passport.session())
    passport.use(User.createStrategy())
    passport.serializeUser(function (user, done) {
        done(null, user.id)
    })
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user)
        })
    })

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.URL_BACKEND}/api/v1/users/auth/google/callback`,
                userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
                // passReqToCallback: true,
            },
            function (accessToken, refreshToken, profile, cb) {
                User.findOrCreate(
                    {
                        googleId: profile.id,
                        name: profile.displayName,
                        username: profile.id,
                        photo: profile.photos[0].value,
                    },
                    function (err, user) {
                        return cb(err, user)
                    }
                )
            }
        )
    )
}
