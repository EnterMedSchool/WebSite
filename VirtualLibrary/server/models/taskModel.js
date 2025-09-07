const mongoose = require('mongoose')
const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required!'],
        },
        tasks: [
            {
                name: String,
                isCompleted: Boolean,
            },
        ],
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: [true, 'Session id is required'],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User id is required'],
        },
    },
    { timestamps: true }
)

taskSchema.post('save', function (doc, next) {
    doc.populate('user', 'name photo').then(function () {
        next()
    })
})
taskSchema.pre(/^find/, function (next) {
    this.populate('user', 'name photo')
    next()
})

module.exports = mongoose.model('Task', taskSchema)
