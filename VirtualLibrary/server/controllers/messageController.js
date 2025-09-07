const Message = require('../models/messageModel')
const factory = require('./handlerFactory')

exports.addMessage = factory.createOne(Message)
exports.getMessages = factory.getAll(Message)
