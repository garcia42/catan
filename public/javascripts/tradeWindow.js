/* eslint-disable no-unused-vars */
/* global d3 */

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
      svgContainer.selectAll('.Receive').remove()
      svgContainer.selectAll('.Give').remove()
      svgContainer.selectAll('.Current').remove()
      svgContainer.selectAll('.tradeResourceTextReceive').remove()
      svgContainer.selectAll('.tradeResourceTextGive').remove()
      svgContainer.selectAll('.tradeResourceTextCurrent').remove()
    })

  createTradeBoxes(svgContainer, hexagonColors, 'Receive', 0.25, null)
  createTradeBoxes(svgContainer, hexagonColors, 'Current', 0.5, null)
  createTradeBoxes(svgContainer, hexagonColors, 'Give', 0.75, null)
}

function createTradeBoxes (svgContainer, hexagonColors, tradeActionString, yPositionModifier, cardData) {
  var tW = svgContainer.selectAll('.tradeWindow')[0][0]
  var tradeWindowX = parseInt(tW.attributes.x.value)
  var tradeWindowY = parseInt(tW.attributes.y.value)
  var tradeWindowW = parseInt(tW.attributes.width.value)
  var tradeWindowH = parseInt(tW.attributes.height.value)

  var resourceColors = hexagonColors.slice()
  resourceColors.splice(5, 1)
  svgContainer.selectAll('.' + tradeActionString)
    .data(resourceColors).enter()
    .append('rect')
    .attr('class', tradeActionString)
    .attr('x', function (d, i) {
      return tradeWindowX + tradeWindowW / 5 + i * tradeWindowW / 8
    })
    .attr('y', tradeWindowY + yPositionModifier * tradeWindowH)
    .attr('width', tradeWindowW / 12)
    .attr('height', tradeWindowW / 12)
    .style('stroke', 'rgb(0,0,0)')
    .attr('stroke-width', '3px')
    .attr('fill', function (d, i) {
      return d
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
      return cardData == null ? 0 : cardData.cardData[resources[i]]
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
