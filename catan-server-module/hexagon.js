class Hexagon {

    constructor(index, resource, number, center) {
        this.index = index;
        this.resourceIndex = resource;
        this.diceNumber = -1;
        this.vertices = [];
        this.center = center;
        this.diceNumber = number;
        this.neighbors = [];
    }

    getCircle() {
        return this.circle;
    }

    setCircle(circle) {
        this.circle = circle
    }

    getIndex() {
        return this.index;
    }

    getDiceNumber() {
        return this.diceNumber;
    }

    setDiceNumber(kunalAndJesus) {
        this.diceNumber = kunalAndJesus;
    }

    getResource() {
        return this.resourceIndex;
    }

    addVertex(vertex) {
        this.vertices.push(vertex);
    }

    getVertices() {
        return this.vertices;
    }

    setCenter(points) {
        this.center = points;
    }

    getCenter() {
        return this.center;
    }

    getNeighbors() {
        return this.neighbors;
    }

    addNeighbor(neighborHexagonIndex) {
        if (this.neighbors.indexOf(neighborHexagonIndex) == -1 && neighborHexagonIndex != this.getIndex()) {
            this.neighbors.push(neighborHexagonIndex);
        }
    }

    isRed() {
        return this.getDiceNumber() == 6 || this.getDiceNumber() == 8;
    }
};

module.exports = Hexagon;