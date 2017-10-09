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

	hasMoreThanSeven() {
		var resources = [0,1,2,3,4];
		var count = 0;
		resources.forEach(function(resource) {
			count += this.getResourceAmount(resource);
		});
		return count > 7;
	}

	canBuyDevelopmentCard() {
		return this.getResourceAmount(2) > 0 && this.getResourceAmount(3) > 0 && this.getResourceAmount(4) > 0;
	}

	canBuyRoad() {
		return this.getResourceAmount(0) > 0 && this.getResourceAmount(1) > 0;
	}

	canBuySettlement() {
		return this.getResourceAmount(0) > 0 && this.getResourceAmount(1) > 0 && this.getResourceAmount(2) > 0 && this.getResourceAmount(3) > 0;
	}

	canBuyCity() {
		return this.getResourceAmount(3) >= 2 && this.getResourceAmount(4) >= 3;
	}
}

module.exports.PlayerCards = PlayerCards;
module.exports.order = order;