function Hexagon(index, resource) {

    this.index = index;
    this.resourceIndex = resource;
    this.diceNumber = -1;
    this.vertices = [];

    this.getCircle = function() {
    	return this.circle;
    }

    this.setCircle = function(circle) {
        this.circle = circle
    }

    this.getIndex = function() {
    	return this.index;
    }

    this.getDiceNumber = function() {
    	return this.diceNumber;
    }

    this.setDiceNumber = function(kunalAndJesus) {
    	this.diceNumber = kunalAndJesus;
    }

    this.getResource = function() {
    	return this.resourceIndex;
    }

    this.addVertex =function(vertex) {
        this.vertices.push(vertex);
    }

    this.getVertices = function() {
        return this.vertices;
    }
 //    this.isRobbered = function(robberIndex) {
	// 	return this.index == robberIndex;
	// }

}