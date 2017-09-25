class Vertex {

	constructor(xp, yp, radius) {

		this.x = xp;
		this.y = yp;
		this.hexagons = [];
		this.diceNumbers = [];
		this.neighbors = [];
		this.roads = {};
		this.player = -1;
		this.houseType = 0;
	}

	getPlayerIndex() {
		return this.playerIndex;
	}

	setPlayerIndex(playerId) {
		return this.playerIndex;
	}

  	getX() {
 		return this.x;
   	};

   	getY() {
      return this.y;
   	};

    isEqual(vertex) {
    	return this.x == vertex.getX() && this.y == vertex.getY();
    }

    addHexagon(hex) {
    	this.hexagons.push(hex);
    }

    getHexagons() {
    	return this.hexagons;
    }

    addNeighbor(neighbor) {
    	this.neighbors.push(neighbor);
    }

    getNeighbors() {
    	return this.neighbors;
    }

    setCircle(circle) {
    	this.circle = circle;
    }

    getCircle() {
    	return this.circle;
    }

	addRoad(roadId, vertexId) {
		this.roads[roadId] = vertexId;
	}

	getRoads() {
		return this.roads;
	}

	getId() {
		return this.id;
	}

	setId(id) {
		this.id = id;
	}

	getRoadsOfColor(color, roadsDict) {
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
	getVerticesConnectedByColor(color, roadsDict) {
		var i;
		var roadsTovertices = {};
		var roadsOfColor = this.getRoadsOfColor(color, roadsDict);
		for (i in roadsOfColor) {
			roadsTovertices[roadsOfColor[i]] = this.getRoads()[roadsOfColor[i]];
		}
		return roadsTovertices;
	}

	getNumberOfRoadsOfColor(color, roadsDict) {
		return this.getRoadsOfColor(color, roadsDict).length;
	}

	setHouseType(houseType) {
		this.houseType = houseType;
	}

	getHouseType() {
		return this.houseType;
	}

	upgradeHouse() {
		this.houseType += 1;
		if (this.houseType > 2) {
			console.log("Error: Housetype of vertex greater than 2, vertexId: " + this.getId());
		}
	}
}

module.exports = Vertex;