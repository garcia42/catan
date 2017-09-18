var scale = 1;
var containerHeight = 900 * scale;
var containerWidth = 600 * scale;
var h = (Math.sqrt(3)/2);
var radius = 50 * scale;

var svgContainer = 
    d3.select("body")
      .append("svg")
      .attr("width", containerHeight)
      .attr("height", containerWidth);

//rsc = {CLAY:0,WHEAT:1,SHEEP:2,WOOD:3,ORE:4,DESERT:5}
//red, yellow, light-green, green, grey, tan
var hexagonColors = ["rgba(255,0,0,0.4)", "rgba(255,255,0,0.4)", "rgba(0,255,0,0.4)", "rgba(0,102,0,0.4)", "rgba(96,96,96,0.4)", "rgba(255,255,204,0.4)"];
var playerColors = ["red", "blue", "white", "green"];

var vertices = []; // going to be added using the centers and calculations.
var hexagons = []; // used for giving hexagons to add diceNumber
var playerIndex = 0;
var playerTurn = 0;

$(document).ready(function() {

    socket.on('newBoard', function(serverData) {
        playerIndex = serverData["playerIndex"];
        console.log("Drawing Board");
        loadHexagons(serverData["hexagons"]);
        // loadVertices(serverData["vertices"]);
        console.log("Adding Numbers to Circles");
        addNumbersToCircles(serverData["hexagons"]);
        changeNumberColors();
        addNumbersToHexagons();
        vertexCircles = addVertexCircles();
        addOnClickListenerToVertices(vertexCircles);
        //moveCirclesInFrontOfText();   // Either this or make a event listener for the text.
        moveRobberToTheFront();
        addVertexNeighbors();
        addRoadsBetweenNeighbors();
        addOnClickListenerToEnterCircles();  // supposed to be center circle
    });

    handleHousePlacement(socket);
    handleRoadEvent(socket);
    handleRobberMovement(socket);
    // getDiceRoll();
});

// function loadVertices(vertexServerData) {
//     for (var i = 0; i < vertexServerData.length; i++) {
//         if (vertexServerData[i]["id"] != 0) {

//         }
//     }
// }

function loadHexagons(hexagonServerData) {
    svgContainer.selectAll("*").remove();

    var hexagonsRemaining = 3;
    var rowsLeft = 5;
    var count = 0;

    var xp = 190;
    var yp = 110;
    var hexagonWidth = 100 * scale;
    var rowHeight = 88 * scale;

    drawHexagon = 
        d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("cardinal-closed")
            .tension("0.25");

    while (rowsLeft > 0) {
        var tmphexRem = hexagonsRemaining;
        var tmpX = xp;
        while (hexagonsRemaining > 0) {
            xp += hexagonWidth;

            hexagonData = [
              { "x": radius+xp,   "y": yp}, 
              { "x": radius/2+xp,  "y": radius*h+yp},
              { "x": -radius/2+xp,  "y": radius*h+yp},
              { "x": -radius+xp,  "y": yp},
              { "x": -radius/2+xp,  "y": -radius*h+yp},
              { "x": radius/2+xp, "y": -radius*h+yp}
            ];

            var enterElements = 
                svgContainer.append("path")
                            .attr("d", drawHexagon(hexagonData))
                            .attr("stroke", "black")
                            .attr("stroke-line","20,5")
                            .attr("stroke-width", 3)
                            .attr("fill", hexagonColors[hexagonServerData[count]['color']]);

            hexagons.push(new Hexagon(count, hexagonServerData[count]['color']));

            addVertex(xp, yp, h, radius, count);

            var circleFill = hexagonServerData[count]["color"] == 5 ? "rgba(255,248,220,0)" : "rgba(255,248,220,0.8)";
            var enterCircle = svgContainer.append('circle')
                .attr('type', "enterCircle")
                .attr('cx', xp)
                .attr('cy', yp) 
                .attr('r', 25)
                .attr('fill', circleFill);
            hexagons[count].setCircle(enterCircle[0][0]);

            if (hexagonServerData[count]["color"] == 5) {
                var robier = svgContainer.append('rect')
                    .attr('x', xp - 25)
                    .attr('y', yp -25)
                    .attr('width', 50)
                    .attr('height', 50)
                    .attr('fill', "rgba(255,0,0,1)");
            }
            count++;
            hexagonsRemaining--;
        }
        hexagonsRemaining = tmphexRem + 1;
        xp = tmpX;
        yp += rowHeight;
        rowsLeft--;
        if (rowsLeft == 4) {
            xp -= hexagonWidth/2
        } else if (rowsLeft == 3) {
            xp -= hexagonWidth/2
        } else if (rowsLeft == 2) {
            xp += hexagonWidth/2
            hexagonsRemaining = 4
        } else if (rowsLeft == 1) {
            xp += hexagonWidth/2
            hexagonsRemaining = 3
        }
    }
}

