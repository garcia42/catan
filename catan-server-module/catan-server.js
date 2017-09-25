const Hexagon = require('./hexagon');
const Vertex = require('./vertex');
const d3 = require("d3");
require('./hexbin');
const Road = require('./road')

var hexagonData = {}; //Channel name to list
var vertexData = {};
var roadData = {};
var playerData = {}; //socket id to playerNumber
var robberData = {};
var playerTurn = {};

exports.handleBoardCreation = function createBoard(socket, currentRoom) {
	if (hexagonData[currentRoom[socket.id]] == null) {
		hexagonData[currentRoom[socket.id]] = createHexagonObjects();
		vertexData[currentRoom[socket.id]] = createVertexObjects(hexagonData[currentRoom[socket.id]]);
		roadData[currentRoom[socket.id]] = createRoadObjects(vertexData[currentRoom[socket.id]]);
	}


	playerData[socket.id] = Object.keys(currentRoom).length - 1;
	console.log("Emitting Hexagons to Client ", socket.id);
	socket.emit('newBoard', 
		{
			"playerIndex": playerData[socket.id],
		 	"hexagons": hexagonData[currentRoom[socket.id]],
		  	"vertices": vertexData[currentRoom[socket.id]],
		  	"roads": roadData[currentRoom[socket.id]]
		});
	// return hexagons;
}

//Hexagon creation with color, number and center
//Do rows, if row exists across y axis then create that in same loop
function createHexagonObjects() {
    var radius = 50;
    var xp = 190;
    var yp = 110;
    var size = 5;
    var hexagons = [];
    var colorCounts = [0, 0, 0, 0, 0];
    var robberIndex = Math.floor(Math.random()*18);
    var numberCount = createNumberPool(robberIndex); // i.e  -    The numbers 0 - 12, in their total numbers on the board

    //Calculate the center positions of each hexagon 
    var count = 0;
    for (var i = Math.floor(size/2); i < size; i++) {
        for (var j = 0; j < size - count ; j++) {
            var x = xp + radius * j * 1.75 + (radius * count);
            var y = yp + radius * i * 1.5;
            hexagons.push(new Hexagon(hexagons.length,
            	getRandomColorNumber(colorCounts, hexagons.length, robberIndex),
            	getNextNumber(numberCount, hexagons.length, robberIndex),
            	[x, y]));

            if (i > Math.floor(size/2)) {
                var yMirror = yp + (radius * 1.5) * (Math.floor(size/2) - count);
            	hexagons.push(new Hexagon(hexagons.length,
            		getRandomColorNumber(colorCounts, hexagons.length, robberIndex),
            		getNextNumber(numberCount, hexagons.length, robberIndex),
            		[x, yMirror]));
        	}
        }//for j
        count += 1;
    }//for i


    return hexagons;
}

function createVertexObjects(hexagons) {
	var radius = 50;
	var vertices = [];
	//Set the hexagon radius
    var hexbin = d3.hexbin()
        .radius(radius);

    var points = [];
    hexagons.forEach(function(hexagon, i) {
    	points.push(hexagon.getCenter());
    });

    //x and y in this represent the actual centers of this hexagon
    var hexPoints = hexbin(points);
    var corners = hexagon(radius);
    hexPoints.forEach(function(hexCenter, i) {
    	hexagons[i].setCenter([hexCenter.x, hexCenter.y]);
        for (var j = 1; j < corners.length; j++) {
            var x = parseFloat(hexCenter.x + corners[j][0]);
            var y = parseFloat(hexCenter.y + corners[j][1]);
            addVertex(vertices, hexagons, x.toFixed(0), y.toFixed(0), radius, i);
        }
    });
    addVertexNeighbors(vertices, 50);
    return vertices;
}

