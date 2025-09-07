const express = require('express')
const passport = require('passport')
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.post('/auth', authController.signInWithAuthO)
router.get(
    '/auth/google',
    passport.authenticate('google', {
        scope: ['profile'],
        prompt: 'select_account',
    })
)
router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: process.env.URL_FRONTEND,
    }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect(process.env.URL_FRONTEND)
    }
)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)
router.get('/getMeByEmail', userController.getUserByEmail)
// Protect all routes after this middleware
router.use(authController.protect)

router.patch('/updateMyPassword', authController.updatePassword)
router.get('/me', userController.getMe, userController.getUser)
router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
)
router.delete('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin'))

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router
