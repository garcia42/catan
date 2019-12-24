/* eslint-disable no-unused-vars */
/* global d3 */

var give = 'Give'
var current = 'Current'
var receive = 'Receive'

function createTradeWindow (svgContainer, containerWidth, containerHeight, hexagonColors, cardData) {
  svgContainer.selectAll('.tradeWindow').data([0]).enter()
    .append('rect')
    .attr('class', 'tradeWindow')
    .attr('x', containerWidth / 10)
    .attr('y', containerHeight / 10)
    .attr('width', containerWidth * 4 / 5)
    .attr('height', containerHeight * 4 / 5)
    .attr('fill', 'white')
    .attr('style', function () {
      return 'outline: thin solid red;'
    })

  svgContainer.selectAll('.tradeText').data(svgContainer.selectAll('.tradeWindow')[0])
    .enter().append('text')
    .attr('class', 'tradeText')
    .attr('x', function (d, i) { return parseInt(d.attributes.x.value) + parseInt(d.attributes.width.value) * 0.4 })
    .attr('y', function (d, i) { return parseInt(d.attributes.y.value) + parseInt(d.attributes.height.value) / 10 })
    .text(function () {
      return 'Trade Window'
    })
    .attr('font-size', '20px')
    .attr('fill', 'black')
    .style('pointer-events', 'none')

  svgContainer.selectAll('.exitTrade').data(svgContainer.selectAll('.tradeWindow')[0])
    .enter().append('rect')
    .attr('class', 'exitTrade')
    .attr('x', function (d, i) { return parseInt(d.attributes.x.value) + parseInt(d.attributes.width.value) * 0.05 })
    .attr('y', function (d, i) { return parseInt(d.attributes.y.value) + parseInt(d.attributes.height.value) / 20 })
    .attr('width', function (d, i) { return parseInt(d.attributes.width.value) * 0.05 })
    .attr('height', function (d, i) { return parseInt(d.attributes.width.value) * 0.05 })
    .attr('fill', 'red')
    .attr('style', function () {
      return 'outline: thin solid red;'
    })
    .on('click', function (d, i) {
      d3.event.stopPropagation()
      svgContainer.selectAll('.tradeWindow').remove()
      svgContainer.selectAll('.tradeText').remove()
      svgContainer.selectAll('.exitTrade').remove()
      svgContainer.selectAll('.' + receive).remove()
      svgContainer.selectAll('.' + give).remove()
      svgContainer.selectAll('.' + current).remove()
      svgContainer.selectAll('.tradeResourceTextReceive').remove()
      svgContainer.selectAll('.tradeResourceTextGive').remove()
      svgContainer.selectAll('.tradeResourceTextCurrent').remove()
    })

  createTradeBoxes(svgContainer, hexagonColors, receive, 0.25, cardData)
  createTradeBoxes(svgContainer, hexagonColors, current, 0.5, cardData)
  createTradeBoxes(svgContainer, hexagonColors, give, 0.75, cardData)
}

function createTradeBoxes (svgContainer, hexagonColors, tradeActionString, yPositionModifier, cardData) {
  var tW = svgContainer.selectAll('.tradeWindow')[0][0]
  var tradeWindowX = parseInt(tW.attributes.x.value)
  var tradeWindowY = parseInt(tW.attributes.y.value)
  var tradeWindowW = parseInt(tW.attributes.width.value)
  var tradeWindowH = parseInt(tW.attributes.height.value)

  svgContainer.selectAll('.' + tradeActionString + 'Title').data([0]).enter().append('text')
    .attr('class', tradeActionString + 'Title')
    .attr('font-size', '30px')
    .attr('fill', 'black')
    .attr('x', tradeWindowX + tradeWindowW / 32)
    .attr('y', tradeWindowY + (yPositionModifier + 0.1) * tradeWindowH)
    .style('pointer-events', 'none')
    .text(tradeActionString)

  var resourceColors = hexagonColors.slice()
  resourceColors.splice(5, 1)
  svgContainer.selectAll('.' + tradeActionString)
    .data(resourceColors).enter()
    .append('rect')
    .attr('class', tradeActionString)
    .attr('x', function (d, i) {
      return tradeWindowX + tradeWindowW / 5 + i * tradeWindowW / 8
    })
    .attr('y', tradeWindowY + (yPositionModifier) * tradeWindowH)
    .attr('width', tradeWindowW / 12)
    .attr('height', tradeWindowW / 12)
    .style('stroke', 'rgb(0,0,0)')
    .attr('stroke-width', '3px')
    .attr('fill', function (d, i) {
      return d
    })
    .on('click', function (d, i) {
      clickTradeBox(d, i, tradeActionString, resources)
    })

  var resources = ['wood', 'brick', 'sheep', 'wheat', 'ore']
  var searchClass = '.' + tradeActionString
  var boxes = svgContainer.selectAll(searchClass)[0]
  svgContainer.selectAll('.tradeResourceText' + tradeActionString)
    .data(boxes)
    .enter().append('text')
    .attr('class', 'tradeResourceText' + tradeActionString)
    .attr('id', function (d, i) {
      return tradeActionString + resources[i]
    })
    .text(function (d, i) {
      if (tradeActionString === current && cardData != null) {
        return cardData.cardData[resources[i]]
      } else {
        return 0
      }
    })
    .attr('font-size', '30px')
    .attr('fill', 'black')
    .attr('x', function (d, i) {
      return parseInt(d.attributes.x.value) + parseInt(d.attributes.width.value) / 3
    })
    .attr('y', function (d, i) {
      return parseInt(d.attributes.y.value) + 1.2 * parseInt(d.attributes.width.value) / 2
    })
    .style('pointer-events', 'none')
}

function clickTradeBox (d, i, tradeActionString, resources) {
  var giveID = give + resources[i]
  var currentID = current + resources[i]
  var receiveID = receive + resources[i]

  var resGiveHTML = window.svgContainer.selectAll('#' + giveID)[0][0].innerHTML
  var resCurrentHTML = window.svgContainer.selectAll('#' + currentID)[0][0].innerHTML
  var resReceiveHTML = window.svgContainer.selectAll('#' + receiveID)[0][0].innerHTML

  var resourceGiveAmount = parseInt(resGiveHTML)
  var resourceCurrentAmount = parseInt(resCurrentHTML)
  var resourceReceiveAmount = parseInt(resReceiveHTML)

  if (tradeActionString === current) { // Remove all points from other boxes
    console.log(tradeActionString)
    resourceCurrentAmount += resourceGiveAmount
    resourceCurrentAmount -= resourceReceiveAmount
    resourceGiveAmount = 0
    resourceReceiveAmount = 0
  } else if (tradeActionString === give) { // If middle has more then reduce 1 and give 1 here.
    console.log(tradeActionString)
    if (resourceCurrentAmount > 0) {
      resourceCurrentAmount -= 1
      resourceGiveAmount += 1
    }
  } else { // Receive: Can always request 1 more of this
    console.log(tradeActionString)
    resourceCurrentAmount += 1
    resourceReceiveAmount += 1
  }

  console.log('give:' + resourceGiveAmount)
  console.log('receive:' + resourceReceiveAmount)
  console.log('current:' + resourceCurrentAmount)
  window.svgContainer.selectAll('#' + receiveID)[0][0].innerHTML = resourceReceiveAmount
  window.svgContainer.selectAll('#' + giveID)[0][0].innerHTML = resourceGiveAmount
  window.svgContainer.selectAll('#' + currentID)[0][0].innerHTML = resourceCurrentAmount
}
