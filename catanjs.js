var scale = 1;
var hexagonsRemaining = 3;
var rowsLeft = 5;
var hexagonWidth = 100 * scale;
var rowHeight = 88 * scale;
var containerHeight = 900 * scale;
var containerWidth = 600 * scale;

var h = (Math.sqrt(3)/2),
    radius = 50 * scale,
    xp = 190,
    yp = 110,
    hexagonData = [
      { "x": radius+xp,   "y": yp}, 
      { "x": radius/2+xp,  "y": radius*h+yp},
      { "x": -radius/2+xp,  "y": radius*h+yp},
      { "x": -radius+xp,  "y": yp},
      { "x": -radius/2+xp,  "y": -radius*h+yp},
      { "x": radius/2+xp, "y": -radius*h+yp}
    ]

drawHexagon = 
    d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("cardinal-closed")
        .tension("0.25");

var svgContainer = 
    d3.select("body")
      .append("svg")
      .attr("width", containerHeight)
      .attr("height", containerWidth);

//red, yellow, light-green, green, grey, tan
var colors = ["rgba(255,0,0,0.4)", "rgba(255,255,0,0.4)", "rgba(0,255,0,0.4)", "rgba(0,102,0,0.4)", "rgba(96,96,96,0.4)", "rgba(255,255,204,0.4)"];

var colorCount = [0, 0, 0, 0, 0];

var numberCount = []; // i.e  -    The numbers 0 - 12, in their total numbers on the board

var vertices = []; // going to be added using the centers and calculations.

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

var centers = [];

