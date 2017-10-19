const Hexagon = require('./hexagon');
const Vertex = require('./vertex');
const d3 = require("d3");
require('./hexbin');
const Road = require('./road');
const PlayerCardsModule = require('./playerCards');
const PlayerCards = PlayerCardsModule.PlayerCards;
const order = PlayerCardsModule.order;
const Player = require('./player');
const Port = require('./port');

var largestArmy = {}; //CurrentRoom to playerIndex
var longestRoadData = {};
var hexagonData = {}; //Channel name to list
var vertexData = {};
var roadData = {};
var robberData = {};
var playerTurn = {};
var developmentCardData = {}; // Number of dev cards still left in a game
var roomData = {}; //currentRoom -> list of players in room
var portVertexData = {};
var resumeGameData = {};

var playerData = {}; //uuid to playerData
var playerCardData = {};

var scale = 1;
var radius = 50;
var indicesLeft = [0,1,2,3];

exports.handleBoardCreation = function createBoard(socket, uuid) {
	var radiusScaled = radius * scale;
    var currentRoom = playerData[uuid].getRoom();
	if (hexagonData[currentRoom] == null) {
        playerTurn[currentRoom] = 0;
		hexagonData[currentRoom] = createHexagonObjects(radiusScaled, currentRoom);
		vertexData[currentRoom] = createVertexObjects(hexagonData[currentRoom], radiusScaled);
		roadData[currentRoom] = createRoadObjects(vertexData[currentRoom]);
        developmentCardData[currentRoom] = createDevelopmentCards();
        portVertexData[currentRoom] = createPortVertices(vertexData[currentRoom]);
        largestArmy[currentRoom] = -1;
        longestRoadData[currentRoom] = -1;
        resumeGameData[currentRoom] = [];
	}


	console.log("Emitting Hexagons to Client ", socket.id);
	socket.emit('newBoard',
		{
			"playerIndex": playerData[uuid].getPlayerIndex(),
		 	"hexagons": hexagonData[currentRoom],
		  	"vertices": vertexData[currentRoom],
		  	"roads": roadData[currentRoom],
            "ports": portVertexData[currentRoom],
            "players": roomData[currentRoom],
            "robber": robberData[currentRoom]
		});
}

function createPortVertices(vertices) {
    var remainingResources = [0, 1, 2, 3, 4, 5, 5, 5, 5];
    var twoNeighbors = [];
    var inelligibleIds = [];
    var portVertices = [];
    var ports = [];
    vertices.forEach(function(vertex) {
        if (vertex.getNeighbors().length == 2) {
            twoNeighbors.push(vertex)
        }
    });

    while (portVertices.length < 18) {
        for (var i = 0; i < twoNeighbors.length; i++) {
            if (inelligibleIds.indexOf(twoNeighbors[i].getId()) == -1) {
                var chosenVertexId = twoNeighbors[i].getId();

                portVertices.push(chosenVertexId);
                inelligibleIds.push(chosenVertexId);

                var chosenNeighborId;
                if (inelligibleIds.indexOf(vertices[chosenVertexId].getNeighbors()[0]) == -1) {
                    chosenNeighborId = vertices[chosenVertexId].getNeighbors()[0];
                } else {
                    chosenNeighborId = vertices[chosenVertexId].getNeighbors()[1];
                }

                inelligibleIds = inelligibleIds.concat(vertices[chosenVertexId].getNeighbors());

                var neighbor2 = vertices[chosenNeighborId].getNeighbors();
                portVertices.push(chosenNeighborId);
                var portResource = remainingResources[Math.floor(Math.random()*remainingResources.length)];
                ports.push(new Port(chosenVertexId, chosenNeighborId, portResource));
                inelligibleIds = inelligibleIds.concat(neighbor2);
                break;
            }
        }
    }
    return ports;
}

function createDevelopmentCards() {
    //Order: knight, victory point, road building, monopoly, year of plenty
    return [14, 5, 2, 2, 2];
}

