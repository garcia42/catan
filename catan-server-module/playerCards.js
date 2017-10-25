var order = ["wood", "brick", "sheep", "wheat", "ore", 'Knight', 'Victory point', 'Road building', 'Monopoly', 'Year of plenty'];

class PlayerCards {

	constructor(index) {
		this.playerIndex = index;
		this.cardData = {};
		for (var resource in order) {
			this.cardData[order[resource]] = 0;
		}
	}

	getPlayerIndex() {
		return this.playerIndex;
	}

	getResourceAmount(resourceIndex) {
		return this.cardData[order[resourceIndex]];
	}

	addResourceAmount(resourceIndex, value) {
		this.cardData[order[resourceIndex]] += value;
	}

	subtractResourceAmount(resourceIndex, value) {
		this.cardData[order[resourceIndex]] -= value;
		if (this.cardData[order[resourceIndex]] < 0) {
			console.log("ERROR: Too few resources of ", resourceIndex);
		}
	}

	monopolyResource(resourceIndex) {
		var amountToSteal = this.getResourceAmount(resourceIndex);
		this.subtractResourceAmount(resourceIndex, this.getResourceAmount(resourceIndex));
		return amountToSteal;
	}

	getTotalCards() {
		var resources = [0,1,2,3,4];
		var count = 0;
		for (var i in resources) {
			count += this.getResourceAmount(resources[i]);
		}
		return count;
	}

	hasMoreThanSeven() {
		return this.getTotalCards() > 7;
	}

	yearOfPlenty(resources) {
		for (var i in resources) {
			this.addResourceAmount(resources[i], 1);
		}
	}

	rob() {
		if (this.getTotalCards() == 0) {
			return -1;
		}
		var random = Math.floor(Math.random()* this.getTotalCards());
		var index = 0;
	    while (random >= 0 && index < 5) {
	        if (random - this.getResourceAmount(index) > 0) {
	            random -= this.getResourceAmount(index);
			} else if (this.getResourceAmount(index) > 0) {
				this.subtractResourceAmount(index, 1);
				return index;
			}
	        index ++;
	    }
	}

	robbered(cards) {
		for (var i in cards) {
			this.subtractResourceAmount(cards[i], 1);
		}
	}

	canBuyDevelopmentCard() {
	 	if (this.getResourceAmount(2) > 0 && this.getResourceAmount(3) > 0 && this.getResourceAmount(4) > 0) {
	 		return true;
	 	}
	 	return false;
	}

	buyDevelopmentCard() {
		this.subtractResourceAmount(2, 1);
	 	this.subtractResourceAmount(3, 1);
	 	this.subtractResourceAmount(4, 1);
	}

	canBuyRoad() {
		if (this.getResourceAmount(0) > 0 && this.getResourceAmount(1) > 0) {
			return true;
		}
		return false;
	}

	buyRoad() {
		this.subtractResourceAmount(0, 1);
		this.subtractResourceAmount(1, 1);
	}

	canBuySettlement() {
		if (this.getResourceAmount(0) > 0 && this.getResourceAmount(1) > 0 && this.getResourceAmount(2) > 0 && this.getResourceAmount(3) > 0) {
	 		return true;
		}
		return false;
	}

	buySettlement() {
		this.subtractResourceAmount(0, 1);
	 	this.subtractResourceAmount(1, 1);
	 	this.subtractResourceAmount(2, 1);
	 	this.subtractResourceAmount(3, 1);
	}

	canBuyCity() {
		if (this.getResourceAmount(3) >= 2 && this.getResourceAmount(4) >= 3) {
			return true;
		}
		return false;
	}

	buyCity() {
		this.subtractResourceAmount(3, 2);
	 	this.subtractResourceAmount(4, 3);
	}

	hasKnight() {
		return this.getResourceAmount(5) > 0;
	}
}

module.exports.PlayerCards = PlayerCards;
module.exports.order = order;