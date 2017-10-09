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
var hexagonColors = ["rgba(0,102,0,0.4)", "rgba(255,0,0,0.4)", "rgba(0,255,0,0.4)", "rgba(255,255,0,0.4)", "rgba(96,96,96,0.4)", "rgba(255,255,204,0.4)"];
var playerColors = ["red", "blue", "purple", "green"];
var devCards = ['Knight', 'Victory point', 'Road building', 'Monopoly', 'Year of plenty'];

var playerIndex = 0;
var playerTurn = 0;

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
        createRobberUi(serverData['hexagons']);
        createNumbersUi(serverData["hexagons"]);
        createPlayerBoxesUi();
        createPlayerResourcesUi();
        createActionsUi();
        createPortsUi(serverData['ports']);

        playerIndex = serverData["playerIndex"];

        addOnClickListenerToVertices(socket);
        addOnClickListenerToNumberCircles(socket); //Robber click
        addOnClickListenerToEndTurn(socket);
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
    handleBuyDevelopmentCard(socket);
    handleVictoryPointChange(socket);
});

function handleVictoryPointChange(socket) {
    socket.on('victoryPoint', function(victoryPointInfo) {
        var victoryPoints = svgContainer.selectAll('.victoryPoint')[0];
        for (var index in victoryPointInfo) {
            victoryPoints[parseInt(index)].innerHTML = "Victory Points: " + victoryPointInfo[parseInt(index)];
        }
    });
}

function createPortsUi(ports) {
    var vertices = svgContainer.selectAll('.vertexCircle')[0];
    var portCircles = [];
    for (var i = 0; i < ports.length; i++) {
        var portIndex = ports[i];
        var portIndex2 = ports[i+1];
        if (i % 2 == 0) {
            var x1 = parseInt(vertices[portIndex].attributes.cx.value);
            var x2 = parseInt(vertices[portIndex2].attributes.cx.value);
            var newX = (x1 + x2) / 2;

            var y1 = parseInt(vertices[portIndex].attributes.cy.value);
            var y2 = parseInt(vertices[portIndex2].attributes.cy.value);
            var newY = (y1 + y2) / 2;
            portCircles.push([newX, newY]);
        }
    };

    svgContainer.selectAll('.portCircle').data(portCircles).enter()
        .append('circle')
        .attr('class', 'portCircle')
        .attr('cx', function(d) {
            return d[0];
        })
        .attr('cy', function(d) {
            return d[1];
        })
        .attr('r', radius/4)
        .attr('fill', 'pink')
}

