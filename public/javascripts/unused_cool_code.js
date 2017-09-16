function createHexagonBoard(hexagonServerData) {
    var radius = 50 * scale;
    var xp = 190;
    var yp = 110;
    var size = 5;

    //Calculate the center positions of each hexagon 
    var points = [];
    var count = 0;
    for (var i = Math.floor(size/2); i < size; i++) {
        for (var j = 0; j < size - count ; j++) {
            var x = xp + radius * j * 1.75 + (radius * count);
            var y = yp + radius * i * 1.5;
            points.push([x, y]); //Do self, then if not center, do mirrored row above

            if (i > Math.floor(size/2)) {
                var yMirror = yp + (radius * 1.5) * (Math.floor(size/2) - count);
                points.push([x, yMirror]);
            }
        }//for j
        count += 1;
    }//for i

    //Set the hexagon radius
    var hexbin = d3.hexbin()
                .radius(radius);

    //Draw the hexagons
    svgContainer.append("g")
        .selectAll(".hexagon")
        .data(hexbin(points))
        .enter().append("path")
        .attr("class", "hexagon")
        .attr("d", function (d) {
            console.log(d);
      return "M" + d.x + "," + d.y + hexbin.hexagon();
     })
        .attr("stroke", "black")
        // .attr("stroke", "red")
        .attr("stroke-line","20,5")
        .attr("stroke-width", "3px")
        .style("fill", function(d, i) {
            return colors[hexagonServerData[i]["color"]];
     });
}