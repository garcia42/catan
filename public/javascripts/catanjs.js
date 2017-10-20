var scale = 1;
var containerWidth = 900 * scale;
var containerHeight = 600 * scale;
var h = (Math.sqrt(3)/2);
var radius = 50 * scale;

var svgContainer = 
    d3.select("body")
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight);
/*rsc = {
    0: WOOD 
    1: CLAY,
    2: WHEAT,
    3: SHEEP,
    4: ORE,
    5: DESERT
} */
var resourceEntries = ["wood", "brick", "sheep", "wheat", "ore"];
var portColors = ["rgba(0,102,0,1)", "rgba(255,0,0,1)", "rgba(0,255,0,1)", "rgba(255,255,0,1)", "rgba(96,96,96,1)", "rgba(255,255,204,1)"];
var hexagonColors = ["rgba(0,102,0,0.5)", "rgba(255,0,0,0.5)", "rgba(0,255,0,0.5)", "rgba(255,255,0,0.5)", "rgba(96,96,96,0.5)", "rgba(255,255,204,0.5)"];
var playerColors = ["red", "blue", "purple", "green"];
var devCards = ['Knight', 'Road building', 'Monopoly', 'Year of plenty', 'Victory point'];

var playerIndex = 0;

/*currentAction = {
    -1: no action
    0: knight 
    1: road building,
    2: monopoly,
    3: year of plenty,
    4: robber,
    5: build road action,
    6: build city action,
    7: build settlement action,
    8: trading
} */
var currentAction = -1;
var resourcesPicked = []; //Used for year of plenty
var resourcesToSteal = 0;
var roadBuildingCount = 0;
var blinkingHouses = [];

$(document).ready(function() {

    if (!localStorage.catan_uuid) {
        localStorage.catan_uuid = Math.random().toString(36).substring(3,16) + +new Date;
    }

    socket.emit('register', localStorage.getItem('catan_uuid'));

    socket.on('newBoard', function(serverData) {
        svgContainer.selectAll("*").remove();
        createHexagonsUi(serverData["hexagons"]);
        createVerticesUi(serverData["vertices"]);
        createRoadsUi(serverData["roads"]);
        createNumberCircleUi(serverData["hexagons"]);
        createRobberUi(serverData['hexagons'], serverData['robber']);
        createNumbersUi(serverData["hexagons"]);
        createPlayerResourcesUi(serverData['players'].map(p => p.cards).filter(cD => cD.playerIndex == playerIndex)[0]);
        createPlayerBoxesUi(serverData['players']);
        createActionsUi();
        createPortsUi(serverData['ports']);
        createDevCardUi(serverData['players'].map(p => p.cards).filter(cD => cD.playerIndex == playerIndex)[0]);

        playerIndex = serverData["playerIndex"];

        addOnClickListenerToNumberCircles(socket); //Robber click
        addOnClickListenerToResources(socket);
        addOnClickListenerToVertices();
        addOnClickListenerToRoads(socket);

    //     //moveCirclesInFrontOfText();   // Either this or make a event listener for the text.
        moveRobberToTheFront();
    });

    handleHousePlacement(socket);
    handleRoadEvent(socket);
    handleRobberMovement(socket);
    handleDiceRoll(socket);
    handleCardDistribution(socket);
    handleShineRoads(socket);
    handleShineSettlements(socket);
    handleShineCities(socket)
    handleVictoryPointChange(socket);
    handlePlayerJoin(socket);
    handleWhoseTurn(socket);
    handleShineRobberSettlements(socket);
    handleSevenDeadlySins(socket);
    handleGameOver(socket);
});

function handleGameOver(socket) {
    socket.on('gameOver', function(winner) {
        // svgContainer.attr('class', 'wrapper');
        winner = [winner];
        svgContainer.selectAll('.topText').data(winner).enter()
            .append('text')
            .attr('class', 'topText')
            .attr('x', containerWidth/4)
            .attr('y', containerHeight/10)
            .text(function(d, i) {
                return 'Congratulations ' + d.name;
            })
            .attr('fill', 'black')
            .attr('font-size', '40px');
    });
}

function handleSevenDeadlySins(socket) {
    socket.on('7deadlySins', function(cardData) {
        var numResources = getNumberOfResources(cardData, playerIndex);
        if (numResources > 7) {
            console.log('being robbered');
            makeEdgesBlinkResource();
            resourcesToSteal = Math.floor(numResources / 2);
            currentAction = 4; //Robber time!
        } else {
            console.log('not rich enough to get stole from');
            socket.emit('resumeGame', {'uuid': localStorage.getItem('catan_uuid'), 'cards': null});
        }
    });
}