//Only method that needs to know currentRoom, others can get it from uuid
//Method will include playerIndex, created by chat server because it has more to do with joining and exiting chat rooms
exports.handlePlayerJoin = function handlePlayerJoin(io, socket, currentRoom, nickName, uuid) {
    if (playerData[uuid] == null) {
        createPlayerDataObject(currentRoom, nickName, uuid);
        emitPlayersToRestOfRoom(io, socket, currentRoom);
    }
    // console.log('PLAYERS IN ROOM', roomData[currentRoom]);
}

function emitPlayersToRestOfRoom(io, socket, currentRoom) {
    console.log('emit players', socket.id, currentRoom, roomData[currentRoom]);
    io.sockets.in(currentRoom).emit('newPlayer', roomData[currentRoom]);
    // socket.broadcast.to(currentRoom).emit('newPlayer', roomData[currentRoom]);
}

function createPlayerDataObject(currentRoom, nickName, uuid) {
    if (playerData[currentRoom] == null) {
        playerData[currentRoom] = {};
    }
    if (roomData[currentRoom] == null) {
        roomData[currentRoom] = [];
    }
    var player = new Player(roomData[currentRoom].length, nickName, currentRoom, new PlayerCards(roomData[currentRoom].length));
    playerData[uuid] = player;
    roomData[currentRoom].push(player);
}

//Hexagon creation with color, number and center
//Do rows, if row exists across y axis then create that in same loop
function createHexagonObjects(radius, currentRoom) {
    var xp = 190 + 95;
    var yp = 110 + 40;
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

    robberData[currentRoom] = hexagons.map(h => h.getResource()).indexOf(5); //5 is the desert

    return hexagons;
}