function createActionsUi() {
    var actions = ["Build Road", "Play Development Card", "Build City", "Build Settlement", "Buy Development Card", "End Turn"];
    var actionMethods = [
        shineRoads,
        playDevelopmentCard,
        shineCities,
        shineSettlements,
        buyDevelopmentCard,
        addOnClickListenerToEndTurn];
    svgContainer.selectAll(".action").data(actionMethods).enter()
        .append('rect')
        .attr('class', 'action')
        .attr('x', .78 * containerWidth)
        .attr('y', function(d, i) {
            return containerHeight/4 + i * containerHeight/12;
        })
        .attr('width', containerWidth/5)
        .attr('height', containerHeight/12)
        .attr('fill', 'white')
        .attr("style", "outline: thin solid red;")
        .on("click", function(d, i) {
            d(); //d is a reference to a function
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

function shineRoads() {
    socket.emit('shineRoads', playerIndex);
}

function playDevelopmentCard() {

}

function shineCities() {
    socket.emit('shineCities', playerIndex);
}

function shineSettlements() {
    socket.emit('shineSettlements', {'playerIndex': playerIndex, 'type': 0});
}

function buyDevelopmentCard() {
    socket.emit('buyDevCard', playerIndex);
}

function handleBuyDevelopmentCard(socket) {
    socket.on('buyDevCard', function(devCardData) {
        console.log(devCards[devCardData['devCardIndex']], devCardData['cardData']);
        var playerCardData = devCardData['cardData'];
        var playerIndex = playerCardData['playerIndex'];
        var devCardIndex = devCardData['devCardIndex'];
        var devCardCount = svgContainer.selectAll('.devCardCount')[0][playerIndex];
        var sum = 0;
        for (var i = 0; i < devCards.length; i++) {
            var card = devCards[i];
            sum += playerCardData.cardData[card];
        }
        devCardCount.innerHTML = "Dev Cards: " + sum;
    })
}

function handleShineCities(socket) {
    socket.on('shineCities', function(shineCities) {
        console.log("Shine Cities");
        shineHouseLocations(socket, shineCities, 1);
    });
}

function handleShineSettlements(socket) {
    socket.on('shineSettlements', function(shineSettlements) {
        shineHouseLocations(socket, shineSettlements, 0);
    });
}

//Type will be 0 for settlements, 1 for town
function shineHouseLocations(socket, shineSettlements, type) {
    var vertices = svgContainer.selectAll('.vertexCircle')[0];
    if (shineSettlements.length != 0 && vertices[shineSettlements[0]].attributes.fill.value == "white") {
        shineSettlements.forEach(function(shineSettlementIndex) {
            if (type == 1) { //If city, restore to player's color
                vertices[shineSettlementIndex].attributes.fill.value = playerColors[playerIndex];
            } else {
                vertices[shineSettlementIndex].attributes.fill.value = "transparent";
            }
        });
    } else {
        addOnClickListenerToVertices(shineSettlements);
        shineSettlements.forEach(function(shineSettlementIndex) {
            vertices[shineSettlementIndex].attributes.fill.value = "white";
        })
    }
}

function handleShineRoads(socket) {
    socket.on("shineRoads", function(shineRoads) {

        var roads = svgContainer.selectAll('.road')[0];
        if (shineRoads.length != 0 && roads[shineRoads[0]].attributes.stroke.value == "white") {
            shineRoads.forEach(function(shineRoadIndex) {
                roads[shineRoadIndex].attributes.stroke.value = "transparent";
            });
        } else {
            addOnClickListenerToRoads(socket, shineRoads);
            shineRoads.forEach(function(shineRoadIndex) {
                roads[shineRoadIndex].attributes.stroke.value = "white";
            });
        }
    })
}

function createPlayerResourcesUi() {
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
        .attr('fill', function(d, i) {
            return d;
        });

    svgContainer.selectAll('.resourceText')
        .data(svgContainer.selectAll('.resource')[0])
        .enter().append('text')
        .attr('class', 'resourceText')
        .text(0)
        .attr('font-size', (radius).toString()+"px")
        .attr('fill', 'black')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + radius / 2;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 1.1 * radius;
        })
}

function handleCardDistribution(socket) {
    socket.on('cards', function(cardData) {
        var playerSquares = svgContainer.selectAll('.cardCount')[0];
        var resourceText = svgContainer.selectAll('.resourceText')[0];
        for (var key in cardData) {
            var totalCards = 0;
            resourceEntries.forEach(function(resource, i) {
                totalCards += cardData[key].cardData[resource];

                if (key == playerIndex) {
                    resourceText[i].innerHTML = cardData[key].cardData[resource];
                }

            });
            playerSquares[key].innerHTML = "Cards: " + totalCards;
        }
    });
}

function createPlayerBoxesUi() {
    var playerBoxWidth = containerWidth / 6;
    var playerBoxHeight = containerHeight / 6;
    var corners = [
      [0, 0], //top left
      [containerWidth - playerBoxWidth, 0], //top right
      [0, containerHeight - playerBoxHeight], //bottom left
      [containerWidth - playerBoxWidth, containerHeight - playerBoxHeight] //bottom right
    ];

    svgContainer.selectAll('.player').data(corners)
        .enter().append("rect")
        .attr("class", "player")
        .attr("x", function(d, i) {
            return d[0];
        })
        .attr("y", function(d, i) {
            return d[1];
        })
        .attr("width", playerBoxWidth)
        .attr("height", playerBoxHeight)
        .attr('fill', function(d, i) {
            return playerColors[i];
        })
        .attr('id', function(d, i) {
            return 'player'+ i;
        });

    svgContainer.selectAll('.cardCount')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'cardCount')
        .text('Cards: 0')
        .attr('font-size', (radius/4).toString()+"px")
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + radius/5;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + radius/4;
        })

    svgContainer.selectAll('.devCardCount')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'devCardCount')
        .text('Dev Cards: 0')
        .attr('font-size', (radius/4).toString()+"px")
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 2 * radius/4;
        })

    svgContainer.selectAll('.victoryPoint')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'victoryPoint')
        .text('Victory Points: 0')
        .attr('font-size', (radius/4).toString()+'px')
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 3 * radius/4;
        })

    svgContainer.selectAll('.knightsUsed')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'knightsUsed')
        .text('Knights Used: 0')
        .attr('font-size', (radius/4).toString()+'px')
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 4 * radius/4;
        })

    svgContainer.selectAll('.longestRoad')
        .data(svgContainer.selectAll('.player')[0])
        .enter().append('text')
        .attr('class', 'longestRoad')
        .text('Longest Road: 0')
        .attr('font-size', (radius/4).toString()+'px')
        .attr('fill', 'white')
        .attr('x', function(d, i) {
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 5 * radius/4;
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

function addOnClickListenerToEndTurn() {
    socket.emit("beginTurn", null);
}

function handleRobberMovement(socket) {
    socket.on("robberPlacement", function(robberInfo) {
        var robby = svgContainer.selectAll("#robber")[0][0];
        var hexCircle = svgContainer.selectAll('#numberCircle' + robberInfo["hexIndex"])[0][0];
        robby.setAttribute("x", hexCircle.attributes.cx.value - 25);
        robby.setAttribute("y", hexCircle.attributes.cy.value - 25);
    });
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

                var robby = svgContainer.select("#robber")[0][0];
                robby.setAttribute("x", this.attributes.cx.value - 25);
                robby.setAttribute("y", this.attributes.cy.value - 25);

                socket.emit("robberPlacement", {"hexIndex": hexIndex});
            }, false);
        }());
    }
}