function addOnClickListenerToResources() {
    var resources = svgContainer.selectAll(".resource")[0];
    for (var i = 0; i < resources.length; i++) {
        (function() {
            var resourceIndex = i;
            resources[i].addEventListener("click", function() {
                var resourceAmount = parseInt(window.svgContainer.selectAll('.resourceText')[0][resourceIndex].innerHTML);
                if (currentAction == 2) { //Monopoly
                    socket.emit("monopoly", {"resource": resourceIndex, "uuid": localStorage.getItem('catan_uuid')});
                    d3.selectAll('.resource').transition().duration(1000).style("stroke", "rgb(0,0,0)");
                    currentAction = -1;
                    window.svgContainer.selectAll('.devCardAction')[0][2].attributes.fill.value = "white";
                    return;
                }

                if (window.currentAction == 3) { //Year of Plenty
                    window.resourcesPicked.push(resourceIndex);
                    console.log('year of plenty', window.resourcesPicked);
                    window.svgContainer.selectAll('.resourceText')[0][resourceIndex].innerHTML = resourceAmount + 1;
                    if (window.resourcesPicked.length == 2) {
                        socket.emit('yearOfPlenty', {"uuid": localStorage.getItem('catan_uuid'), "resources": window.resourcesPicked});
                        window.resourcesPicked = [];
                        window.svgContainer.selectAll('.resource').transition().duration(1000).style("stroke", "rgb(0,0,0)");
                        window.svgContainer.selectAll('.devCardAction')[0][3].attributes.fill.value = "white";
                        window.currentAction = -1;
                    }
                }

                if (currentAction == 4 && resourcesToSteal > 0 && resourceAmount > 0) {
                    window.resourcesPicked.push(resourceIndex);
                    window.svgContainer.selectAll('.resourceText')[0][resourceIndex].innerHTML = resourceAmount - 1;
                    console.log('robbered resources', window.resourcesPicked);
                    window.resourcesToSteal -= 1;

                    if (window.resourcesToSteal == 0) {
                        socket.emit('resumeGame', {'uuid': localStorage.getItem('catan_uuid'), 'cards': window.resourcesPicked});
                        window.resourcesPicked = [];
                        window.resourcesToSteal = 0;
                        window.currentAction = -1; //7 deadly sins
                        window.svgContainer.selectAll('.resource').transition().duration(1000).style("stroke", "rgb(0,0,0)");
                    }
                }
            }, false);
        }());
    }
}

function createDevCardUi(cardData) {
    var actions = ["Play Knight", "Play Road Building", "Play Monopoly", "Play Year of Plenty", "Victory Points"];

    var devCardMethods = [
        playKnight,
        playRoadBuilding,
        playMonopoly,
        playYearOfPlenty,
        doNothing];

    console.log('createDevCardUi', cardData);
    svgContainer.selectAll(".devCardAction").data(devCardMethods).enter()
        .append('rect')
        .attr('class', 'devCardAction')
        .attr('x', .01 * containerWidth)
        .attr('y', function(d, i) {
            return containerHeight*3/10 + i * containerHeight/12;
        })
        .attr('width', containerWidth/5)
        .attr('height', containerHeight/12)
        .attr('fill', 'white')
        .attr("style", "outline: thin solid red;")
        .on("click", function(d, i) {
            if (this.attributes.fill.value == "white" && currentAction < 0) {
                d(); //d is a reference to a function
            }
            d3.event.stopPropagation();
        });;

    svgContainer.selectAll(".devCardText").remove();
    svgContainer.selectAll('.devCardText').data(svgContainer.selectAll('.devCardAction')[0])
        .enter().append("text")
        .attr('class', 'devCardText')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + radius / 2;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + radius / 2;
        })
        .attr('fill', 'black')
        .attr('font-size', (radius/4).toString() + "px")
        .text(function(d, i) {
            return actions[i] + " -- " + cardData['cardData'][devCards[i]];
        });
}

function doNothing() {
    return;
}

function playKnight() {
    if (svgContainer.selectAll('.devCardText')[0][0].innerHTML.indexOf(' 0') == -1) {
        svgContainer.selectAll('.devCardAction')[0][0].attributes.fill.value = window.playerColors[window.playerIndex];;
        currentAction = 0;
        makeEdgesBlinkRobber('#robber');
    }
}

