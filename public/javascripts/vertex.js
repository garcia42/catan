function Vertex(xp, yp, h, radius, index) {

	this.hexagons = [];
	this.diceNumbers = [];
	this.neighbors = [];
	this.roads = {};

	var downShift = 20 * scale;
	var upDown = 8 * scale;
	var radius = radius;
	var h = h;

	if (index == -1) {
		this.x = xp;
		this.y = yp;
	} else if (index == 0) { // up
		this.x = xp;
		this.y = yp - radius - upDown;
	} else if (index == 1) { // up right
		this.x = radius+xp;
		this.y = -radius+yp + downShift;
	} else if (index == 2) { //down right
		this.x = radius+xp;
		this.y = radius+yp - downShift;
	} else if (index == 3) { //down
		this.x = xp;
		this.y = yp + radius + upDown;
	} else if (index == 4) { // down left
		this.x = -radius+xp
		this.y = radius+yp - downShift;
	} else if (index == 5) { // up left
		this.x = -radius+xp;
		this.y = -radius+yp + downShift;
	}

  	this.getX = function() {
 		return this.x;
   	};

   	this.getY = function() {
      return this.y;
   	};

    this.isEqual = function(vertex) {
    	return this.x === vertex.getX() && this.y === vertex.getY();
    }

    this.addHexagon = function(hex) {
    	this.hexagons.push(hex);
    }

    this.getHexagons = function() {
    	return this.hexagons;
    }

    this.addNeighbor = function(neighbor) {
    	this.neighbors.push(neighbor);
    }

    this.getNeighbors = function() {
    	return this.neighbors;
    }

    this.setCircle = function(circle) {
    	this.circle = circle;
    }

    this.getCircle = function() {
    	return this.circle;
    }

    this.generatePossibleNeighbors = function() {
	    var p = [];
	    var x = this.getX();
	    var y = this.getY();
	    p.push(new Vertex(x, y + 60, h, radius, -1));
	    p.push(new Vertex(x, y - 60, h, radius, -1));   // up and down

	    p.push(new Vertex(x - radius, y - 28, h, radius, -1));    // left up diagonal
	    p.push(new Vertex(x - radius, y + 28, h, radius, -1));   // left down diagonal
	    p.push(new Vertex(x + radius, y - 28, h, radius, -1));   // right up diagonal
	    p.push(new Vertex(x + radius, y + 28, h, radius, -1));   // right down diagonal

	    return p;
	}

	this.addRoad = function(roadId, vertexId) {
		this.roads[roadId] = vertexId;
	}

	this.getRoads = function() {
		return this.roads;
	}

	this.getId = function() {
		return this.id;
	}

	this.setId = function(id) {
		this.id = id;
	}

	this.getRoadsOfColor = function(color, roadsDict) {
		var road;
		var roads = [];
		for (road in this.getRoads()) {
			if (roadsDict[road].getColor() == color) {
				roads.push(road);
			}
		}
		return roads;
	}

	/** Returns a road:vertex dictionary of all roads that are of a same color connected to this one. */
	this.getVerticesConnectedByColor = function(color, roadsDict) {
		var i;
		var roadsTovertices = {};
		var roadsOfColor = this.getRoadsOfColor(color, roadsDict);
		for (i in roadsOfColor) {
			roadsTovertices[roadsOfColor[i]] = this.getRoads()[roadsOfColor[i]];
		}
		return roadsTovertices;
	}

	this.getNumberOfRoadsOfColor = function(color, roadsDict) {
		return this.getRoadsOfColor(color, roadsDict).length;
	}
}
