const http = require('http')
const dotenv = require('dotenv')
const { Server } = require('socket.io')
const app = require('./app')
const server = http.createServer(app)
const connectDB = require('./config/db')
//Initialize socker.io
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://be-better-frontend-naeemdev360.vercel.app',
        ],
        credentials: true,
    },
})
//initialize environment variables
dotenv.config()
//Connect mongodb database
connectDB()

//webSocket
io.on('connection', (socket) => {
    //Join user
    socket.on('join', (participant, roomId) => {
        socket.join(roomId)

        io.in(roomId).emit('join', participant)
    })
    socket.on('leave', (participant, roomId) => {
        socket.to(roomId).emit('leave', participant)
        socket.leave(roomId)
    })
    //messaging
    socket.on('message', (message, roomId) => {
        socket.to(roomId).emit('message', message)
    })
    //timer
    socket.on('tick', (tick, roomId) => {
        socket.to(roomId).emit('tick', tick)
    })

    //task
    socket.on('create', (tasks, roomId) => {
        socket.to(roomId).emit('create', tasks)
    })
    socket.on('update', (tasks, roomId) => {
        socket.to(roomId).emit('update', tasks)
    })
    socket.on('delete', (taskId, roomId) => {
        socket.to(roomId).emit('delete', taskId)
    })
    socket.on('task', (tasks, roomId) => {
        socket.to(roomId).emit('task', tasks)
    })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`App is listining on port ${PORT}`)
})
