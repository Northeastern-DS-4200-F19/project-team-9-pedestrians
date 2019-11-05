/**
 * Returns a color based on the route input
 */
function colorMap(route) {
  switch(route) {
    case "Tremont":
      return "#6B4D40";
    case "Jaywalk":
      return "#9B2990";
    case "Crosswalk":
      return "#7165BC";
    case "Flashing Signal":
      return "#569CDD";
    case "PHB":
      return "#8FF7F5";
  }
}
/**
 * Draws our Walking Travel Time Visualization
 * @param data - the data read from avg_travel_times.csv
 */
function travelTimeGraph(data) {
  console.log(data);

  var margin = {
    top: 40,
    bottom: 30,
    left: 30,
    right: 30
  };
  var width = 900;
  var height = 520;

  var maxTime = d3.max(data, function(d){return d.seconds});
  console.log(maxTime);

  var svg = d3.select('#vis-svg')
    .attr('width', width)
    .attr('height', height);

  let travelWidth = width/2;
  let travelHeight = height/2;

  var travelTimeChart = svg.append('g')
    .attr('width', travelWidth)
    .attr('height', travelHeight);

  // Defining our axes
  var yScale = d3.scaleLinear()
    .domain([0, maxTime])
    .range([height-margin.bottom, height-travelHeight+margin.top]);

  var xScale = d3.scaleBand()
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
  var bar= svg.selectAll('rect')
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

}

// reads the csv file with walking travel time, waits for it to finish,
// and then calls a method to draw the bar graph
d3.csv('data/avg_travel_times.csv', function(d) {
  // formats our data objects
  return {
    intersection: d.Route,
    seconds: +d.Average_Travel_Time
  }
}).then(travelTimeGraph);