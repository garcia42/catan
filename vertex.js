function Vertex(xp, yp, h, radius, index) {

	var x = 0;
	var y = 0;
	var hexagons = [];
	var diceNumbers = [];
	var neighbors = [];


	var downShift = 20 * scale;
	var upDown = 8 * scale;

	var __construct = function(argument) {

		if (index == -1) {
			x = xp;
			y = yp;
		} else if (index == 0) { // up
			x = xp;
			y = yp - radius - upDown;
		} else if (index == 1) { // up right
			x = radius+xp;
			y = -radius+yp + downShift;
		} else if (index == 2) { //down right
			x = radius+xp;
			y = radius+yp - downShift;
		} else if (index == 3) { //down
			x = xp;
			y = yp + radius + upDown;
		} else if (index == 4) { // down left
			x = -radius+xp
			y = radius+yp - downShift;
		} else if (index == 5) { // up left
			x = -radius+xp;
			y = -radius+yp + downShift;
		}
	}()

  	this.getX = function() {
 		return x;
   	};

   	this.getY = function() {
      return y;
   	};

    this.isEqual = function(vertex) {
    	return x === vertex.getX() && y === vertex.getY();
    }

    this.addHexagon = function(hex) {
    	hexagons.push(hex);
    }

    this.getHexagons = function() {
    	return hexagons;
    }

    this.addNeighbor = function(neighbor) {
    	neighbors.push(neighbor);
    }

    this.getNeighbors = function() {
    	return neighbors;
    }
}
