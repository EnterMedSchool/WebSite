const express = require('express')
const messageController = require('../controllers/messageController')
// const { protect } = require('./../controllers/authController')
const router = express.Router()

router
    .route('/')
    .get(messageController.getMessages)
    .post(messageController.addMessage)

module.exports = router
