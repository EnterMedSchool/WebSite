const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: [true, 'message is required'],
        },
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: [true, 'Session ID is required!'],
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender ID is required!'],
        },
    },
    { timestamps: true }
)
messageSchema.pre(/^find/, function (next) {
    this.populate('sender', 'name photo email')
    next()
})
module.exports = mongoose.model('Message', messageSchema)
