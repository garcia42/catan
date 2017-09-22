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

var playerIndex = 0;
var playerTurn = 0;

$(document).ready(function() {


    socket.on('newBoard', function(serverData) {
        var hexagonsVertices = createHexagonBoard(serverData["hexagons"]);
        createHexagonsUi();
        createVerticesUi();
        createRoadsUi();
    //     playerIndex = serverData["playerIndex"];
    //     console.log("Drawing Board");
    //     loadHexagons(serverData["hexagons"]);
    //     // loadVertices(serverData["vertices"]);
    //     console.log("Adding Numbers to Circles");
    //     addNumbersToCircles(serverData["hexagons"]);
    //     changeNumberColors();
    //     addNumbersToHexagons();
    //     vertexCircles = addVertexCircles();
    //     addOnClickListenerToVertices(vertexCircles);
    //     //moveCirclesInFrontOfText();   // Either this or make a event listener for the text.
    //     moveRobberToTheFront();
    //     addVertexNeighbors();
    //     addRoadsBetweenNeighbors();
    //     addOnClickListenerToEnterCircles();  // supposed to be center circle
    });

    // handleHousePlacement(socket);
    // handleRoadEvent(socket);
    // handleRobberMovement(socket);
    // handleDiceRoll(socket);
});

function createHexagonBoard(hexagonServerData) {
    var radius = 50 * scale;
    var xp = 190;
    var yp = 110;
    var size = 5;
    var hexagons = [];
    vertices = [];

    //Calculate the center positions of each hexagon 
    var points = [];
    var count = 0;
    for (var i = Math.floor(size/2); i < size; i++) {
        for (var j = 0; j < size - count ; j++) {
            var x = xp + radius * j * 1.75 + (radius * count);
            var y = yp + radius * i * 1.5;
            points.push([x, y]); //Do self, then if not center, do mirrored row above
            hexagons.push(new Hexagon(hexagons.length, hexagonServerData[hexagons.length]['color']));

            if (i > Math.floor(size/2)) {
                var yMirror = yp + (radius * 1.5) * (Math.floor(size/2) - count);
                points.push([x, yMirror]);
                hexagons.push(new Hexagon(hexagons.length, hexagonServerData[hexagons.length]['color']));
            }
        }//for j
        count += 1;
    }//for i

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

    addVertexNeighbors(vertices, radius);
    var roads = addRoadsBetweenNeighbors(vertices);
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

function addVertex(vertices, hexagons, xp, yp, radius, curHexagon) {
    var vertex = new Vertex(xp, yp, radius, -1);
    var add = true;
    for (j = 0; j < vertices.length; j++) {
        if (vertices[j].isEqual(vertex)) {
            add = false;
            vertices[j].addHexagon(curHexagon);
            hexagons[curHexagon].addVertex(vertices[j]);
            break;
        }
    }
    if (add) {
        vertex.addHexagon(curHexagon);
        hexagons[curHexagon].addVertex(vertex);
        vertex.setId(vertices.length);
        vertices.push(vertex);
    }
}

var d3_hexbinAngles = d3.range(0, 2 * Math.PI, Math.PI / 3);

function addVertexCircles(vertices) {
    var vertexes = [];
    for (var i = 0; i < vertices.length; i++) {
        var enterCircle = svgContainer.append('circle')
                                    .attr('type', "vertexcircle")
                                .attr('cx', vertices[i].getX()) //centers[i][0])
                                .attr('cy', vertices[i].getY()) //centers[i][1])
                                .attr('r', 15)
                                .attr('fill', "rgba(0,248,220,0.8)");
        vertexes.push(enterCircle);
        vertices[i].setCircle(enterCircle[0][0]);
    }
    return vertexes;
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

function addRoadLines(roads) {
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
                            .attr("stroke", "red");
        roads[i].setLine(line[0][0]);
        roadObjects.push(line);
    }
}