function handleHousePlacement(socket) {
    socket.on("vertex", function(locationInfo) {
        svgContainer.select("#vertex" + locationInfo["id"])[0][0].attributes.fill.value = playerColors[locationInfo["playerIndex"]];
    });
}

function handleRoadEvent(socket) {
    socket.on("road", function(roadInfo) {
        svgContainer.select("#road" + roadInfo["id"])[0][0].attributes.stroke.value = playerColors[roadInfo["playerIndex"]];
    });
}

function addOnClickListenerToRoads(socket, shineRoads) {
    var roads = svgContainer.selectAll('.road')[0];
    for (i = 0; i < roads.length; i++) {
        if (shineRoads.indexOf(i) != -1) {
            (function() {
                var road = roads[i];
                road.addEventListener("click", function() {
                        if (this.attributes.stroke.value == "white") {
                            this.attributes.stroke.value = window.playerColors[playerIndex];
                            var id = parseInt(this.id.substring(this.id.indexOf('d') + 1));
                            socket.emit("road", {"id": id}); //road+id

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
}

function addOnClickListenerToVertices(shineSpots) {

    var vertexCircles = svgContainer.selectAll('.vertexCircle')[0];

    for (var i = 0; i < shineSpots.length; i++) {
        (function () {
            var circle = vertexCircles[i];
            circle.addEventListener("click", function() {
                if (this.attributes.fill.value == "white") {
                    this.attributes.fill.value = window.playerColors[window.playerIndex];
                    var locationInfo = {"id": parseInt(circle.id.substring(circle.id.indexOf('x') + 1))}; //vertex+id
                    socket.emit("vertex", locationInfo);

                    vertexCircles.forEach(function(vertexToReset) {
                        if (vertexToReset.attributes.fill.value == "white") {
                            vertexToReset.attributes.fill.value = "transparent";
                        }
                    })
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

function createRobberUi(hexagons) {

    var robberIndex = -1;
    hexagons.forEach(function(hexagon, i) {
        if (hexagon.resourceIndex == 5) {
            robberIndex = i;
        }
    });

    var robier = svgContainer.append('rect')
        .attr('x', hexagons[robberIndex].center[0] - radius/2)
        .attr('y', hexagons[robberIndex].center[1] -radius/2)
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

function createVerticesUi(vertices) {
    for (var i = 0; i < vertices.length; i++) {
        var enterCircle = svgContainer.append('circle')
            .attr('id', 'vertex' + i)
            .attr('class', 'vertexCircle')
            .attr('cx', vertices[i].x) //centers[i][0])
            .attr('cy', vertices[i].y) //centers[i][1])
            .attr('r', radius/3)
            .attr('fill', "rgba(0,248,220,0)");
    }
}

function createRoadsUi(roads) {
    // Draw the lines
    for (var i = 0; i < roads.length; i++) {
        var line = svgContainer.append("line")
            .attr('class', 'road')
            .attr('id', 'road' + i)
            .attr("x1", roads[i].x1)
            .attr("y1", roads[i].y1)
            .attr("x2", roads[i].x2)
            .attr("y2", roads[i].y2)
            .attr("stroke-width", radius/12)
            .attr("stroke", "transparent");
    }
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
