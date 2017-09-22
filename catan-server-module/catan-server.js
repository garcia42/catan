var hexagonData = {}; //Channel name to list
var vertexData = {};
var roadData = {};
var playerData = {}; //socket id to playerNumber
var robberData = {};
var playerTurn = {};

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
		hexagonData[currentRoom[socket.id]] = createHexagonData();
		var hexagons = createHexagonObjects(hexagonData[currentRoom[socket.id]]);
		var vertices = createVertexObjects(hexagons);
		var roads = createRoadObjects(vertices);
		roadData[currentRoom[socket.id]] = createRoads();
	}
	playerData[socket.id] = Object.keys(currentRoom).length - 1;
	console.log("Emitting Hexagons to Client ", socket.id);
	socket.emit('newBoard', {"playerIndex": playerData[socket.id], "hexagons": hexagons, "vertices": vertices});
	return hexagons;
}

function createHexagonData() {
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

function createHexagonObjects(hexagonServerData) {
    var radius = 50 * scale;
    var xp = 190;
    var yp = 110;
    var size = 5;
    var hexagons = [];

    //Calculate the center positions of each hexagon 
    var points = [];
    var count = 0;
    for (var i = Math.floor(size/2); i < size; i++) {
        for (var j = 0; j < size - count ; j++) {
            var x = xp + radius * j * 1.75 + (radius * count);
            var y = yp + radius * i * 1.5;
            points.push([x, y]); //Do self, then if not center, do mirrored row above
            hexagons.push(new Hexagon(hexagons.length, hexagonServerData[hexagons.length]['color'], hexagonServerData[hexagons.length]['number']));

            if (i > Math.floor(size/2)) {
                var yMirror = yp + (radius * 1.5) * (Math.floor(size/2) - count);
                points.push([x, yMirror]);
                hexagons.push(new Hexagon(hexagons.length, hexagonServerData[hexagons.length]['color'], hexagonServerData[hexagons.length]['number']));
            }
        }//for j
        count += 1;
    }//for i



    return [hexagons];
}

function createVertexObjects() {
	var vertices = [];
	//Set the hexagon radius
    var hexbin = d3.hexbin()
                .radius(radius);

    //x and y in this represent the actual centers of this hexagon
    var hexPoints = hexbin(points);
    console.log(hexbin(points));
    var corners = hexagon(radius);
    hexPoints.forEach(function(hexCenter, i) {
        for (var j = 0; j < 6; j++) {
            var x = hexCenter.x + corners[j+1][0];
            var y = hexCenter.y + corners[j+1][1];
            addVertex(vertices, hexagons, parseFloat(x.toFixed(0)), parseFloat(y.toFixed(0)), radius, i);
        }
    });
    addVertexNeighbors(vertices);
    return vertices;
}

function createRoadObjects(vertices) {
    var roads = [];
    for (i = 0; i < vertices.length; i++) {
        var x = vertices[i].getX();
        var y = vertices[i].getY();
        for (j = 0; j < vertices[i].getNeighbors().length; j++) {
            var x2 = vertices[i].getNeighbors()[j].getX();
            var y2 = vertices[i].getNeighbors()[j].getY();
            var road = new Road(x, y, x2, y2);
            var add = true;
            for (k = 0; k < roads.length; k++) {
                if (roads[k].isEqual(road)) {
                    add = false;
                    break;
                }
            }
            if (add) {
                roads.push(road);
            }
        }
    }
    return roads;
}

function addVertexNeighbors(vertices, radius) {

    var corners = hexagon(radius);
    vertices.forEach(function(vertex) {
        for (var i = 1; i < corners.length; i++) {
            var neighborX = (vertex.getX() + corners[i][0]);
            var neighborY = (vertex.getY() + corners[i][1]);
            vertices.forEach(function(neighborVertex) {
                if (Math.abs(neighborVertex.getX() - neighborX) < 1 && Math.abs(neighborVertex.getY() - neighborY) < 1) {
                    vertex.addNeighbor(neighborVertex);
                }
            });
        }
    });
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

exports.handleRobberPlacement = function(socket, currentRoom, robberInfo) {
	console.log("Robber Movement", robberInfo);
	robberData[currentRoom[socket.id]] = robberInfo["hexIndex"];
	socket.broadcast.to(currentRoom[socket.id]).emit("robberPlacement", robberInfo);
}

exports.handleBeginTurn = function(socket, currentRoom, turnInfo) {
	//Ask if player to go wants to activate card
	//Roll dice
		//Potentially move robber
	//Distribute cards

	dice = getDiceRoll();
	socket.broadcast.to(currentRoom[socket.id]).emit("roll", dice);
	if (dice[0] + dice[1] == 7) {
		robberEvent(socket);
	} else {
		distributeCards(socket, dice);
	}
}

function robberEvent(socket) {

}

function distributeCards(socket, dice) {

}

function getDiceRoll() {
    var one = Math.floor(Math.random()*6) + 1;
    var two = Math.floor(Math.random()*6) + 1;
    return [one, two];
}

// function processVictoryCard() {

// }

// function drawCard(socket) {
// 	socket.on('draw', function(drawInformation) {
// 		incrementPlayerHand();
// 		decrementCardCount();
// 	})
// }