function playRoadBuilding() {
    svgContainer.selectAll('.devCardAction')[0][1].attributes.fill.value = window.playerColors[window.playerIndex];;
    console.log('road building');
    shineRoads("road building"); //Current action will be set in shine roads because another action also creates roads
}

function playMonopoly() {
    svgContainer.selectAll('.devCardAction')[0][2].attributes.fill.value = window.playerColors[window.playerIndex];;
    currentAction = 2;
    makeEdgesBlinkResource();
}

function playYearOfPlenty() {
    svgContainer.selectAll('.devCardAction')[0][3].attributes.fill.value = window.playerColors[window.playerIndex];;
    currentAction = 3;
    makeEdgesBlinkResource();
}

function makeEdgesBlinkResource() {
    d3.selectAll('.resource')
    .transition()
    .duration(1000)
    .style("stroke", "rgb(255,255,255)")
    .transition()
    .duration(1000)
    .style("stroke", "rgb(0,0,0)")
    .each('end', makeEdgesBlinkResource);
}

function makeEdgesBlinkRobber() {
    d3.selectAll('#robber')
    .transition()
    .duration(1000)
    .style("stroke", "rgb(255,255,255)")
    .transition()
    .duration(1000)
    .style("stroke", "rgb(0,0,0)")
    .each('end', makeEdgesBlinkRobber);
}

function comparePlayers(player1, player2) {
    return player1.playerIndex < player2.playerIndex;
}

function createCardCountsUi(cardData) {

    svgContainer.selectAll('.cardCount').remove();
    svgContainer.selectAll('.cardCount')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'cardCount')
        .text(function(d, i) {
            return 'Cards: ' + getNumberOfResources(cardData, i)
        })
        .attr('font-size', (radius/4).toString()+"px")
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + radius/5;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + radius/4;
        })

    console.log('createCardCountsUi', cardData);
    svgContainer.selectAll('.devCardCount').remove();
    svgContainer.selectAll('.devCardCount')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'devCardCount')
        .text(function(d, i) {
            return 'Dev Cards: ' + getNumberOfDevCards(cardData, i)
        })
        .attr('font-size', (radius/4).toString()+"px")
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 2 * radius/4;
        })
}

function createPlayerBoxesUi(players) {
    var playerBoxWidth = containerWidth / 6;
    var playerBoxHeight = containerHeight / 6;
    var corners = [
      [0, 0], //top left
      [containerWidth - playerBoxWidth, 0], //top right
      [0, containerHeight - playerBoxHeight], //bottom left
      [containerWidth - playerBoxWidth, containerHeight - playerBoxHeight] //bottom right
    ];
    players.sort(comparePlayers);

    svgContainer.selectAll('.player').data(players)
        .enter().append("rect")
        .attr("class", "player")
        .attr("x", function(d, i) {
            return corners[i][0];
        })
        .attr("y", function(d, i) {
            return corners[i][1];
        })
        .attr("width", playerBoxWidth)
        .attr("height", playerBoxHeight)
        .attr('fill', function(d, i) {
            return playerColors[i];
        })
        .attr('id', function(d, i) {
            return 'player'+ i;
        });

    createCardCountsUi(players.map(p => p.cards));

    svgContainer.selectAll('.victoryPoint').remove();
    svgContainer.selectAll('.victoryPoint')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'victoryPoint')
        .text(function(d, i) {
            return 'Victory Points: ' + players[i].victoryPoints;
        })
        .attr('font-size', (radius/4).toString()+'px')
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 3 * radius/4;
        })

    svgContainer.selectAll('.knightsUsed').remove();
    svgContainer.selectAll('.knightsUsed')
    .data(svgContainer.selectAll('.player')[0])
    .enter().append('text')
    .attr('class', 'knightsUsed')
    .text(function(d, i) {
        return 'Knights Used: ' + players[i].knightsUsed;
    })
    .attr('font-size', (radius/4).toString()+'px')
    .attr('fill', 'white')
    .attr('x', function(d, i) {
        return parseInt(d.attributes.x.value) + 10;
    })
    .attr('y', function(d, i) {
        return parseInt(d.attributes.y.value) + 4 * radius/4;
    })

    svgContainer.selectAll('.longestRoad').remove();
    svgContainer.selectAll('.longestRoad')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'longestRoad')
        .text(function(d, i) {
            return 'Longest Road: ' + players[i].longestRoad
        })
        .attr('font-size', (radius/4).toString()+'px')
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 5 * radius/4;
        })

    svgContainer.selectAll('.name').remove();
    svgContainer.selectAll('.name')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'name')
        .text(function(d, i) {
            return 'Name: ' + players[i].name;
        })
        .attr('font-size', (radius/4).toString()+'px')
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 6 * radius/4;
        })

    // updateCardCountsUi(players.map(i => i.cards));
}

