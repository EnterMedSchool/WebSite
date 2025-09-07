const dotenv = require('dotenv')
dotenv.config()
const db = require('../config/db')
const Message = require('../models/messageModel')
const Task = require('../models/taskModel')
const Session = require('../models/sessionModel')

db()
;(async () => {
    await Message.deleteMany()
    await Task.deleteMany()
    await Session.deleteMany()
    process.exit(1)
})()