function addVertex(vertices, hexagons, xp, yp, radius, curHexagon) {
    var vertex = new Vertex(xp, yp, radius);
    var add = true;
    for (var j = 0; j < vertices.length; j++) {
        if (vertices[j].isEqual(vertex)) {
            add = false;
            vertices[j].addHexagon(curHexagon);
            hexagons[curHexagon].addVertex(vertices[j].getId());
            break;
        }
    }
    if (add) {
        vertex.addHexagon(curHexagon);
		vertex.setId(vertices.length);
        hexagons[curHexagon].addVertex(vertex.getId());
        vertices.push(vertex);
    }
}

function hexagon(radius) {
	var x0 = 0, y0 = 0;
	return d3_hexbinAngles.map(function(angle) {
	  var x1 = Math.sin(angle) * radius,
	      y1 = -Math.cos(angle) * radius,
	      dx = x1 - x0,
	      dy = y1 - y0;
	  x0 = x1, y0 = y1;
	  return [dx, dy];
	});
}

var d3_hexbinAngles = d3.range(0, 2 * Math.PI + Math.PI/3, Math.PI / 3);

function createRoadObjects(vertices) {
    var roads = [];
    for (i = 0; i < vertices.length; i++) {
        var x = vertices[i].getX();
        var y = vertices[i].getY();
        for (j = 0; j < vertices[i].getNeighbors().length; j++) {
            var x2 = vertices[vertices[i].getNeighbors()[j]].getX();
            var y2 = vertices[vertices[i].getNeighbors()[j]].getY();
            var road = new Road(x, y, x2, y2);
            var add = true;
            for (var k = 0; k < roads.length; k++) {
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
	console.log("BEGIN ADD NEIGHBOR");
    var corners = hexagon(radius);
    vertices.forEach(function(vertex) {
        for (var i = 1; i < corners.length; i++) {
            var neighborX = parseFloat(vertex.getX()) + corners[i][0];
            var neighborY = parseFloat(vertex.getY()) + corners[i][1];
            vertices.forEach(function(neighborVertex) {
                if (Math.abs(neighborVertex.getX() - neighborX) < 1 && Math.abs(neighborVertex.getY() - neighborY) < 1) {
                    vertex.addNeighbor(neighborVertex.getId());
                }
            });
        }
    });
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
function getNextNumber(numberCount, hexagonIndex, robberIndex) {
	if (hexagonIndex == robberIndex) {
		return ""; // Desert tile has no number, robber starts on desert
	}
    var random = Math.floor(Math.random()*numberCount.length);
    var toReturn = numberCount[random];
    numberCount.splice(random, 1);
    return toReturn;
}

//Do not currently have support for adjacent squares not being of same type.
function getRandomColorNumber(colorCount, hexagonIndex, robberIndex) {
	if (hexagonIndex == robberIndex) {
		return 5;
	}
    var randomNumber = Math.floor(Math.random()*5);
    if (colorCount[randomNumber] > 3) {
        return getRandomColorNumber(colorCount, hexagonIndex, robberIndex);
    } else {
        colorCount[randomNumber] += 1;
        return randomNumber;
    }
}

























exports.handleHousePlacement = function(socket, currentRoom, locationInfo) {
	var vertexId = locationInfo["id"];

	var specificVertex = vertexData[currentRoom[socket.id]][vertexId];
	specificVertex.setPlayerIndex(playerData[socket.id]);
	specificVertex.upgradeHouse();

	locationInfo["playerIndex"] = playerData[socket.id];
	console.log("Location Info ", locationInfo);
	socket.broadcast.to(currentRoom[socket.id]).emit('vertex', locationInfo);
}

exports.handleRoadPlacement = function(socket, currentRoom, roadInfo) {
	var roadId = roadInfo["id"];
	roadData[currentRoom[socket.id]][roadId].setPlayerIndex(playerData[socket.id]);
	roadInfo["playerIndex"] = playerData[socket.id];
	console.log("Road Info ", roadInfo);
	socket.broadcast.to(currentRoom[socket.id]).emit("road", roadInfo);
}

exports.handleRobberPlacement = function(socket, currentRoom, robberInfo) {
	console.log("Robber Movement", robberInfo);
	robberData[currentRoom[socket.id]] = robberInfo["hexIndex"];
	// robberInfo["playerIndex"] = playerData[socket.id];
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