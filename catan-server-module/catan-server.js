var maps = {}; //channel name to map?
var playerData = {};

exports.handleBoardCreation = function createBoard(socket, currentRoom) {
	var hexagons;
	if (maps[currentRoom[socket.id]] != null) {
		hexagons = maps[currentRoom[socket.id]];
	} else {
		hexagons = createHexagons(); //Number, color
		maps[currentRoom[socket.id]] = hexagons;
	}
	console.log("Emitting Hexagons to Client ", socket.id);
	console.log(maps);
	socket.emit('newBoard', hexagons);
	return hexagons;
}

function createHexagons() {
	var colorCounts = [0, 0, 0, 0, 0];
	var numberCount = createNumberPool(); // i.e  -    The numbers 0 - 12, in their total numbers on the board
	var hexagons = []; // going to be added using the centers and calculations.

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



// function processLocationEvent(socket, locationInfo) {
// 	var user = locationInfo.user;
// 	var vertex = locationInfo.vertex;
// 	var houseType = locationInfo.houseType;

// 	mapVertices = maps[locationInfo.room][vertices];
// 	mapVertices[vertex].setFilled(user);

// 	if (houseType == "settlement") {
// 		playerData[user].incrementSettlement();
// 	} else {
// 		playerData[user].incrementCity();
// 	}

// 	socket.broadcast.to(locationInfo.room).emit('location', locationInfo);
// }

// function processVictoryCard() {

// }

// function drawCard(socket) {
// 	socket.on('draw', function(drawInformation) {
// 		incrementPlayerHand();
// 		decrementCardCount();
// 	})
// }