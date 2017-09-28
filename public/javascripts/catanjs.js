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

        playerIndex = serverData["playerIndex"];

        addOnClickListenerToVertices(socket);
        addOnClickListenerToRoads(socket);
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
});

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
        console.log(cardData);
        var playerSquares = svgContainer.selectAll('.cardCount')[0];
        var resourceText = svgContainer.selectAll('.resourceText')[0];
        for (var key in cardData) {
            var totalCards = 0;
            resourceEntries.forEach(function(resource, i) {
                totalCards += cardData[key].cardData[resource];

                if (key == playerIndex) {
                    console.log(resourceText[i], cardData[key].cardData[resource], resource);
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
            return parseInt(d.attributes.x.value) + 10;
        })
        .attr('y', function(d, i) {
            return parseInt(d.attributes.y.value) + 10;
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

function addOnClickListenerToEndTurn(socket) {
    var endTurn = document.getElementById('end-turn');
    endTurn.addEventListener("click", function() {
        (function() {
            socket.emit("beginTurn", null);
        }());
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

function addOnClickListenerToRoads() {
    var roads = svgContainer.selectAll('.road')[0];
    for (i = 0; i < roads.length; i++) {
        (function() {
            var road = roads[i];
            road.addEventListener("click", function() {
                    this.attributes.stroke.value = window.playerColors[playerIndex];
                    socket.emit("road", {"id": parseInt(this.id.substring(this.id.indexOf('d') + 1))}); //road+id
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
                this.attributes.fill.value = window.playerColors[window.playerIndex];
                var locationInfo = {"id": parseInt(circle.id.substring(circle.id.indexOf('x') + 1))}; //vertex+id
                socket.emit("vertex", locationInfo);
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
