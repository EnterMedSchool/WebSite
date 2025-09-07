const mongoose = require('mongoose')

module.exports = () => {
    const MONGO_URI = process.env.MONGO_URI
    mongoose
        .connect(MONGO_URI)
        .then(() => {
            // eslint-disable-next-line no-console
            console.log('DB connected!')
        })
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.log(err)
        })
}
