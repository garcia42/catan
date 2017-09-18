var hexagonData = {}; //Channel name to list
var vertexData = {};
var roadData = {};
var playerData = {}; //socket id to playerNumber

exports.handleBoardCreation = function createBoard(socket, currentRoom) {
	var hexagons;
	var vertices;
	var roads;
	if (hexagonData[currentRoom[socket.id]] != null) {
		hexagons = hexagonData[currentRoom[socket.id]];
		vertices = vertexData[currentRoom[socket.id]];
		roads = roadData[currentRoom[socket.id]];
	} else {
		vertexData[currentRoom[socket.id]] = createVertices();
		hexagonData[currentRoom[socket.id]] = createHexagons();
		roadData[currentRoom[socket.id]] = createRoads();
	}
	playerData[socket.id] = Object.keys(currentRoom).length - 1;
	console.log("Emitting Hexagons to Client ", socket.id);
	socket.emit('newBoard', {"playerIndex": playerData[socket.id], "hexagons": hexagons, "vertices": vertices});
	return hexagons;
}

function createHexagons() {
	var colorCounts = [0, 0, 0, 0, 0];
	var numberCount = createNumberPool(); // i.e  -    The numbers 0 - 12, in their total numbers on the board
	var hexagons = []; // going to sbe added using the centers and calculations.

	var robber = Math.floor(Math.random()*18);
	var color;
	var number;

	for (var i = 0; i <= 18; i++) {

		if (i == robber) {
            color = 5;
            number = ""
        } else {
        	color = getRandomColorNumber(colorCounts);
        	number = getNextNumber(numberCount);
        }

        hexagons.push({"color": color, "number": number});
	}
	return hexagons;
}

function createVertices() {
	var vertices = [];
	for (var i = 0; i < 54; i++) {
		vertices.push({"id": 0, "houseType": 0});
	}
	return vertices;
}

//Id is the socket id of the owner? or the player
function createRoads() {
	var roads = [];
	for (var i = 0; i < 72; i++) {
		roads.push({"id": 0});
	}
	return roads;
}

function createNumberPool() {
	var numberCount = [];
	for (i = 2; i <= 12; i++) {
	    if (i == 7) {
	        continue;
	    }
	    if (i == 2 || i == 12) {
	        numberCount.push(i);
	    } else {
	        numberCount.push(i);
	        numberCount.push(i);
	    }
	}
	return numberCount;
}

//Getting the next number for a hexagon
function getNextNumber(numberCount) {
    var random = Math.floor(Math.random()*numberCount.length);
    var toReturn = numberCount[random];
    numberCount.splice(random, 1);
    return toReturn;
}

//Do not currently have support for adjacent squares not being of same type.
function getRandomColorNumber(colorCount) {
    var randomNumber = Math.floor(Math.random()*5);
    if (colorCount[randomNumber] > 3) {
        return getRandomColorNumber(colorCount);
    } else {
        colorCount[randomNumber] += 1;
        return randomNumber;
    }
}

exports.handleHousePlacement = function(socket, currentRoom, locationInfo) {
	console.log("Location Info ", locationInfo);
	var vertexId = locationInfo["id"];

	var specificVertex = vertexData[currentRoom[socket.id]][vertexId];
	specificVertex["id"] = playerData[socket.id];
	specificVertex["houseType"] = locationInfo["houseType"];

	locationInfo["playerIndex"] = playerData[socket.id];
	socket.broadcast.to(currentRoom[socket.id]).emit('vertex', locationInfo);
}

exports.handleRoadPlacement = function(socket, currentRoom, roadInfo) {
	console.log("Road Info ", roadInfo);
	var roadId = roadInfo["id"];
	roadData[currentRoom[socket.id]][roadId] = playerData[socket.id];
	roadInfo["playerIndex"] = playerData[socket.id];
	socket.broadcast.to(currentRoom[socket.id]).emit("road", roadInfo);
}

// function processVictoryCard() {

// }

// function drawCard(socket) {
// 	socket.on('draw', function(drawInformation) {
// 		incrementPlayerHand();
// 		decrementCardCount();
// 	})
// }