function createPortsUi(ports) {
    var vertices = svgContainer.selectAll('.vertexCircle')[0];
    var portCircles = [];
    for (var i = 0; i < ports.length; i++) {
        var portIndex = ports[i].v1;
        var portIndex2 = ports[i].v2;
        var x1 = parseInt(vertices[portIndex].attributes.cx.value);
        var x2 = parseInt(vertices[portIndex2].attributes.cx.value);
        var newX = (x1 + x2) / 2;

        var y1 = parseInt(vertices[portIndex].attributes.cy.value);
        var y2 = parseInt(vertices[portIndex2].attributes.cy.value);
        var newY = (y1 + y2) / 2;
        portCircles.push([newX, newY]);
    };  

    console.log(ports);
    svgContainer.selectAll('.portCircle').data(portCircles).enter()
        .append('circle')
        .attr('class', 'portCircle')
        .attr('cx', function(d) {
            return d[0];
        })
        .attr('cy', function(d) {
            return d[1];
        })
        .style("stroke", "rgb(0,0,0)")
        .attr('r', radius/4)
        .attr('fill', function(d, i) {
            return window.portColors[ports[i].resource];
        })
}

function createActionsUi() {
    var actions = ["Build Road", "Build City", "Build Settlement", "Buy Development Card", "Trade", "End Turn"];
    var actionMethods = [
        shineRoads,
        shineCities,
        shineSettlements,
        buyDevelopmentCard,
        openTradeWindow,
        beginNewTurn];
    svgContainer.selectAll(".action").data(actionMethods).enter()
        .append('rect')
        .attr('class', 'action')
        .attr('x', .78 * containerWidth)
        .attr('y', function(d, i) {
            return containerHeight*3/10 + i * containerHeight/12;
        })
        .attr('width', containerWidth/5)
        .attr('height', containerHeight/12)
        .attr('fill', 'white')
        .attr("style", "outline: thin solid red;")
        .on("click", function(d, i) {
            if (this.attributes.fill.value == "white" && currentAction < 0) {
                d(); //d is a reference to a function
            } else if (currentAction == i + 5) {
                d();
            }
            d3.event.stopPropagation();
        });;

    svgContainer.selectAll('.actionText').data(svgContainer.selectAll('.action')[0])
        .enter().append("text")
        .attr('class', 'actionText')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + radius / 2;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + radius / 2;
        })
        .attr('fill', 'black')
        .attr('font-size', (radius/4).toString() + "px")
        .text(function(d, i) {
            return actions[i];
        });
}

function openTradeWindow() {

}

//Type will be "road building" if it's for the intial road building, null else
function shineRoads(type) {
    if (type == "road building") {
        currentAction = 1; //Road building action
    }

    socket.emit('shineRoads', {"playerIndex": playerIndex, "uuid": localStorage.getItem('catan_uuid'), "type": type});
}

function shineCities() {
    window.svgContainer.selectAll('.action')[0][1].attributes.fill.value = window.playerColors[window.playerIndex];;
    socket.emit('shineCities', {"playerIndex": playerIndex, "uuid": localStorage.getItem('catan_uuid')});
}

//Type is either beginning game or in game
function shineSettlements() {
    window.svgContainer.selectAll('.action')[0][2].attributes.fill.value = window.playerColors[window.playerIndex];;
    socket.emit('shineSettlements', {'playerIndex': playerIndex, 'type': 0, "uuid": localStorage.getItem('catan_uuid')});
}

function buyDevelopmentCard() {
    socket.emit('buyDevCard', {"playerIndex": playerIndex, "uuid": localStorage.getItem('catan_uuid')});
}