var noCircle = Math.floor(Math.random()*18);
var count = 0;
while (rowsLeft > 0) {
    var tmphexRem = hexagonsRemaining;
    var tmpX = xp;
    while (hexagonsRemaining > 0) {
        xp += hexagonWidth;

        var randomNumber = getRandomColorNumber()
        //var randomNumber = Math.floor(Math.random()*5);

        hexagonData = [
          { "x": radius+xp,   "y": yp}, 
          { "x": radius/2+xp,  "y": radius*h+yp},
          { "x": -radius/2+xp,  "y": radius*h+yp},
          { "x": -radius+xp,  "y": yp},
          { "x": -radius/2+xp,  "y": -radius*h+yp},
          { "x": radius/2+xp, "y": -radius*h+yp}
        ];

        addVertex(xp, yp, h, radius, count);

        centers.push([xp, yp]);

        if (count == noCircle) {
            randomNumber = 5;
        }
        var enterElements = 
            svgContainer.append("path")
                        .attr("d", drawHexagon(hexagonData))
                        .attr("stroke", "red")
                        .attr("stroke-line","20,5")
                        .attr("stroke-width", 3)
                        .attr("fill", colors[randomNumber]);
        
        if (count != noCircle) {
            var enterCircle = svgContainer.append('circle')
                            .attr('cx', xp) //centers[i][0])
                            .attr('cy', yp) //centers[i][1])
                            .attr('r', 25)
                            .attr('fill', "rgba(255,248,220,0.75)");
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

//Add the SVG Text Element to the svgContainer
var text = svgContainer.selectAll("text")
                        .data(svgContainer.selectAll("circle")[0])
                        .enter()
                        .append("text");
addNumbersToCircles();
changeNumberColors();
addNumbersToVertices();
vertexCircles = addVertexCircles();
addOnClickListenerToVertices(vertexCircles);
addVertexNeighbors();
addRoadsBetweenNeighbors();

// fixAdjacentRedNumbers();

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
    roadObjects = []
    for (i = 0; i < roads.length; i++) {
        roads[i].getYList()[0]
        if (i != 0) {
            var line = svgContainer.append("line")
                                .attr("x1", roads[i].getXList()[0])
                                .attr("y1", roads[i].getYList()[0])
                                .attr("x2", roads[i].getXList()[1])
                                .attr("y2", roads[i].getYList()[1])
                                .attr("stroke-width", 3)
                                .attr("stroke", "transparent");
            roadObjects.push(line)
        }
    }

    for (i = 0; i < roadObjects.length; i++) {
        var road = roadObjects[i][0][0];
        road.addEventListener("click", function(road) {
            var i = road;
            i.target.attributes.stroke.value = "black"}, false);
    }

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

//Getting the next number for a square
function getNextNumber() {
    var random = Math.floor(Math.random()*numberCount.length);
    var toReturn = numberCount[random];
    numberCount.splice(random, 1);
    return toReturn;
}

//Do not currently have support for adjacent squares not being of same type.
function getRandomColorNumber() {
    var randomNumber = Math.floor(Math.random()*5);
    if (colorCount[randomNumber] > 3) {
        return getRandomColorNumber();
    } else {
        colorCount[randomNumber] += 1;
        return randomNumber;
    }
}

function getRandomTileNumber() {
    var randomNumber = Math.floor(Math.random()*5);
}

function getDiceRoll() {
    var one = Math.floor(Math.random()*6);
    var two = Math.floor(Math.random()*6);
    return [one, two];
}

function addVertex(xp, yp, h, radius, count) {
    for (i = 0; i < 6; i++) {
        vertex = new Vertex(xp, yp, h, radius, i);
        add = true;
        vertex.addHexagon(count);
        for (j = 0; j < vertices.length; j++) {
            if (vertices[j].isEqual(vertex)) {
                add = false;
                vertices[j].addHexagon(count);
                break;
            }
        }
        if (add) {
            vertices.push(vertex);
        }
    }
}

function addVertexCircles() {
    vertexes = [];
    for (i = 0; i < vertices.length; i++) {
        var enterCircle = svgContainer.append('circle')
                                .attr('cx', vertices[i].getX()) //centers[i][0])
                                .attr('cy', vertices[i].getY()) //centers[i][1])
                                .attr('r', 15)
                                .attr('fill', "rgba(0,248,220,0.75)");
        vertexes.push(enterCircle);
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

//Add SVG Text Element Attributes
function addNumbersToCircles() {
    var textLabels = text
                .attr("x", function(d) { return d.cx.baseVal.value; })
                .attr("y", function(d) { return d.cy.baseVal.value +7; })
                .text( function (d) { return getNextNumber(); })
                .attr("font-family", "sans-serif")
                .attr("font-size", "20px")
                .attr("fill", "red")
                .style("text-anchor", "middle");
}

function addOnClickListenerToVertices(vertexCircles) {
    for (i = 0; i < vertexCircles.length; i++) {
        var circle = vertexCircles[i][0][0];
        circle.addEventListener("click", myFunction);
    }
}

function myFunction() {
    alert ("Hello World!");
}

function drawRoadClick() {

}

function addNumbersToVertices() {
    var texts = svgContainer.selectAll("text")[0];
    var realHexagonIndex = 0;
    for (i = 0; i < texts.length; i++, realHexagonIndex++) {
        if (i == noCircle) {        // make sure on correct hexagon, can skip the no text hexagon
            realHexagonIndex++;
        }
        var hexNumber = texts[i].textContent;
        for (j = 0; j < vertices.length; j++) { //find matching vertices of the real index
            if (vertices[j].getHexagons().indexOf(realHexagonIndex) > -1) {
                vertices[j].addNumber(parseInt(hexNumber));
            }
        }
    }
}

// function fixAdjacentRedNumbers() {
//     adj = true;
//     while (adj) {
//         adj = false;
//         for (i = 0; i < vertices.length; i++) {
//             ns = vertices[i].getNumbers().slice(0);
//             var hasSix = false;
//             var hasEight = false;
//             if (ns.indexOf(6) > -1) {
//                 hasSix = true;
//                 ns = ns.splice(ns.indexOf(6))
//             }
//             if (ns.indexOf(8) > -1) {
//                 hasEight = true;
//                 ns = ns.splice(ns.indexOf(8))
//             }
//             if ((hasSix && hasEight) || (hasSix && ns.indexOf(6) > -1) || (hasEight && ns.indexOf(8) > -1)) {
//                 adj = true;
//                 switchNumbers(vertices[i]);
//                 //do the switch
//             }
//         }
//     }
// }


//     var textFieldsList = svgContainer.selectAll("text")[0];
//     for (i = 0; i < textFieldsList.length; i++){
//         var num = svgContainer.selectAll("text")[0][i].innerHTML;
//         if (svgContainer.selectAll("text")[0][i].attributes.fill.value == "red") {
//             if (num != "6" && num != "8") {
//                 svgContainer.selectAll("text")[0][i].attributes.fill.value = "black";
//             }
//         }
//     }
// }