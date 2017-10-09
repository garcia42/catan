var catanServer = require('./catan-server');
var io;
var nickNames = {};
var namesUsed = [];
var guestNumber = 1;
var currentRoom = {};
var uuids = {}; //Nickname to UUID
var disconnecting = []; //List of nickNames that are disconnecting

exports.onConnection = function(socket, fieldio) {
	io = fieldio;

	handleRegister(socket, nickNames, guestNumber, namesUsed); //Join room, or set to old socket if returning user

	handleMessageBroadcast(socket, nickNames);
	handleNameChangeAttempts(socket, nickNames, namesUsed);
	handleRoomJoining(socket);

	socket.on('rooms', function() {
		socket.emit('rooms', io.sockets.adapter.rooms);
	});

	handleUserDisconnection(socket, nickNames, namesUsed);
	// socket.leave(socket.id); //Added this because sockets join a room of their own socket id.
	handleHousePlacement(io, socket, currentRoom);
	handleRoadPlacement(socket, currentRoom);
	handleRobberPlacement(socket, currentRoom);
	handleBeginTurn(io, socket, currentRoom);
	handleShineRoads(socket, currentRoom);
	handleShineSettlements(socket, currentRoom);
	handleShineCities(socket, currentRoom);
	handleBuyDevelopmentCard(io, socket, currentRoom);
};

function handleBuyDevelopmentCard(io, socket, currentRoom) {
	socket.on('buyDevCard', function(devCardData) {
		catanServer.handleBuyDevelopmentCard(io, socket, currentRoom[socket.id], devCardData);
	})
}

function handleShineCities(socket, currentRoom) {
	socket.on('shineCities', function(playerIndex) {
		catanServer.handleShineCities(socket, currentRoom[socket.id], playerIndex);
	})
}

function handleShineSettlements(socket, currentRoom) {
	socket.on('shineSettlements', function(settlementInfo) {
		catanServer.handleShineSettlements(socket, currentRoom[socket.id], settlementInfo);
	});
}

function handleShineRoads(socket, currentRoom) {
	socket.on('shineRoads', function(playerIndex) {
		catanServer.handleShineRoads(socket, currentRoom[socket.id], playerIndex);
	});
}

function handleRegister(socket, nickNames, guestNumber, namesUsed) {
	socket.on('register', function(uuid) {
		console.log("register, ", uuid);
		var storedName = null;
		for (var key in uuids) {
			if (uuids[key] == uuid) {
				storedName = key;
			}
		}
		console.log(storedName);
		if (!storedName) { //New User
			console.log("new User");
			guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
			joinRoom(socket, 'Lobby');
			uuids[nickNames[socket.id]] = uuid; //Nickname to uuid
		} else { //They do exist, remove from disconnecting, this is the new socket of the old player
			//nickname to this socket
			//room to this socket
			//remove old socket from
			var oldSocketId = null;
			for (key in nickNames) {
				if (nickNames[key] == storedName) {
					oldSocketId = key;
				}
			}
			var oldRoom = currentRoom[oldSocketId];

			console.log("Old User ", oldSocketId, oldRoom);

			disconnectOldSocket(oldSocketId, nickNames); //remove from disconnecting, remove old socket

			nickNames[socket.id] = storedName;
			currentRoom[socket.id] = oldRoom;
			namesUsed.push(storedName);

			console.log("New Nickname ", nickNames[socket.id], "new Room ", currentRoom[socket.id], "List of names used ", namesUsed);
		}

		catanServer.handlePlayerJoin(socket, currentRoom[socket.id]);
		catanServer.handleBoardCreation(socket, currentRoom[socket.id]);

	});
}

function handleBeginTurn(io, socket, currentRoom) {
	socket.on("beginTurn", function(turnInfo) {
		//TODO people can activate development cards before roll.
		catanServer.handleBeginTurn(io, socket, currentRoom[socket.id], turnInfo);
	});
}

function handleRobberPlacement(socket, currentRoom) {
	socket.on("robberPlacement", function(robberInfo) {
		catanServer.handleRobberPlacement(socket, currentRoom[socket.id], robberInfo);
	})
}

function handleHousePlacement(io, socket, currentRoom) {
	socket.on("vertex", function(locationInfo) {
		console.log(currentRoom, socket.id);
		catanServer.handleHousePlacement(io, socket, currentRoom[socket.id], locationInfo);
	});
}

function handleRoadPlacement(socket) {
	socket.on("road", function(roadInfo) {
		catanServer.handleRoadPlacement(socket, currentRoom[socket.id], roadInfo);
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
				uuids[name] = uuids[previousName];
				delete uuids[previousName];
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
		console.log("Chat Server: In Join Function new room: ", room, " current Room: ", currentRoom[socket.id]);
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room["newRoom"]);
		catanServer.handleBoardCreation(socket, currentRoom);
	});
}

function handleUserDisconnection(socket, nickNames) {
	socket.on('disconnect', function() {
		disconnecting.push(nickNames[socket.id]);

		setTimeout(function () {

			if (disconnecting.indexOf(nickNames[socket.id]) != -1) {
				//Delete nickname, nickname to uuid, names used, current room of that socket
				disconnectOldSocket(socket.id, nickNames);
			}

		}, 10000)
	});
}

function disconnectOldSocket(socketId, nickNames) {
	console.log("Disconnecting ", socketId);
	var index = disconnecting.indexOf(nickNames[socketId]);
	if (index > -1) {
		disconnecting.splice(index, 1);
	}

	index = namesUsed.indexOf(nickNames[socketId]);
	if (index > -1) {
		namesUsed.splice(index, 1);
	}
	delete nickNames[socketId];
	delete currentRoom[socketId];
	delete uuids[nickNames[socketId]];
}