//Type will be 0 for settlements, 1 for town, 2 for robbered locations
function shineHouseLocations(socket, shineSettlements, type) {
    var vertices = svgContainer.selectAll('.vertexCircle')[0];
    if (shineSettlements.length != 0 && vertices[shineSettlements[0]].attributes.fill.value == "white") { //Already white Turn off shine cities
        shineSettlements.forEach(function(shineSettlementIndex) {
            if (type == 1) { //If city, restore to player's color
                vertices[shineSettlementIndex].attributes.fill.value = playerColors[playerIndex];
            } else {
                vertices[shineSettlementIndex].attributes.fill.value = "transparent";
            }
        });
    } else { //Turning on shine location
        if (type == 2) {
            window.blinkingHouses = shineSettlements.slice();
            makeEdgesBlinkHouses();
            makeEdgesBlinkCities();
        } else {
            shineSettlements.forEach(function(shineSettlementIndex) {
                vertices[shineSettlementIndex].attributes.fill.value = "white";
            });
        }
    }
}

function makeEdgesBlinkHouses() {

    d3.selectAll('.vertexCircle')
    .filter(function(d, i) { return window.blinkingHouses.indexOf(i) != -1 })
    .style("stroke-width", "5px")
    .transition()
    .duration(500)
    .style("stroke", "rgb(255,255,255)")
    .transition()
    .duration(500)
    .style("stroke", "rgb(0,0,0)")
    .each('end', makeEdgesBlinkHouses);
}

function makeEdgesBlinkCities() {

    d3.selectAll('.vertexRect')
    .filter(function(d, i) { return window.blinkingHouses.indexOf(i) != -1 })
    .style("stroke-width", "5px")
    .transition()
    .duration(500)
    .style("stroke", "rgb(255,255,255)")
    .transition()
    .duration(500)
    .style("stroke", "rgb(0,0,0)")
    .each('end', makeEdgesBlinkCities);
}

function handleCardDistribution(socket) {
    socket.on('cards', function(cardData) {
        createCardCountsUi(cardData);
        createPlayerResourcesUi(cardData.filter(cD => cD.playerIndex == window.playerIndex)[0]);
        console.log('createDevCardUi', cardData);
        createDevCardUi(cardData.filter(cD => cD.playerIndex == window.playerIndex)[0]);
    });
}

function getNumberOfDevCards(cardData, key) {

    console.log('number of dev cards', cardData);
    var totalCards = 0;
    devCards.forEach(function(resource, i) { //For each dict of cards per player
        totalCards += cardData[key].cardData[resource];
    });
    return totalCards;
}

function getNumberOfResources(cardData, key) {
    var totalCards = 0;
    resourceEntries.forEach(function(resource, i) { //For each dict of cards per player
        totalCards += cardData[key].cardData[resource];
    });
    return totalCards;
}

function createPlayerResourcesUi(cardData) {

    var resourceColors = hexagonColors.slice();
    resourceColors.splice(5,1);
    svgContainer.selectAll('.resource')
        .data(resourceColors).enter()
        .append('rect')
        .attr('class', 'resource')
        .attr('x', function(d, i) {
            return containerWidth/5 + i*containerWidth/8
        })
        .attr('y', .85  * containerHeight)
        .attr('width', containerWidth/12)
        .attr('height', containerWidth/12)
        .style("stroke", "rgb(0,0,0)")
        .attr("stroke-width", "3px")
        .attr('fill', function(d, i) {
            return d;
        });

    svgContainer.selectAll('.resourceText').remove();
    svgContainer.selectAll('.resourceText')
        .data(svgContainer.selectAll('.resource')[0])
        .enter().append('text')
        .attr('class', 'resourceText')
        .text(function(d, i) {
            return cardData['cardData'][resourceEntries[i]];
        })
        .attr('font-size', (radius).toString()+"px")
        .attr('fill', 'black')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + radius / 2;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 1.1 * radius;
        })
}

function beginNewTurn() {
    socket.emit("beginTurn", {"data": null, "uuid": localStorage.getItem('catan_uuid')});
}

function moveRobberToTheFront() {
    //puts robber in front of all other elements
    d3.select(svgContainer.select("#robber")[0][0]).each(function(){
  this.parentNode.appendChild(this);
  });
}

function addOnClickListenerToNumberCircles() {
    var circles = svgContainer.selectAll(".numberCircle")[0];
    for (var i = 0; i < circles.length; i++) {
        (function() {
            var hexIndex = i;
            circles[i].addEventListener("click", function() {

                if (currentAction == 0) {
                    var robby = svgContainer.select("#robber")[0][0];
                    robby.setAttribute("x", this.attributes.cx.value - 25);
                    robby.setAttribute("y", this.attributes.cy.value - 25);

                    socket.emit("robberPlacement", {"hexIndex": hexIndex, "uuid": localStorage.getItem('catan_uuid')});
                }
            }, false);
        }());
    }
}

