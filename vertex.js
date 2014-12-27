function Vertex(xp, yp, h, radius, index) {

	var x = 0;
	var y = 0;
	var hexagons = [];
	var diceNumbers = [];


	var downShift = 20;
	var upDown = 8;

	var __construct = function(argument) {

		if (index == 0) { // up
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

    this.addHexagon = function(number) {
    	hexagons.push(number);
    	return;
    }

    this.getHexagons = function() {
    	return hexagons;
    }

    this.addNumber = function(number) {
    	diceNumbers.push(number);
    }

    this.getNumbers = function() {
    	return diceNumbers;
    }
}
