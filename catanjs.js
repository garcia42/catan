var hexagonsRemaining = 3;
var rowsLeft = 5

var h = (Math.sqrt(3)/2),
    radius = 50,
    xp = 300,
    yp = 60,
    hexagonData = [
      { "x": radius+xp,   "y": yp}, 
      { "x": radius/2+xp,  "y": radius*h+yp},
      { "x": -radius/2+xp,  "y": radius*h+yp},
      { "x": -radius+xp,  "y": yp},
      { "x": -radius/2+xp,  "y": -radius*h+yp},
      { "x": radius/2+xp, "y": -radius*h+yp}
    ];

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
      .attr("height", 900);

//red, yellow, light-green, green, grey, tan
var colors = ["rgba(255,0,0,0.4)", "rgba(255,255,0,0.4)", "rgba(0,255,0,0.4)", "rgba(0,102,0,0.4)", "rgba(96,96,96,0.4)", "rgba(255,255,204,0.4)"];

var colorCount = [0, 0, 0, 0, 0];

var numberCount = [0, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 2, 1] // i.e  -    The numbers 0 - 12, in their total numbers on the board

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

        var enterElements = 
            svgContainer.append("path")
                        .attr("d", drawHexagon(hexagonData))
                        .attr("stroke", "red")
                        .attr("stroke-line","20,5")
                        .attr("stroke-width", 3)
                        .attr("fill", colors[randomNumber]);
        hexagonsRemaining--;
    }
    hexagonsRemaining = tmphexRem + 1;
    xp = tmpX;
    yp += 90;
    rowsLeft--;
    if (rowsLeft == 4) {
        xp -= 50
    } else if (rowsLeft == 3) {
        xp -= 50
    } else if (rowsLeft == 2) {
        xp += 50
        hexagonsRemaining = 4
    } else if (rowsLeft == 1) {
        xp += 50
        hexagonsRemaining = 3
    }
}

//Do not currently have support for adjacent squares not being of same type.
function getRandomColorNumber() {
    //var colorCount = [0, 0, 0, 0, 0];
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