function moveCirclesInFrontOfText() {
    circles = svgContainer.selectAll("circle")[0];
    for (i = 0; i < circles.length; i++) {
        if (circles[i].attributes.type.value == "enterCircle") {
                d3.select(circles[i]).each(function(){
          this.parentNode.appendChild(this);
          });
        }
    }
}

function moveRobberToTheFront() {
    //puts robber in front of all other elements
    d3.select(svgContainer.select("rect")[0][0]).each(function(){
  this.parentNode.appendChild(this);
  });
}

function addOnClickListenerToEnterCircles() {
    circles = svgContainer.selectAll("circle")[0];
    for (var i = 0; i < circles.length; i++) {
        (function() {
            if (circles[i].attributes.type.value == "enterCircle") {
                circles[i].addEventListener("click", function(texy) {
                    var robberHexagon = -1;
                    for (var hexIndex = 0; hexIndex < window.hexagons.length; hexIndex++) {
                        if (window.hexagons[hexIndex].getCircle() == this) {
                            robberHexagon = hexIndex;
                            break;
                        }
                    }

                    var i = texy;
                    var robby = svgContainer.selectAll("rect")[0][0];
                    robby.setAttribute("x", i.target.attributes.cx.value - 25);
                    robby.setAttribute("y", i.target.attributes.cy.value - 25);

                    socket.emit("robberPlacement", {"hexIndex": robberHexagon, "playerIndex": window.playerIndex});
                }, false);
            }
        }());
    }
}

function handleRobberMovement(socket) {
    socket.on("robberPlacement", function(robberInfo) {
        var robby = svgContainer.selectAll("rect")[0][0];
        var hexCircle = hexagons[robberInfo["hexIndex"]].getCircle();
        robby.setAttribute("x", hexCircle.attributes.cx.value - 25);
        robby.setAttribute("y", hexCircle.attributes.cy.value - 25);
    });
}

function addVertexNeighbors() {
    for (i = 0; i < vertices.length; i++) { // go through each vertex putting neighbors in
        var possibleNeighbors = generatePossibleNeighbors(vertices[i])
        for (j = 0; j < vertices.length; j++) {     //check if vertex is a neighbor
            for (k = 0; k < possibleNeighbors.length; k++) {
                if (vertices[j].isEqual(possibleNeighbors[k])) {
                    vertices[i].addNeighbor(vertices[j]);
                }
            }
        }
    }
}

function addRoadsBetweenNeighbors() {
    roads = [];
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

    // Draw the lines
    var roadObjects = []
    for (i = 0; i < roads.length; i++) {
        roads[i].getYList()[0]
        var line = svgContainer.append("line")
                            .attr("x1", roads[i].getXList()[0])
                            .attr("y1", roads[i].getYList()[0])
                            .attr("x2", roads[i].getXList()[1])
                            .attr("y2", roads[i].getYList()[1])
                            .attr("stroke-width", 4)
                            .attr("stroke", "transparent");
        roads[i].setLine(line[0][0]);
        roadObjects.push(line);
    }

    for (i = 0; i < roadObjects.length; i++) {
        (function() {
            var roadId = i;
            var road = roadObjects[i][0][0];
            road.addEventListener("click", 
                function(road) {
                    var i = road;
                    i.target.attributes.stroke.value = playerColors[playerIndex];
                    socket.emit("road", {"id": roadId});
                },
                false);
        }());
    }
}

function handleRoadEvent(socket) {
    socket.on("road", function(roadInfo) {
        window.roads[roadInfo["id"]].getLine().attributes.stroke.value = playerColors[roadInfo["playerIndex"]];
    });
}

function generatePossibleNeighbors(vertex) {
    var p = [];
    var x = vertex.getX();
    var y = vertex.getY();
    p.push(new Vertex(x, y + 60, h, radius, -1));
    p.push(new Vertex(x, y - 60, h, radius, -1));   // up and down

    p.push(new Vertex(x - radius, y - 28, h, radius, -1));    // left up diagonal
    p.push(new Vertex(x - radius, y + 28, h, radius, -1));   // left down diagonal
    p.push(new Vertex(x + radius, y - 28, h, radius, -1));   // right up diagonal
    p.push(new Vertex(x + radius, y + 28, h, radius, -1));   // right down diagonal

    return p;
}

