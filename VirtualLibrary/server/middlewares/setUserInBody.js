module.exports = (req, res, next) => {
    if (req.user) req.body.user = req.user._id
    next()
}
