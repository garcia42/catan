function Road(xO, yO, xT, yT) {
	var x1 = xO;
	var y1 = yO;
	var x2 = xT;
	var y2 = yT;

	this.isEqual = function(road) {
		xL2 = road.getXList();
		yL2 = road.getYList();
		xEqual = (xL2[0] == x2 || xL2[1] == x2) && (xL2[0] == x1 || xL2[1] == x1)
		yEqual = (yL2[0] == y2 || yL2[1] == y2) && (yL2[0] == y1 || yL2[1] == y1)
		return xEqual && yEqual
	}

	this.getXList = function() {
		return [x1, x2];
	}

	this.getYList = function() {
		return [y1, y2];
	}
}