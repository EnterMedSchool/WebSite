const express = require('express')
const sessionController = require('../controllers/sessionController')
const { protect } = require('./../controllers/authController')
const setUserInBody = require('../middlewares/setUserInBody')
const router = express.Router()

router
    .route('/')
    .post(protect, setUserInBody, sessionController.createSession)
    .get(sessionController.getAllSession)
router.get('/my-sessions', protect, sessionController.mySessions)
router.route('/:id').patch(sessionController.updateSession)
router.get('/:room_name', sessionController.getSession)
router.patch('/join/:id', sessionController.joinSession)
router.patch('/leave/:id', sessionController.leaveSession)

module.exports = router