function addOnClickListenerToRoads(socket) {
    var roads = svgContainer.selectAll('.road')[0];
    for (i = 0; i < roads.length; i++) {
        (function() {
            var road = roads[i];
            road.addEventListener("click", function() {
                    if (this.attributes.stroke.value == "white") {
                        this.attributes.stroke.value = window.playerColors[playerIndex];
                        var id = parseInt(this.id.substring(this.id.indexOf('d') + 1));
                        socket.emit("road", {"id": id, "uuid": localStorage.getItem('catan_uuid')}); //road+id

                        if (window.currentAction == 1) { //Road Building
                            window.roadBuildingCount += 1;
                            if (window.roadBuildingCount == 2) { //Second Road
                                window.currentAction = -1;
                                window.roadBuildingCount = 0;
                                window.svgContainer.selectAll('.devCardAction')[0][1].attributes.fill.value = "white";
                            }
                        } else {
                            currentAction = -1; // Building regular road
                            window.svgContainer.selectAll('.action')[0][0].attributes.fill.value = "white";
                        }

                        roads.forEach(function(roadToReset) {
                            if (roadToReset.attributes.stroke.value == "white") {
                                roadToReset.attributes.stroke.value = "transparent";
                            }
                        })
                    }
                },
                false);
        }());
    }
}

function addOnClickListenerToVertices() {

    var vertexCircles = svgContainer.selectAll('.vertexCircle')[0];

    for (var i = 0; i < vertexCircles.length; i++) {
        (function () {
            var circle = vertexCircles[i];
            circle.addEventListener("click", function() {
                console.log('event listener in circle')
                var vertexId = parseInt(circle.id.substring(circle.id.indexOf('x') + 1));
                if (this.attributes.fill.value == "white" || window.blinkingHouses.indexOf(vertexId) != -1) {
                    var locationInfo = {"id": vertexId, "uuid": localStorage.getItem('catan_uuid')}; //vertex+id
                    if (currentAction == 0) { //Robber
                        socket.emit("robberEvent", locationInfo);
                        window.svgContainer.selectAll('.devCardAction')[0][0].attributes.fill.value = "white";
                        window.blinkingHouses = [];
                        window.svgContainer.selectAll('.vertexCircle').transition().duration(1000).style("stroke-width", "0px");
                        window.svgContainer.selectAll('.vertexRect').transition().duration(1000).style("stroke-width", "0px");
                    } else { // Building location
                        socket.emit('vertex', locationInfo); //Don't update the house shape here, do it on callback
                        window.svgContainer.selectAll('.action')[0][1].attributes.fill.value = "white";
                        window.svgContainer.selectAll('.action')[0][2].attributes.fill.value = "white";
                    }

                    vertexCircles.forEach(function(vertexToReset) {
                        if (vertexToReset.attributes.fill.value == "white") {
                            var colorToSetTo = window.currentAction == 6 ? window.playerColors[window.playerIndex] : "transparent";
                            vertexToReset.attributes.fill.value = colorToSetTo;
                        }
                    });

                    currentAction = -1; //End House Building (includes cities and settlements) action or Robber Action
                }
            }, false);
        }());
    }
}

function createNumberCircleUi(hexagons) {

    var text = svgContainer.selectAll(".numberCircle")
        .data(hexagons)
        .enter().append("circle")
        .attr('id', function(d, i) {return 'numberCircle'+i})
        .attr('class', 'numberCircle')
        .attr('cx', function(d, i) {
            return d.center[0];
        })
        .attr('cy', function(d, i) {
            return d.center[1];
        })
        .attr('r', radius/2)
        .attr('fill', function(d, i) {
            return hexagons[i].resourceIndex == 5 ? "rgba(255,248,220,0)" : "rgba(255,248,220,0.8)";
        });
}

function createRobberUi(hexagons, robberIndex) {

    var robier = svgContainer.append('rect')
        .attr('x', hexagons[robberIndex].center[0] - radius/2)
        .attr('y', hexagons[robberIndex].center[1] -radius/2)
        .style("stroke", "rgb(0,0,0)")
        .attr("stroke-width", "3px")
        .attr('id', 'robber')
        .attr('width', radius)
        .attr('height', radius)
        .attr('fill', "rgba(255,0,0,1)");
}

