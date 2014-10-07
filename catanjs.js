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

while (rowsLeft > 0) {
    var tmphexRem = hexagonsRemaining;
    var tmpX = xp;
    while (hexagonsRemaining > 0) {
        xp += 100

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
                        .attr("fill", "rgba(255,0,0,0.4)");
        hexagonsRemaining--;
    }
    hexagonsRemaining = tmphexRem + 1;
    xp = tmpX;
    yp += 90
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


//--------------------------------------------------------------------------------------------------------------------------------

// var h1 = (Math.sqrt(3)/2),
//     radius = 100,
//     xp = 350,
//     yp = 250,
//     hexagonData1 = [
//       { "x": radius+xp,   "y": yp}, 
//       { "x": radius/2+xp,  "y": radius*h+yp},
//       { "x": -radius/2+xp,  "y": radius*h+yp},
//       { "x": -radius+xp,  "y": yp},
//       { "x": -radius/2+xp,  "y": -radius*h+yp},
//       { "x": radius/2+xp, "y": -radius*h+yp}
//     ];

// var enterElements = 
//     svgContainer.append("path")
//                 .attr("d", drawHexagon(hexagonData1))
//                 .attr("stroke", "red")
//                 .attr("stroke-line","20,5")
//                 .attr("stroke-width", 3)
//                 .attr("fill", "rgba(255,0,0,0.4)");

//--------------------------------------------------------------------------------------------------------------------------------

// while (hexagonsRemaining > 0) {
//  var color = getColor();
//  var msgContainer = document.createElement('div');
//      msgContainer.style.position = "absolute";
//  msgContainer.style.top = fromTop;
//  msgContainer.style.left = left;
//  msgContainer.id = 'hex1';             // No setAttribute required
//  msgContainer.className = 'hexagon-wrapper' // No setAttribute required, note it's "className" to avoid conflict with JavaScript reserved word
//  document.body.appendChild(msgContainer);

//  var hexagon = document.createElement('div');
//  hexagon.id= color;
//  hexagon.className = 'hexagon'
//  msgContainer.appendChild(hexagon);
//  hexagonsRemaining -= 1;
//  fromTop += 50;
//  left = left + 50;
// }

// function getColor() {
//  var colors = ['color1', 'color2', 'color3', 'color4', 'color5'];
//  var determinant = Math.random();
//  var colorIndex = 0;
//  if (determinant < .2) {
//      colorIndex = 0;
//  } else if (determinant <.4) {
//      colorIndex = 1;
//  } else if (determinant < .6) {
//      colorIndex = 2;
//  } else if (determinant < .8) {
//      colorIndex = 3;
//  } else {
//      colorIndex = 4;
//  }
//  return colors[colorIndex];
// }