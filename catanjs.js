var hexagonsRemaining = 3;
var rowsLeft = 5;
var hexagonWidth = 50;
var rowHeight = 88;

var h = (Math.sqrt(3)/2),
    radius = 50,
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
      .attr("width", 900)
      .attr("height", 600);

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
        xp += 100;

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

        addVertex(xp, yp, h, radius);

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
        xp -= hexagonWidth
    } else if (rowsLeft == 3) {
        xp -= hexagonWidth
    } else if (rowsLeft == 2) {
        xp += hexagonWidth
        hexagonsRemaining = 4
    } else if (rowsLeft == 1) {
        xp += hexagonWidth
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
vertexCircles = addVertexCircles();
addOnClickListenerToVertices(vertexCircles);

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

function addVertex(xp, yp, h, radius) {
    for (i = 0; i < 6; i++) {
        vertex = new Vertex(xp, yp, h, radius, i);
        add = true;
        for (j = 0; j < vertices.length; j++) {
            if (vertices[j].isEqual(vertex)) {
                add = false;
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