//Draw the hexagons
function createHexagonsUi(hexagonServerData) {
    var points = [];
    hexagonServerData.forEach(function(hexagon) {
        points.push(hexagon.center);
    });

    var hexbin = d3.hexbin()
        .radius(radius);

    svgContainer.append("g")
        .selectAll(".hexagon")
        .data(hexbin(points))
        .enter().append("path")
        .attr("class", "hexagon")
        .attr("d", function (d) {
      return "M" + d.x + "," + d.y + hexbin.hexagon();
     })
        .attr("stroke", "black")
        // .attr("stroke", "red")
        .attr("stroke-line","20,5")
        .attr("stroke-width", "3px")
        .style("fill", function(d, i) {
            return hexagonColors[hexagonServerData[i].resourceIndex];
     });
}

function handleHousePlacement(socket) {
    socket.on('vertex', function(locationInfo) {
        if (locationInfo['type'] == 2) { //City make it a new shape
            svgContainer.select('#city'+locationInfo['id']).attr('fill', playerColors[locationInfo['playerIndex']]);
        } else {
            svgContainer.select("#vertex" + locationInfo["id"])[0][0].attributes.fill.value = playerColors[locationInfo["playerIndex"]];
        }
    });
}

function createVerticesUi(vertices) {
    svgContainer.selectAll('.vertexCircle')
        .data(vertices).enter().append('circle')
        .attr('id', function (d, i) {
            return 'vertex' + i;
        })
        .attr('class', 'vertexCircle')
        .attr('cx', function(d) {
            return d.x;
        }) //centers[i][0])
        .attr('cy', function(d) {
            return d.y;
        }) //centers[i][1])
        .attr('r', radius/3)
        .attr('fill', function(d, i) {
            return d.houseType == 1 ? playerColors[d.playerIndex] : "rgba(0,248,220,0)";
        });

    svgContainer.selectAll('.vertexRect')
        .data(svgContainer.selectAll('.vertexCircle')[0])
        .enter().append('rect')
        .attr('id', function (d, i) {
            return 'city' + i;
        })
        .attr('class', 'vertexRect')
        .attr('x', function(d) {
            return d.attributes.cx.value - d.attributes.r.value;
        })
        .attr('y', function(d, i) {
            return d.attributes.cy.value - d.attributes.r.value;
        })
        .attr('width', radius/1.5)
        .attr('height', radius/1.5)
        .attr('fill', function(d, i) {
            return vertices[i].houseType == 2 ? playerColors[vertices[i].playerIndex]: "rgba(0,248,220,0)";
        })
        .style('pointer-events', 'none')
}

function createRoadsUi(roads) {
    svgContainer.selectAll('.road')
        .data(roads).enter().append('line')
        .attr('class', 'road')
        .attr('id', function(d, i) {
            return 'road' + i;
        })
        .attr("x1", function(d) {
            return d.x1;
        })
        .attr("x2", function(d) {
            return d.x2;
        })
        .attr("y1", function(d) {
            return d.y1;
        })
        .attr("y2", function(d) {
            return d.y2;
        })
        .attr("stroke-width", radius/12)
        .attr("stroke", function(d, i) {
            return d.playerIndex == -1 ? "transparent" : playerColors[d.playerIndex];
        });
}

