/**
 * Returns a color based on the route input
 */
function colorMap(route) {
  switch(route) {
    case "Tremont":
      return "#AF2BC6";
    case "Jaywalk":
      return "#8A4DCC";
    case "Crosswalk":
      return "#5EB2D1";
    case "Flashing Signal":
      return "#4AE2BA";
    case "PHB":
      return "#30FF97";
  }
}

/**
 * Draws our Walking Travel Time Visualization
 * @param data - the data read from avg_travel_times.csv
 */
function travelTimeGraph(data) {
  console.log(data);

  const margin = {
    top: 40,
    bottom: 30,
    left: 30,
    right: 30
  };
  const width = 900;
  const height = 520;

  let maxTime = d3.max(data, function(d){return d.seconds});
  console.log(maxTime);

  let svg = d3.select('#vis-svg')
    .attr('width', width)
    .attr('height', height)
    .attr('border', 1);
  let borderPath = svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", height)
    .attr("width", width-20)
    .style("stroke", "black")
    .style("fill", "none")
    .style("stroke-width", 1);

  let travelWidth = width/2;
  let travelHeight = height/2;

  let travelTimeChart = svg.append('g')
    .attr('width', travelWidth)
    .attr('height', travelHeight)
    .attr('transform', `translate(0,0)`);

  // Defining our axes
  let yScale = d3.scaleLinear()
    .domain([0, maxTime])
    .range([height-margin.bottom, height-travelHeight+margin.top]);

  let xScale = d3.scaleBand()
    .range([width-travelWidth+margin.left, width-margin.right])
    .domain(data.map(function(d){return d.intersection}))
    .padding(0.05);

  // DRAW the axes
  travelTimeChart.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height-margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .remove();

  travelTimeChart.append('g')
    .attr('class', 'y axis')
    .attr('transform', `translate(${width-travelWidth+margin.left},0)`)
    .call(d3.axisLeft(yScale));

  // DRAW the histogram
  let bar = travelTimeChart.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr("x", function(d){return xScale(d.intersection);})
    .attr("y", function(d){return yScale(d.seconds);})
    .attr("width", xScale.bandwidth())
    .attr('fill',function(d){return colorMap(d.intersection)})
    .attr("height", function(d){
      return height-margin.bottom-yScale(d.seconds);
    });

  // Add a title and axis labels!
  travelTimeChart.append('text')
    .attr('x', width-travelWidth/2)
    .attr('y', height-travelHeight+40)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('text-decoration', 'underline')
    .text('Average Walking Time');
  travelTimeChart.append('text')
    .attr('x', width-travelWidth/2)
    .attr('y', height-10)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text("Route");
  travelTimeChart.append('text')
    .attr('x', width-travelWidth)
    .attr('y', height-travelHeight/2)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .attr('transform', `rotate(-90, ${width-travelWidth}, ${height-travelHeight/2})`)
    .text("Seconds");

}

/** reads the csv file with walking travel time, waits for it to finish,
 * and then calls a method to draw the bar graph
 */
d3.csv('data/avg_travel_times.csv', function(d) {
  // formats our data objects
  return {
    intersection: d.Route,
    seconds: +d.Average_Travel_Time
  }
}).then(travelTimeGraph);