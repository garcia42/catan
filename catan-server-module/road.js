class Road {
  constructor (xO, yO, xT, yT, id) {
    this.x1 = xO
    this.y1 = yO
    this.x2 = xT
    this.y2 = yT
    this.id = id
    this.endPoints = [] // Vertices at ends of this road
    this.playerIndex = -1
  }

  isEqual (road) { // TODO Change this to see if there is a road between the same two endpoints
    var xL2 = road.getXList()
    var yL2 = road.getYList()
    var xEqual = (this.inDelta(xL2[0], this.x2) || this.inDelta(xL2[1], this.x2)) && (this.inDelta(xL2[0], this.x1) || this.inDelta(xL2[1], this.x1))
    var yEqual = (this.inDelta(yL2[0], this.y2) || this.inDelta(yL2[0], this.y2)) && (this.inDelta(yL2[0], this.y1) || this.inDelta(yL2[1], this.y1))
    return xEqual && yEqual
  }

  getPlayerIndex () {
    return this.playerIndex
  }

  setPlayerIndex (playerIndex) {
    this.playerIndex = playerIndex
  }

  inDelta (x, y) {
    return Math.abs(x - y) <= 1
  }

  getXList () {
    return [this.x1, this.x2]
  }

  getYList () {
    return [this.y1, this.y2]
  }

  setLine (line) {
    this.line = line
  }

  addEndpoint (vertex) {
    this.endPoints.push(vertex)
  }

  getEndpoints () {
    return this.endPoints
  }

  getLine () {
    return this.line
  }

  getNeighbors (verticesDict) {
    var neighbors = []
    for (var i in this.getEndpoints()) {
      var vIndex = this.getEndpoints()[i]
      var neighborRoadsDict = verticesDict[vIndex].getRoads()
      for (var key in neighborRoadsDict) {
        if (key !== this.getId()) { // Dont add neighbor Ids that match your own id
          neighbors.push(key)
        }
      }
    }
    return neighbors
  }

  getNeighborsOfSameColor (roadsD, verticesDict) {
    var sameColorNeighbors = []
    for (var neighbor in this.getNeighbors(verticesDict)) {
      if (this.getPlayerIndex() === roadsD[this.getNeighbors(verticesDict)[neighbor]].getPlayerIndex()) {
        sameColorNeighbors.push(this.getNeighbors(verticesDict)[neighbor])
      }
    }
    return sameColorNeighbors
  }

  isInList (roadList) {
    var i
    for (i = 0; i < roadList.length; i++) {
      if (this.isEqual(roadList[i])) {
        return true
      }
    }
    return false
  }

  getId () {
    return this.id
  }

  setId (id) {
    this.id = id
  }
}

module.exports = Road
