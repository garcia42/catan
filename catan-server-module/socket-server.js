var socketio = require('socket.io')
var chatServer = require('./chat-server')
var io

exports.listen = function (server) {
  console.log('In Listen function in Socket Server')
  io = socketio.listen(server)

  // io.set('log level', 1);
  io.sockets.on('connection', function (socket) {
    console.log('Socket Server Connection ', socket.id)
    chatServer.onConnection(socket, io) // Initialize the chat server
  })

  return io
}