function getDiceRoll() {
    var one = Math.floor(Math.random()*6) + 1;
    var two = Math.floor(Math.random()*6) + 1;
    var dice1 = document.getElementById("dice1");
    var dice2 = document.getElementById("dice2");
    dice1.src="dice-rolling-" + one.toString() + ".png"
    dice2.src="dice-rolling-" + two.toString() + ".png"
    if (one + two == 7) {
        var circlelists = document.getElementsByTagName("circle");
        for (i = 0; i < circlelists.length; i++) {
            if (circlelists[i].attributes.type.value == "enterCircle") {
                circlelists[i].style.cursor = "hand";
            }
        }
    }
    return [one, two];
}

function addVertex(xp, yp, h, radius, count) {
    for (i = 0; i < 6; i++) {
        var vertex = new Vertex(xp, yp, h, radius, i);
        var add = true;
        vertex.addHexagon(count);
        for (j = 0; j < vertices.length; j++) {
            if (vertices[j].isEqual(vertex)) {
                add = false;
                vertices[j].addHexagon(count);
                hexagons[count].addVertex(vertices[j]);
                break;
            }
        }
        if (add) {
            hexagons[count].addVertex(vertex);
            vertex.setId(vertices.length);
            vertices.push(vertex);
        }
    }
}

function addVertexCircles() {
    var vertexes = [];
    for (var i = 0; i < vertices.length; i++) {
        var enterCircle = svgContainer.append('circle')
                                    .attr('type', "vertexcircle")
                                .attr('cx', vertices[i].getX()) //centers[i][0])
                                .attr('cy', vertices[i].getY()) //centers[i][1])
                                .attr('r', 15)
                                .attr('fill', "rgba(0,248,220,0.0)");
        vertexes.push(enterCircle);
        vertices[i].setCircle(enterCircle[0][0]);
    }
    return vertexes;
}

function changeNumberColors() {
    var textFieldsList = svgContainer.selectAll("text")[0];
    for (i = 0; i < textFieldsList.length; i++){
        var num = svgContainer.selectAll("text")[0][i].innerHTML;
        if (svgContainer.selectAll("text")[0][i].attributes.fill.value == "red") {
            if (num != "6" && num != "8") {
                svgContainer.selectAll("text")[0][i].attributes.fill.value = "black";
            }
        }
    }
}

//Add number to circle ui
function addNumbersToCircles(hexagonServerData) {
            //Add the SVG Text Element to the svgContainer
    var text = svgContainer.selectAll("text")
                            .data(svgContainer.selectAll("circle")[0])
                            .enter().append("text");
    var curHexagon = -1;
    var textLabels = text
                .attr("x", function(d) { return d.cx.baseVal.value; })
                .attr("y", function(d) { return d.cy.baseVal.value +7; })
                .text( function (d) {
                    curHexagon += 1;
                    return hexagonServerData[curHexagon]['number']; 
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", "20px")
                .attr("fill", "red")
                .style("text-anchor", "middle");
}

function addOnClickListenerToVertices(vertexCircles) {
    for (var i = 0; i < vertices.length; i++) {
        (function () {
            var circle = vertices[i].getCircle();
            var vertex = vertices[i];
            circle.addEventListener("click", function() {
                this.attributes.fill.value = window.playerColors[window.playerIndex];
                vertex.upgradeHouse();
                var locationInfo = {"id": vertex.getId(), "houseType": vertex.getHouseType()};
                socket.emit("vertex", locationInfo);
            }, false);
        }());
    }
}

function handleHousePlacement(socket) {
    socket.on("vertex", function(locationInfo) {
        window.vertices[locationInfo["id"]].getCircle().attributes.fill.value = playerColors[locationInfo["playerIndex"]];
        window.vertices[locationInfo["id"]].upgradeHouse();
    });
}

//Set hexagon javascript object number
function addNumbersToHexagons() {
    var texts = svgContainer.selectAll("text")[0];
    for (var i = 0; i < texts.length; i++) {
        var hexNumber = texts[i].textContent;
        hexagons[i].setDiceNumber(parseInt(hexNumber));
    }
}
