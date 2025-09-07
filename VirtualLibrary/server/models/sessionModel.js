const crypto = require('crypto')
const mongoose = require('mongoose')
const sessionSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        user: {
            // who created this session
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        sharedTime: {
            type: Date,
            default: new Date(),
        },

        token: String,
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        totalJoin: {
            type: Number,
            default: 0,
        },

        link: {
            type: String,
            unique: [true, 'This link is already taken!'],
        },
    },
    { timestamps: true }
)

sessionSchema.pre('save', function (next) {
    if (this.isNew) {
        this.token = crypto.randomBytes(10).toString('hex')
        this.link = `/${this.token}`
    }
    next()
})

module.exports = mongoose.model('Session', sessionSchema)
