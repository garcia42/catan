/** The way that I find longest road:
1) Find all endpoints of roads of the same color
2) Do a DPS from each endpoint
3) Repeat until all of the roads of the same color are seen
*/

function Node (vIndex, depth) {
  this.vIndex = vIndex
  this.depth = depth
}

function longestVertexChain (color) {
  var colorRoads = findAllRoadsOfColor(color)
  var maxLongest = 0

  if (numberOfColorRoads < 1) {
    return 0
  }
  while (colorRoads.length > 0) {
    var i
    var j
    var endRoads = colorRoads[0].getEndsOfRoadSameColor(roadsDict, verticesDict)

    for (i in endRoads) {
      longestAndVisited = ssearchIslandFromStart(color, endRoads[i]) // Want this to return visited, to visit other islands
      for (j in longestAndVisited[1]) { // Remove visited from colorRoads
        if (colorRoads.indexOf(longestAndVisited[1][j]) != -1) {
          // Remove item from list
        }
      }
      maxLongest = Math.max(maxLongest, longestAndVisited[0])
    }
  }
}

// Still doesn't entirely work, because you can repeat seeing vertices on the next dps. Look up longest path algorithm in graph.
function searchIslandFromStart (color, start) {
  var visited = [] // Visited roads, to make sure you've touched all of the color roads
  var queue = [] // Queued vertices
  var visitedVertices = [] // To not repeat vertices
  var maxLongest = 0
  var curLongest = 0
  var curNode

  var curVertex = roadsDict[start].getEndVertex(roadsDict, verticesDict)
  queue.push(new Node(curVertex, 0))
  visitedVertices.push(new Node(curVertex, 0))
  visited.push(roadsDict[start])

  while (queue.length < 1) {
    curNode = queue.pop()

    var colorRoadsToVertices = verticesDict[curNode[0]].getVerticesConnectedByColor(color, roadsDict)
    for (i in colorRoadsToVertices) {
      if (visitedVertices.indexOf(colorRoadsToVertices[i]) == -1) { // Not yet seen vertex, can see same road, is ok
        visited.push(i)
        queue.push(new Node(conColorRoads[i]), curNode[1] + 1) // Push neighbor vertex, with +1 depth than current
        visitedVertices.push(new Node(conColorRoads[i]), curNode[1] + 1)
      }
    }
  }
  return [maxLongest, visited]
}
