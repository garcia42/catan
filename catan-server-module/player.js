class Player {

	constructor(uuid, index, nickName, room, cards) {
		this.index = index;
		this.name = nickName;
		this.room = room;
		this.victoryPoints = 0;
		this.cards = cards;
		this.knightsUsed = 0;
		this.longestRoad = 0;
		this.roadsUsed = 0;
		this.housesUsed = 0;
		this.citiesUsed = 0;
		this.uuid = uuid;
	}

	getUuid() {
		return this.uuid;
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

	getRoadsUsed() {
		return this.roadsUsed;
	}

	getHousesUsed() {
		return this.housesUsed;
	}

	incrementHousesUsed() {
		this.housesUsed += 1;
	}

	incrementRoadsUsed() {
		this.roadsUsed += 1;
	}

	incrementCitiesUsed() {
		this.housesUsed -= 1;
		this.citiesUsed += 1;
	}

	getCitiesUsed() {
		return this.citiesUsed;
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

	incrementLongestRoad(newLongestRoad, longestRoadsInRoom) {
		this.roadsUsed += 1;
		this.longestRoad = newLongestRoad;
		var isbiggestRoad = this.longestRoad >= 5;
		for (var i in longestRoadsInRoom) {
			if (this.longestRoad <= longestRoadsInRoom[i]) {
				isbiggestRoad = false;
				break;
			}
		}
		return isbiggestRoad;
	}
}

module.exports = Player;