function createVertexObjects(hexagons, radius) {
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
    addVertexNeighbors(vertices, radius);
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
    for (var i = 0; i < vertices.length; i++) {
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
                road.setId(roads.length);
                vertices[i].addRoad(road.getId());
                vertices[vertices[i].getNeighbors()[j]].addRoad(road.getId());
                road.addEndpoint(vertices[i].getId());
                road.addEndpoint(vertices[vertices[i].getNeighbors()[j]].getId());
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
            var neighborX = parseFloat(vertex.getX()) + corners[i][0];
            var neighborY = parseFloat(vertex.getY()) + corners[i][1];
            vertices.forEach(function(neighborVertex) {
                if (Math.abs(neighborVertex.getX() - neighborX) <= 1 && Math.abs(neighborVertex.getY() - neighborY) <= 1) {
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











exports.handleBuyDevelopmentCard = function(io, socket, currentRoom, payload) {
    var playerIndex = payload["playerIndex"];
    var uuid = payload["uuid"];
    console.log("Buy Dev Card", "uuid", uuid, "playerIndex", playerIndex);
    var devCards = developmentCardData[currentRoom];
    var sum = devCards.reduce(add, 0);
    var cardRandom = Math.floor(Math.random()*sum); //Choose random index in list to determine which card to get
    var index = 0;
    if (sum == 0) {
        socket.emit('noMoreDevCards', null);
        return;
    }
    while (cardRandom >= 0) {
        if (cardRandom - devCards[index] > 0) {
            cardRandom -= devCards[index]
        } else if (devCards[index] > 0) {
            if (index == 1) {
                handleVictoryPointChange(io, uuid, currentRoom);
            }

            devCards[index] -= 1;
            playerData[uuid].getCards().addResourceAmount(5 + index, 1);
            io.sockets.in(currentRoom).emit('cards', roomData[currentRoom].map(i => i.getCards()));
            return;
        }
        index ++;
    }
}

function add(a, b) {
    return a + b;
}

function handleVictoryPointChange(io, uuid, currentRoom) {
    playerData[uuid].incrementVictoryPoints();
    var listOfVp = roomData[currentRoom].map(i => i.getVictoryPoints());
    console.log("Emitting Victory Point Data to ", currentRoom, listOfVp);
    io.sockets.in(currentRoom).emit('victoryPoint', listOfVp);
}

exports.handleShineCities = function(socket, currentRoom, payload) {
    var playerIndex = payload["playerIndex"];
    var uuid = payload["uuid"];
    console.log("Shine Cities", "uuid", uuid, "playerIndex", playerIndex);

    if (playerData[uuid].getCitiesUsed() >= 4) {
        socket.emit('shineCities', []);
        return;
    }

    var vertices = vertexData[currentRoom];
    var shineCities = [];
    vertices.forEach(function(vertex) {
        if (vertex.getHouseType() == 1 && vertex.getPlayerIndex() == playerIndex) {
            shineCities.push(vertex.getId());
        }
    })
    socket.emit('shineCities', shineCities);
}

//type will be 0 for beginning of game, will be 1 for in turns
exports.handleShineSettlements = function(socket, currentRoom, settlementInfo) {
    var uuid = settlementInfo['uuid'];
    var playerIndex = settlementInfo["playerIndex"];
    var type = settlementInfo["type"];
    console.log('Shine Settlements', "uuid", uuid, "playerIndex", playerIndex, "type", type);

    var vertices = vertexData[currentRoom];
    var shineSettlements = [];

    if (playerData[uuid].getHousesUsed() >= 5) { //Max number of houses
        socket.emit('shineSettlements', []);
        return;
    }

    vertices.forEach(function(vertex) { //All free open spaces for a house
        if (vertex.getPlayerIndex() == -1) {
            var add = true;
            vertex.getNeighbors().forEach(function(vertexNeighborIndex) {
                if (vertices[vertexNeighborIndex].getPlayerIndex() != -1) {
                    add = false;
                }
            });
            if (add) {
                shineSettlements.push(vertex.getId());
            }
        }
    });

    if (type == 1) { //Remove spaces that aren't next to a road
        var shineSettlementsInGame = [];
        var roads = roadData[currentRoom];
        shineSettlements.forEach(function(vertexIndex, i) {
            var vertexRoads = vertices[vertexIndex].getRoads();
            for (var j = 0; j < vertexRoads.length; j++) {
                if (roads[vertexRoads[j]].getPlayerIndex() == playerIndex) {
                    shineSettlementsInGame.push(vertexIndex);
                    break;
                }
            }
        });
        socket.emit('shineSettlements', shineSettlementsInGame);
    } else {
        socket.emit('shineSettlements', shineSettlements);
    }
}


exports.handleShineRoads = function(io, socket, currentRoom, payload) {

    var uuid = payload["uuid"];
    var playerIndex = payload["playerIndex"];
    var type = payload["type"];
    console.log("Shine Roads", "uuid", uuid, "playerIndex", playerIndex);

    if (playerData[uuid].getRoadsUsed() >= 15) { // Max number of roads
        console.log('Built the max number of roads');
        shineRoads = [];
        socket.emit("shineRoads", shineRoads);
        return;
    }

    var vertices = vertexData[currentRoom];
    var roads = roadData[currentRoom];
    var shineRoads = [];
    vertices.forEach(function(vertex, i) { //free roads around owned vertices
        if (vertex.getPlayerIndex() == playerIndex) {
            vertex.getRoads().forEach(function(roadIndex) {
                if (roads[roadIndex].getPlayerIndex() == -1) {
                    shineRoads.push(roadIndex);
                }
            })
        }
    });

    roads.forEach(function(road, i) { //free roads around owned roads
        if (road.getPlayerIndex() == playerIndex) {
            road.getEndpoints().forEach(function(vertexEndpoint) {
                vertices[vertexEndpoint].getRoads().forEach(function(neighborRoad) {
                    if (roads[neighborRoad].getPlayerIndex() == -1) {
                        shineRoads.push(neighborRoad);
                    }
                });
            });
        }
    })

    if (type == "road building") {
        if (playerData[uuid].getCards().getResourceAmount(7) > 0) {
            playerData[uuid].getCards().subtractResourceAmount(7, 1);
            io.sockets.in(currentRoom).emit('cards', roomData[currentRoom].map(i => i.getCards()));
        } else {
            shineRoads = [];
        }
    }
    socket.emit("shineRoads", shineRoads);
}

exports.handleHousePlacement = function(io, socket, currentRoom, locationInfo) {
	var vertexId = locationInfo["id"];
    var uuid = locationInfo["uuid"];
    var playerIndex = playerData[uuid].getPlayerIndex();
    var specificVertex = vertexData[currentRoom][vertexId];
    console.log("House Placement", "uuid", uuid, "playerIndex", playerIndex, 'specificVertex', vertexId);

	specificVertex.setPlayerIndex(playerIndex);
	locationInfo["type"] = specificVertex.upgradeHouse(); //returns house type
    if (specificVertex.getHouseType() == 2) {
        playerData[uuid].incrementCitiesUsed();
    } else {
        playerData[uuid].incrementHousesUsed();
    }

	locationInfo["playerIndex"] = playerIndex;

    handleVictoryPointChange(io, uuid, currentRoom);
    io.sockets.in(currentRoom).emit('vertex', locationInfo);
}

exports.handleRoadPlacement = function(io, socket, currentRoom, roadInfo) {
    var uuid = roadInfo["uuid"];
    var playerIndex = playerData[uuid].getPlayerIndex();
	var roadId = roadInfo["id"];
    console.log("Road Placement", "uuid", uuid, "playerIndex", playerIndex, 'roadId', roadId);

	roadData[currentRoom][roadId].setPlayerIndex(playerIndex);
	roadInfo["playerIndex"] = playerIndex;

    var curLongestChain = 0;
    getAllVerticesOfPlayer(vertexData[currentRoom], roadData[currentRoom], playerIndex).forEach(function(vertexIndex) {
        curLongestChain = Math.max(dfsOnVertex(vertexData[currentRoom], roadData[currentRoom], vertexIndex, playerData[uuid].getPlayerIndex()), curLongestChain);
    });
    if (playerData[uuid].incrementLongestRoad(curLongestChain, roomData[currentRoom].map(p => p.getLongestRoad()))) {
        var oldPlayer = getPlayer(currentRoom, longestRoadData[currentRoom]);
        if (oldPlayer != null) {
            oldPlayer.victoryPoints -= 2;
        }
        longestRoadData[currentRoom] = playerData[uuid].getPlayerIndex();
        playerData[uuid].incrementVictoryPoints();
        playerData[uuid].incrementVictoryPoints();
    }
    emitPlayersToRestOfRoom(io, socket, currentRoom);
    io.sockets.in(currentRoom).emit('road', roadInfo);
}

// Do DFS on every vertex of this color, return largest value found
function dfsOnVertex(vertices, roads, vertexId, playerIndex) {
    var queue = [[parseInt(vertexId), [parseInt(vertexId)]]]; //[vertexLeftOffOn, path]
    //Visited List will be your path, if vertex is in your path then it's been seen already
    var curLongest = 0;
    while (queue.length > 0) {
        var curItem = queue.slice()[0];
        queue.splice(0, 1); // Remove first element
        var curVertex = curItem[0];
        var curPath = curItem[1];
        var connectedVertices = getVerticesConnectedByColor(playerIndex, roads, vertices[curVertex]);

        connectedVertices.forEach(function(neighborIndex) {
            if (curPath.indexOf(neighborIndex) == -1) {
                var newPath = curPath.slice();
                newPath.push(neighborIndex);
                queue.unshift([neighborIndex, newPath]); //put at front
            }
        });

        curLongest = Math.max(curLongest, curPath.length);
    }
    return curLongest - 1;
}

//Includes vertices that they have a road on
function getAllVerticesOfPlayer(vertices, roads, playerIndex) {
    var playersVertices = [];
    for (var i in vertices) {
        if (getVerticesConnectedByColor(playerIndex, roads, vertices[i]).length > 0) {
            playersVertices.push(i)
        }
    }
    return playersVertices;
}

function getVerticesConnectedByColor(playerIndex, roadsDict, vertex) {
    var vertices = [];
    vertex.getRoads().forEach(function(roadIndex) {
        if (roadsDict[roadIndex].getPlayerIndex() == playerIndex) {
            var indexOfSelf = roadsDict[roadIndex].getEndpoints().indexOf(vertex.getId());
            vertices.push(roadsDict[roadIndex].getEndpoints()[1 - indexOfSelf]); // This is an xor :D
        }
    });
    return vertices;
}

exports.handleBeginTurn = function(io, socket, currentRoom, turnInfo) {
	//Ask if player to go wants to activate card
	//Roll dice
		//Potentially move robber
	//Distribute cards
    var uuid = turnInfo['uuid'];
    playerTurn[currentRoom] = (1 + playerTurn[currentRoom]) % roomData[currentRoom].length;
    io.sockets.in(currentRoom).emit("whoseTurn", playerTurn[currentRoom]);
    var player = getPlayer(currentRoom, playerTurn[currentRoom]);
    if (player.getCards().hasKnight()) {
        //Ask them if they want to play the knight before the turn
        //TODO
        askIfUseKnight(playerTurn[currentRoom], socket);
        handleMainTurnPhase(io, currentRoom);
    } else {
        handleMainTurnPhase(io, currentRoom);
    }
}

function askIfUseKnight(turn, socket) {
    socket.emit('ifUseKnight', turn);
}

function handleMainTurnPhase(io, currentRoom) {
    console.log("Handle Begin Turn");
    dice = getDiceRoll();
    io.sockets.in(currentRoom).emit('dice', dice);
    if (dice[0] + dice[1] == 7) {
        console.log("ROBBER!!!");
        robberEvent(io, currentRoom);
    } else {
        distributeCards(io, dice[0] + dice[1], currentRoom);
    }
}

function robberEvent(io, currentRoom) {
    //Disable all buttons for everyone on start except resource buttons for those with > 7, on end enable buttons for person whose turn it is?
    io.sockets.in(currentRoom).emit('whoseTurn', -1);
    io.sockets.in(currentRoom).emit('7deadlySins', roomData[currentRoom].map(p => p.getCards()));
}

exports.resumeGameFromRobberEvent = function(io, currentRoom, robbedData) {
    var uuid = robbedData['uuid'];
    var cards = robbedData['cards'];
    console.log('resumeGame', 'uuid', uuid, 'cards', cards);
    if (cards != null) {
        playerData[uuid].getCards().robbered(cards);
    }
    resumeGameData[currentRoom].push(playerData[uuid].getPlayerIndex());
    if (resumeGameData[currentRoom].length == roomData[currentRoom].length) { //Resume Game
        console.log('enough players have finished being robbered to resume game');
        resumeGameData[currentRoom] = [];
        io.sockets.in(currentRoom).emit('cards', roomData[currentRoom].map(p => p.getCards())); //The knight then moves here in the UI
        io.sockets.in(currentRoom).emit('whoseTurn', playerTurn[currentRoom]);
    }
}

function getPlayer(currentRoom, index) {
    var roomDataIndex = roomData[currentRoom].map(i => i.getPlayerIndex()).indexOf(index);
    return roomData[currentRoom][roomDataIndex];
}

function distributeCards(io, dice, currentRoom) {
	//Emit to whole room the new cards that people have
    var hexagons = hexagonData[currentRoom];
    var vertices = vertexData[currentRoom];
    hexagons.forEach(function(hexagon, i) {
        if (hexagon.getDiceNumber() == dice) {
            hexagon.getVertices().forEach(function(vertexIndex) {
                var vertex = vertices[vertexIndex];
                if (vertex.getPlayerIndex() != -1) { //Add cards to player card data
                    getPlayer(currentRoom, vertex.getPlayerIndex()).getCards().addResourceAmount(hexagon.getResource(), vertex.getHouseType());
                }
            });
        }
    });
    io.sockets.in(currentRoom).emit('cards', roomData[currentRoom].map(i => i.getCards()));
}

function getDiceRoll() {
    var one = Math.floor(Math.random()*6) + 1;
    var two = Math.floor(Math.random()*6) + 1;
    return [one, two];
}

exports.handleNameChangeAttempts = function(io, socket, previousName, name, uuid, currentRoom) {
    console.log('io', io, 'previousName', previousName, 'name', name, 'uuid', uuid, 'currentRoom', currentRoom, 'socket.id', socket.id);
    playerData[uuid].name = name;
    emitPlayersToRestOfRoom(io, socket, currentRoom);
}

exports.handleMonopoly = function(io, socket, currentRoom, monopolyData) {
    var resourceName = order[monopolyData["resource"]];
    var uuid = monopolyData['uuid'];
    console.log("monopoly", resourceName, uuid);
    var totalCards = 0;
    roomData[currentRoom].forEach(function(player) {
        if (playerData[uuid].getPlayerIndex() != player.getPlayerIndex()) {
            totalCards += player.getCards().monopolyResource(monopolyData['resource']);
        }
    })
    if (playerData[uuid].getCards().getResourceAmount(8) > 0) { //Can't use if have 0
        playerData[uuid].getCards().subtractResourceAmount(8, 1); //Monopoly - 8 will always happen
        playerData[uuid].getCards().addResourceAmount(monopolyData['resource'], totalCards);
    }
    io.sockets.in(currentRoom).emit('cards', roomData[currentRoom].map(i => i.getCards()));
}

exports.handleYearOfPlenty = function(io, socket, currentRoom, yearOfPlentyData) {
    var resourceName = order[yearOfPlentyData["resource"]];
    var uuid = yearOfPlentyData['uuid'];
    console.log("Year of Plenty", resourceName, uuid);
    if (playerData[uuid].getCards().getResourceAmount(9) > 0) { //Can't use if have 0
        playerData[uuid].getCards().subtractResourceAmount(9, 1); //Year of Plenty - 9
        playerData[uuid].getCards().yearOfPlenty(yearOfPlentyData['resources']);
    }
    io.sockets.in(currentRoom).emit('cards', roomData[currentRoom].map(i => i.getCards()));
}

//Relies on FE to make sure they don't have any knights
exports.handleRobberPlacement = function(io, socket, currentRoom, robberInfo) {
    var uuid = robberInfo['uuid'];
    console.log("Robber Movement", robberInfo);
    robberData[currentRoom] = robberInfo["hexIndex"];
    // robberInfo["playerIndex"] = playerData[socket.id];
    socket.broadcast.to(currentRoom).emit("robberPlacement", robberInfo);

    var adjVertices = hexagonData[currentRoom][robberInfo['hexIndex']].getVertices();
    var occupiedVertices = adjVertices.filter(function(vertex) {
        return vertexData[currentRoom][vertex].getPlayerIndex() != -1;
    });
    playerData[uuid].getCards().subtractResourceAmount(5, 1);// knight is 5, will be shown on FE when anyone is robbed
    if (playerData[uuid].incrementKnightsUsed(roomData[currentRoom].map(p => p.knightsUsed))) { //True if user has largestArmy
        if (largestArmy[currentRoom] != playerData[uuid].getPlayerIndex()) {
            console.log('new largestArmy owner');
            playerData[uuid].incrementVictoryPoints();
            playerData[uuid].incrementVictoryPoints();
            var oldPlayer = getPlayer(currentRoom, largestArmy[currentRoom]);
            if (oldPlayer != null) {
                oldPlayer.victoryPoints -= 2;
            }
            largestArmy[currentRoom] = playerData[uuid].getPlayerIndex();
        }
    }
    emitPlayersToRestOfRoom(io, socket, currentRoom);
    socket.emit('shineRobberSettlements', occupiedVertices); //Shine to robbing player the victims
}

exports.handleRobberEvent = function(io, socket, currentRoom, robberInfo) {
    var vertex = robberInfo['id'];
    var uuid = robberInfo['uuid'];
    var robberedPlayer = getPlayer(currentRoom, vertexData[currentRoom][vertex].getPlayerIndex());
    var robbedResource = robberedPlayer.getCards().rob();
    if (robbedResource > -1) {
        playerData[uuid].getCards().addResourceAmount(robbedResource, 1);
    }
    console.log('Robber Stole from someone', 'uuid', uuid, 'vertex', vertex, 'robbedResource', robbedResource, 'robberedPlayer', robberedPlayer);
    io.sockets.in(currentRoom).emit('cards', roomData[currentRoom].map(i => i.getCards()));
}