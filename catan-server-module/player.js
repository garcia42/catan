class Player {

	constructor(index, nickName, room, cards) {
		this.index = index;
		this.name = nickName;
		this.room = room;
		this.victoryPoints = 0;
		this.cards = cards;
		this.knightsUsed = 0;
		this.longestRoad = 0;
	}

	getPlayerIndex() {
		return this.index;
	}

	getName() {
		return this.name;
	}

	getRoom() {
		return this.room;
	}

	incrementVictoryPoints() {
		this.victoryPoints += 1;
	}

	getVictoryPoints() {
		return this.victoryPoints;
	}

	getCards() {
		return this.cards;
	}

	getUsedKnights() {
		return this.knightsUsed;
	}

	getLongestRoad() {
		return this.longestRoad;
	}

	//Returns true if you have the largestArmy
	incrementKnightsUsed(knightsUsedInRoom) {
		this.knightsUsed += 1;
		var largestArmy = this.knightsUsed >= 3;
		for (var i in knightsUsedInRoom) {
			if (this.knightsUsed <= knightsUsedInRoom[i]) {
				largestArmy = false;
				break;
			}
		}
		console.log('incrementKnightsUsed', largestArmy, this.knightsUsed);
		return largestArmy;
	}
}

module.exports = Player;