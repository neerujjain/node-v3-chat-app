const path= require('path')
const http=require('http')
const express = require('express')
const publicDirectoryPath=path.join(__dirname,'../public')
const socketio= require('socket.io')
const Filter =require ('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} =require('./utils/users')

const app = express()
const server=http.createServer(app)
const io=socketio(server)
const port = process.env.PORT || 3002
app.use(express.static(publicDirectoryPath))

//server(emit)->client(recieve)-countupdated
//client(emit)->server(recieve)-increment
//io.emit->gives message to each user
//socket.emit->gives message one to one
//socket.broadcast.emit->gives mesage to everyone but the user 
io.on('connection',(socket)=>{
    
socket.on('join',({username,room},callback)=>{
    const {error,user}= addUser({ id:socket.id,username,room })
    if(error)
    {
        return callback(error)

    }

    socket.join(user.room)

    socket.emit('message',generateMessage('admin','welcome!'))
    socket.broadcast.to(user.room).emit('message',generateMessage('admin',`${user.username} has joined`))
    io.to(user.room).emit('roomdata',{
        room:user.room,
        users:getUsersInRoom(user.room)
    })


    callback()

    //socket.emit,io.emit,socket.broadcast.emit
    //io.to.emit,socket.broadcast.to.emit->to a specific room

})

    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter;
        
        if(filter.isProfane(message))
        {
            return callback('profanity is not allowed')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user)
        {
            io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left!`))
            io.to(user.room).emit('roomdata',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }

        // io.emit('message',generateMessage('user has left'))
    })
    socket.on('send_location',(coords,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps/?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    
})



server.listen(port, () => {
    console.log('Server is up on port ' + port)
})

