function createTradeWindow(svgContainer, containerWidth, containerHeight, hexagonColors, cardData) {
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
    })

  var resourceColors = hexagonColors.slice()
  resourceColors.splice(5, 1)
  svgContainer.selectAll('.resource')
    .data(resourceColors).enter()
    .append('rect')
    .attr('class', 'resource')
    .attr('x', function (d, i) {
      return containerWidth / 5 + i * containerWidth / 8
    })
    .attr('y', 0.85 * containerHeight)
    .attr('width', containerWidth / 12)
    .attr('height', containerWidth / 12)
    .style('stroke', 'rgb(0,0,0)')
    .attr('stroke-width', '3px')
    .attr('fill', function (d, i) {
      return d
    })

  svgContainer.selectAll('.resourceText').remove()
  svgContainer.selectAll('.resourceText')
    .data(svgContainer.selectAll('.resource')[0])
    .enter().append('text')
    .attr('class', 'resourceText')
    .text(function (d, i) {
      return cardData == null ? 0 : cardData.cardData[resourceEntries[i]]
    })
    .attr('font-size', (radius).toString() + 'px')
    .attr('fill', 'black')
    .attr('x', function (d, i) {
      return parseInt(d.attributes.x.value) + radius / 2
    })
    .attr('y', function (d, i) {
      return parseInt(d.attributes.y.value) + 1.1 * radius
    })
    .style('pointer-events', 'none')
}