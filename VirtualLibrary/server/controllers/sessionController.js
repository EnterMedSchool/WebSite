const Session = require('../models/sessionModel')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')
const AppError = require('../utils/appError')
const APIFeatures = require('../utils/apiFeatures')

exports.getAllSession = catchAsync(async (req, res, next) => {
    // if user login then remove his/her session
    const filteredObj = req.user ? { user: { $ne: req.user?._id } } : {}
    if (req.query?.mysessions && req.user)
        filteredObj.user = { $eq: req.user?._id }
    const features = new APIFeatures(Session.find(filteredObj), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    // const doc = await features.query.explain();
    const sessions = await features.query
    const totalSessions = await Session.countDocuments(filteredObj)

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: sessions.length,
        totalSessions,
        data: {
            data: sessions,
        },
    })
})
exports.getSession = catchAsync(async (req, res, next) => {
    const session = await Session.findOne({
        link: `/${req.params.room_name}`,
    }).populate('participants', 'name email photo')
    if (!session) {
        return next(new AppError('No Session found with that name', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: session,
        },
    })
})

exports.mySessions = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(
        Session.find({ user: req.user._id }),
        req.query
    )
        .filter()
        .limitFields()
        .paginate()
        .sort()
    const sessions = await features.query
    const totalSessions = await Session.countDocuments({ user: req.user._id })

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: sessions.length,
        totalSessions,
        data: {
            data: sessions,
        },
    })
})
exports.joinSession = catchAsync(async (req, res, next) => {
    const { participantId } = req.body
    let session = await Session.findById(req.params.id)

    if (
        session.participants.map((id) => id.toString()).includes(participantId)
    ) {
        session = await session.populate('participants', 'photo name email')
        return res.status(200).json({
            status: 'success',
            data: {
                participants: session.participants,
            },
        })
    }

    session.participants.push(participantId)
    session.totalJoin += 1
    await session.save()
    session = await session.populate('participants', 'photo name email')
    res.status(200).json({
        status: 'success',
        data: {
            participants: session.participants,
        },
    })
})
exports.leaveSession = catchAsync(async (req, res, next) => {
    const { participantId } = req.body
    await Session.findByIdAndUpdate(req.params.id, {
        $pull: { participants: participantId },
    })
    res.status(200).json({
        status: 'success',
        data: {
            message: 'A participants has been leave',
        },
    })
})

exports.createSession = factory.createOne(Session)
exports.updateSession = factory.updateOne(Session)
exports.deleteSession = factory.deleteOne(Session)
