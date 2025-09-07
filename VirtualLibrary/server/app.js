const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const cors = require('cors')
//routes
const userRouter = require('./routes/userRoutes')
const sessionRouter = require('./routes/sessionRoutes')
const messageRouter = require('./routes/messageRoutes')
const taskRouter = require('./routes/taskRoutes')
//Global error handler
const globalErrorHandler = require('./controllers/errorController')
const AppError = require('./utils/appError')
const passport = require('./config/passport')
const app = express()

//Logger
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())
app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'https://be-better-frontend-naeemdev360.vercel.app',
        ],
        credentials: true,
        methods: 'GET,POST,PUT,DELETE,PATCH',
    })
)
app.use(
    session({
        secret: process.env.SECRET,

        saveUninitialized: false,
        resave: true,
    })
)
// Passport initialize
passport(app)

//Apis
app.use('/api/v1/users', userRouter)
app.use('/api/v1/sessions', sessionRouter)
app.use('/api/v1/messages', messageRouter)
app.use('/api/v1/tasks', taskRouter)

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)
module.exports = app
