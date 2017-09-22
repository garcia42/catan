function Road(xO, yO, xT, yT, id) {
	this.x1 = xO;
	this.y1 = yO;
	this.x2 = xT;
	this.y2 = yT;
	this.id = id;
	this.endPoints = []; //Vertices at ends of this road

	this.isEqual = function(road) { //TODO Change this to see if there is a road between the same two endpoints
		var xL2 = road.getXList();
		var yL2 = road.getYList();
		var xEqual = (inDelta(xL2[0], this.x2) || inDelta(xL2[1], this.x2)) && (inDelta(xL2[0], this.x1) || inDelta(xL2[1], this.x1));
		var yEqual = (inDelta(yL2[0], this.y2) || inDelta(yL2[0], this.y2)) && (inDelta(yL2[0], this.y1) || inDelta(yL2[1], this.y1));
		return xEqual && yEqual;
	}

	function inDelta(x, y) {
		return Math.abs(x - y) < 1;
	}

	this.getXList = function() {
		return [this.x1, this.x2];
	}

	this.getYList = function() {
		return [this.y1, this.y2];
	}

	this.isShowing = function() {
		return this.getColor() != "transparent";
	}

	this.getColor = function() {
		return this.line.attributes.stroke.value;
	}

	this.setLine = function(line) {
		this.line = line;
	}

	this.addEndpoint = function(vertex) {
		this.endPoints.push(vertex);
	}

	this.getEndpoints = function() {
		return this.endPoints;
	}

	this.getLine = function() {
		return this.line;
	}

	this.getNeighbors = function(verticesDict) {
		var neighbors = [];
		var i;
		var key;
		for (i in this.getEndpoints()) {
			var vIndex = this.getEndpoints()[i];
			var neighborRoadsDict = verticesDict[vIndex].getRoads();
			for (key in neighborRoadsDict) {
				if (key != this.getId()) { //Dont add neighbor Ids that match your own id
					neighbors.push(key);
				}
			}
		}
		return neighbors;
	}

	this.getNeighborsOfSameColor = function(roadsD, verticesDict) {
		var sameColorNeighbors = [];
		for (neighbor in this.getNeighbors(verticesDict)) {
			if (this.getColor() == roadsD[this.getNeighbors(verticesDict)[neighbor]].getColor()) {
				sameColorNeighbors.push(this.getNeighbors(verticesDict)[neighbor]);
			}
		}
		return sameColorNeighbors;
	}

	//In the case of a circle of roads, return the road with the least connected same color roads
	this.getEndsOfRoadSameColor = function(roadsD, verticesDict) {
		var queue = [this.getId()];
		var visited = [this.getId()];
		var curLowestRoad;
		var curLowestValue = 100;
		var endRoads = [];
		while (queue.length > 0) {
			curRoad = queue.pop();
			var neighbors = roadsD[curRoad].getNeighborsOfSameColor(roadsD, verticesDict);
			if (neighbors.length <= 1) {
				endRoads.push(curRoad);
			}
			if (neighbors.length < curLowestValue) {
				curLowestValue = neighbors.length;
				curLowestRoad = curRoad;
			}
			var neighbor;
			for (neighbor in neighbors) {
				if (visited.indexOf(neighbors[neighbor]) == -1) {
					queue.push(neighbors[neighbor]);
					visited.push(neighbors[neighbor]);
				}
			}
		}

		if (endRoads.length == 0) {
			return [curLowestRoad];
		}
		return endRoads;
	}

	this.isInList = function(roadList) {
		var i;
		for (i = 0; i < roadList.length; i++) {
			if (this.isEqual(roadList[i])) {
				return true;
			}
		}
		return false;
	}

	this.getId = function() {
		return this.id;
	}

	this.setId = function(id) {
		this.id = id;
	}

	//Find Vertex that has only 1 road of the same color as this one, could be both or neither
	this.getEndVertex = function(roadsDict, verticesDict) {
		var endpoint;
		for (endpoint in this.getEndpoints(verticesDict)) {
			var vertexIndex = this.getEndpoints()[endpoint];
			if (verticesDict[vertexIndex].getNumberOfRoadsOfColor(this.getColor(), roadsDict) == 1) {
				return this.getEndpoints()[endpoint];
			}
		}
		return -1;
	}
}
