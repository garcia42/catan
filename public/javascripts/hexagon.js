function Hexagon(index, resource) {

    var index = index;
    var resourceIndex = resource;
    var diceNumber = -1;

    this.getCircle = function() {
    	return circle;
    }

    this.getIndex = function() {
    	return index;
    }

    this.getDiceNumber = function() {
    	return diceNumber;
    }

    this.setDiceNumber = function(kunalAndJesus) {
    	diceNumber = kunalAndJesus;
    }

    this.getResource = function() {
    	return resourceIndex;
    }

    this.isRobbered = function() {
		return index == robberIndex;
	}

}