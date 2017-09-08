var socketio = require('socket.io');
var io;
var nickNames = {};
var namesUsed = [];
var guestNumber = 1;
var currentRoom = {};

// Questions
// 1) How does currentRoom work? Feels like it should be different for diff users
// 2) How does emit 'message' and then broadcasting 'message' work?
// 3) Are socket.join and socket.leave helper functions?
// 4) what is io.sockets.manager.rooms?

exports.listen = function(server) {
	io = socketio.listen(server);

	// io.set('log level', 1);
	io.sockets.on('connection', function(socket) {
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		joinRoom(socket, 'Lobby');

		handleMessageBroadcast(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);

		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.adapter.rooms);
		});

		handleUserDisconnection(socket, nickNames, namesUsed);
	});
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	socket.guestNumber = guestNumber;
	var guestName = "Guest" + guestNumber;
	nickNames[socket.id] = guestName;
	namesUsed.push(guestName);
	socket.emit('nameResult', {success: true,
		name: guestName});
	return guestNumber + 1;
}

function joinRoom(socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit("joinResult", {room:room});
	socket.broadcast.to(room).emit('message', {text: nickNames[socket.id] + ' has joined ' + room + "."});

	var usersInRoom = io.sockets.adapter.rooms[room].sockets; 
	if (Object.keys(usersInRoom).length > 1) {
		var usersInRoomSummary = "Users currently in " + room + ": ";
		var j = 0;
		for (var userSocketId in usersInRoom) {
			if (userSocketId != socket.id) {
				if (j > 0) {
					usersInRoomSummary += ', ';
				}
				var client_socket = io.sockets.connected[userSocketId];
				usersInRoomSummary += nickNames[client_socket.id];
				j += 1;
			}
		}
		usersInRoomSummary += ".";
		socket.emit('message', {text: usersInRoomSummary});
	}
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) {
		if (name.indexOf("Guest") == 0) {
			socket.emit("nameResult", {success: false, message: 'Names cannot begin with "Guest".'});

		} else {
			if (namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit("nameResult", {success: true, name: name});

				socket.broadcast.to(currentRoom).emit('message', {text: previousName + " is now known as " + name + "."});
			} else {
				socket.emit({success: false, message: "Name Already Taken"});
			}
		}
	});
}

function handleMessageBroadcast(socket, nickNames) {
	socket.on('message', function(message) {
		socket.broadcast.to(message.room).emit('message', {text: nickNames[socket.id] + ": " + message.text});
	});
}

function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room);
	});
}

function handleUserDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}