//Add number to circle ui
function createNumbersUi(hexagonServerData) {
            //Add the SVG Text Element to the svgContainer
    var text = svgContainer.selectAll("text")
        .data(hexagonServerData)
        .enter().append("text")
        .attr("x", function(d) { return d.center[0]; })
        .attr("y", function(d) { return d.center[1] + 7; })
        .text( function (d, i) {
            return d.diceNumber;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", (radius/2.7).toString() + "px")
        .attr("fill", function(d) {
            return d.diceNumber == 6 || d.diceNumber == 8 ? "red" : "black";
        })
        .style("text-anchor", "middle");
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

function handlePlayerJoin(socket) {
    socket.on('newPlayer', function(players) {
        console.log('new Player');
        createPlayerBoxesUi(players);
        createDevCardUi(players.map(p => p.cards).filter(cD => cD.playerIndex == playerIndex)[0]);
    });
}

function handleRoadEvent(socket) {
    socket.on("road", function(roadInfo) {
        svgContainer.select("#road" + roadInfo["id"])[0][0].attributes.stroke.value = playerColors[roadInfo["playerIndex"]];

        if (currentAction == 1 && roadInfo['uuid'] == localStorage.catan_uuid) { //Still in RoadBuilding shine roads again
            shineRoads();
        }
    });
}

function handleRobberMovement(socket) {
    socket.on("robberPlacement", function(robberInfo) {
        var robby = svgContainer.selectAll("#robber")[0][0];
        var hexCircle = svgContainer.selectAll('#numberCircle' + robberInfo["hexIndex"])[0][0];
        robby.setAttribute("x", hexCircle.attributes.cx.value - 25);
        robby.setAttribute("y", hexCircle.attributes.cy.value - 25);
    });
}

function handleVictoryPointChange(socket) {
    socket.on('victoryPoint', function(victoryPointInfo) {
        var victoryPoints = svgContainer.selectAll('.victoryPoint')[0];
        for (var index in victoryPointInfo) {
            victoryPoints[parseInt(index)].innerHTML = "Victory Points: " + victoryPointInfo[parseInt(index)];
        }
    });
}

function handleShineCities(socket) {
    socket.on('shineCities', function(shineCities) {
        if (shineCities.length == 0 || currentAction == 6) { //No cities to show or already showing cities
            window.svgContainer.selectAll('.action')[0][1].attributes.fill.value = "white";
            currentAction = -1;
        } else {
            currentAction = 6;
        }
        shineHouseLocations(socket, shineCities, 1);
    });
}

function handleShineSettlements(socket) {
    socket.on('shineSettlements', function(shineSettlements) {
        if (shineSettlements.length == 0 || currentAction == 7) { //No houses to show or already in house building action
            currentAction = -1;
            window.svgContainer.selectAll('.action')[0][2].attributes.fill.value = "white";
        } else {
            currentAction = 7;
        }
        shineHouseLocations(socket, shineSettlements, 0);
    });
}

function handleShineRobberSettlements(socket) {
    socket.on('shineRobberSettlements', function(shineSettlements) {
        svgContainer.selectAll('#robber').transition().duration(1000).style("stroke", "rgb(0,0,0)");
        console.log(shineSettlements);
        if (shineSettlements.length > 0) {
            shineHouseLocations(socket, shineSettlements, 2);
        } else { // If no houses there, need to end the action here
            currentAction = -1;
            svgContainer.selectAll('.devCardAction')[0][0].attributes.fill.value = "white";
        }
    });
}

function handleShineRoads(socket) {
    socket.on("shineRoads", function(shineRoads) {

        if (shineRoads.length <= 1 || currentAction == 5) { // No roads to show or already showing roads
            currentAction = -1;
            svgContainer.selectAll('.devCardAction')[0][1].attributes.fill.value = "white";
            window.svgContainer.selectAll('.action')[0][0].attributes.fill.value = "white";
        } else {
            if (currentAction != 1) {
                currentAction = 5; //Build road action
                window.svgContainer.selectAll('.action')[0][0].attributes.fill.value = window.playerColors[window.playerIndex];
            }
        }

        var roads = svgContainer.selectAll('.road')[0];
        if (shineRoads.length != 0 && roads[shineRoads[0]].attributes.stroke.value == "white") {
            shineRoads.forEach(function(shineRoadIndex) {
                roads[shineRoadIndex].attributes.stroke.value = "transparent";
            });
        } else {
            shineRoads.forEach(function(shineRoadIndex) {
                roads[shineRoadIndex].attributes.stroke.value = "white";
            });
        }
    })
}

function handleDiceRoll(socket) {
    socket.on('dice', function(diceInfo) {
        var dice1 = document.getElementById("dice1");
        var dice2 = document.getElementById("dice2");
        dice1.src="dice-rolling-" + diceInfo[0].toString() + ".png";
        dice2.src="dice-rolling-" + diceInfo[1].toString() + ".png";
    });
}

function handleWhoseTurn(socket) {
    socket.on('whoseTurn', function(turn) {
        var allActions = svgContainer.selectAll(".action")[0].concat(svgContainer.selectAll(".devCardAction")[0]);
        allActions.forEach(function(boxUi) {
            if (turn == playerIndex) {
                boxUi.attributes.fill.value = "white"
            } else {
                boxUi.attributes.fill.value = "grey"
            }
        });

        svgContainer.selectAll('.player').data(svgContainer.selectAll('.player')[0])
            .attr('fill-opacity', function(d, i) {
                return turn == i ? 1 : 0.5;
            });
    });
}