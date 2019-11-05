
function travelTimeGraph(data) {
  console.log(data);

  var margin = {
    top: 40,
    bottom: 30,
    left: 30,
    right: 30
  };
  var width = 821;
  var height = 520;

  var maxTime = d3.max(data, function(d){return d.seconds});
  console.log(maxTime);

  var svg = d3.select('#vis-svg')
    .attr('width', width)
    .attr('height', height);

  // Defining our axes
  var yScale = d3.scaleLinear()
    .domain([0, maxTime])
    .range([height-margin.bottom, margin.top]);

  var xScale = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(data.map(function(d){return d.intersection}))
    .padding(0.05);

  // DRAW the axes
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height-margin.bottom})`)
    .call(d3.axisBottom(xScale));


  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  // DRAW the histogram
  var bar= svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr("x", function(d){return xScale(d.intersection);})
    .attr("y", function(d){return yScale(d.seconds);})
    .attr("width", xScale.bandwidth())
    .attr('fill','steelblue')
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