/** * * * * * * CONSTANTS * * * * */
const width = 900;
const height = 520;
const margin = {
  top: 40,
  bottom: 30,
  left: 30,
  right: 30
};
const tooltip = d3.select('body').append('div')
  .attr('class', 'tooltip')
  .style('display', 'none');

let selectedRoutes = [];

function filter(d, data) {
  let route = d.value;
  let i = selectedRoutes.indexOf(route);

  if (i === -1) {
    selectedRoutes.push(route);
  } else {
    selectedRoutes.splice(i, 1);
  }
  d3.select('#walking-times').remove();
  travelTimeGraph(data)

}




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
    case "FlashingSignal":
      return "#4AE2BA";
    case "PHB":
      return "#30FF97";
  }
}

function handleMouseOver(d) {
  console.log(d);
  d3.selectAll('.'+d.intersection).each(function() {
    if (this.tagName.toLowerCase() === 'rect') {
      d3.select(this).attr('fill', 'yellow');
    } else if (this.tagName.toLowerCase() === 'path') {
      d3.select(this).attr('stroke', 'yellow');
    }
  })


}

function handleMouseOut(d) {
  d3.selectAll('.'+d.intersection).each(function() {
    if (this.tagName.toLowerCase() === 'rect') {
      d3.select(this).attr('fill', colorMap(d.intersection));
    } else if (this.tagName.toLowerCase() === 'path') {
      d3.select(this).attr('stroke', colorMap(d.intersection));
    }
  })
}

function handleMouseMove() {
  tooltip
    .style("left", (d3.event.pageX - 34) + "px")
    .style("top", (d3.event.pageY - 12) + "px");
}

/**
 * Draws our Walking Travel Time Visualization
 * @param data - the data read from avg_travel_times.csv
 */
function travelTimeGraph(data) {

  // define local variables relevant to this viz
  let travelWidth = width/2;
  let travelHeight = height/2;
  let inputs = d3.selectAll('input')
    .on('click', function(){
      filter(this, data);
    });

  let filteredData = [];

  if (selectedRoutes.length > 0) {
    data.forEach(function(d){
      if (selectedRoutes.indexOf(d.intersection) >= 0) {
        filteredData.push(d);
      }
    })
  } else {
    filteredData = data;
  }

  console.log(filteredData);
  let maxTime = d3.max(filteredData, function(d){return d.seconds});



  // get the parent SVG
  let svg = d3.select('#vis-svg')
    .attr('width', width)
    .attr('height', height)
    .attr('border', 1);


  // TEMPORARY BORDER FOR VISUAL GUIDE
  let borderPath = svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", height)
    .attr("width", width-20)
    .style("stroke", "black")
    .style("fill", "none")
    .style("stroke-width", 1);


  // create a local grouping that will contain this entire viz
  let travelTimeChart = svg.append('g')
    .attr('width', travelWidth)
    .attr('height', travelHeight)
    .attr('transform', `translate(0,0)`)
    .attr('id', 'walking-times');



  // Defining our axes
  let yScale = d3.scaleLinear()
    .domain([0, maxTime])
    .range([height-margin.bottom, height-travelHeight+margin.top]);

  let xScale = d3.scaleBand()
    .range([width-travelWidth+margin.left, width-margin.right])
    .domain(filteredData.map(function(d){return d.intersection}))
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
    .data(filteredData)
    .enter()
    .append('rect')
    .attr("x", function(d){return xScale(d.intersection);})
    .attr("y", function(d){return yScale(d.seconds);})
    .attr("width", xScale.bandwidth())
    .attr('fill',function(d){return colorMap(d.intersection)})
    .attr("height", function(d){
      return height-margin.bottom-yScale(d.seconds);
    })
    .attr('class', function(d){return d.intersection})
    .on('mouseover', function(d){
      handleMouseOver(d);
      let time = +parseFloat(d.seconds).toFixed(3);

      tooltip
        .style('display', 'inline-block')
        .html('<strong>' + d.intersection + '</strong>' + '</br>' + time + ' sec')
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on('mouseout', function(d){
      handleMouseOut(d);
      tooltip.style('display', 'none')
    })
    .on('mousemove', function(d) {
      handleMouseMove(d);
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

/**
 * Draw a map of chester park given the external SVG
 */
function routeMap() {
  let mapHeight = height/2;
  let mapWidth = width/2 - 15;

  let lineFunction = d3.line()
    .x(function(d) {return d.x;})
    .y(function(d) {return d.y;});

  d3.select('#map-svg')
    .attr('width', mapWidth)
    .attr('height', mapHeight);

  let map = d3.select('#chester-map')
    .attr('transform', `translate(0,${mapHeight})`);

  let newCrossingData = {
    'one': [{x:mapWidth/2-18, y:mapHeight/2-24}, {x:mapWidth/2+10, y:mapHeight/2-24},
      {x:mapWidth/2+10, y:mapHeight/2-20}, {x:mapWidth/2-18, y:mapHeight/2-20},
      {x:mapWidth/2-18, y:mapHeight/2-24}],
    'two': [{x:mapWidth/2-18, y:mapHeight/2-16}, {x:mapWidth/2+10, y:mapHeight/2-16},
      {x:mapWidth/2+10, y:mapHeight/2-12}, {x:mapWidth/2-18, y:mapHeight/2-12},
      {x:mapWidth/2-18, y:mapHeight/2-16}],
    'three': [{x:mapWidth/2-18, y:mapHeight/2-8}, {x:mapWidth/2+10, y:mapHeight/2-8},
      {x:mapWidth/2+10, y:mapHeight/2-4}, {x:mapWidth/2-18, y:mapHeight/2-4},
      {x:mapWidth/2-18, y:mapHeight/2-8}],
    'four': [{x:mapWidth/2-18, y:mapHeight/2}, {x:mapWidth/2+10, y:mapHeight/2},
      {x:mapWidth/2+10, y:mapHeight/2+4}, {x:mapWidth/2-18, y:mapHeight/2+4},
      {x:mapWidth/2-18, y:mapHeight/2}],
    'five': [{x:mapWidth/2-18, y:mapHeight/2+8}, {x:mapWidth/2+10, y:mapHeight/2+8},
      {x:mapWidth/2+10, y:mapHeight/2+12}, {x:mapWidth/2-18, y:mapHeight/2+12},
      {x:mapWidth/2-18, y:mapHeight/2+8}]
  };

  for (let path in newCrossingData) {
    map.append('path')
      .datum(newCrossingData[path])
      .attr('d', lineFunction)
      .attr('stroke', 'white')
      .attr('stroke-wdith', 1)
      .attr('fill', 'none')
  }

  // define each walking path
  let pathData = {
    'Tremont': [{x:mapWidth/2 - 4, y:mapHeight/2 + 20},{x:mapWidth/2 - 160, y:mapHeight/2+20},
      {x:mapWidth/2-160, y:mapHeight/2-35}, {x:mapWidth/2-4, y:mapHeight/2-35}],
    'Jaywalk': [{x:mapWidth/2-40, y:mapHeight/2+15}, {x:mapWidth/2-40, y:mapHeight/2-30}],
    'Crosswalk': [{x:mapWidth/2-10, y:mapHeight/2+15}, {x:mapWidth/2-10, y:mapHeight/2-30}],
    'FlashingSignal': [{x:mapWidth/2-5, y:mapHeight/2+15}, {x:mapWidth/2-5, y:mapHeight/2-30}],
    'PHB': [{x:mapWidth/2, y:mapHeight/2+15}, {x:mapWidth/2, y:mapHeight/2-30}]
  };

  // draw each walking path
  for (let path in pathData) {
    map.append('path')
      .datum(pathData[path])
      .attr('d', lineFunction)
      .attr('stroke', function(){return colorMap(path)})
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('class', path)
      .on('mouseover', function(){
        handleMouseOver({intersection: path});

        tooltip
          .style('display', 'inline-block')
          .html('<strong>' + path + '</strong>')
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on('mouseout', function(d){
        handleMouseOut({intersection: path});

        tooltip
          .style('display', 'none');
      })
      .on('mousemove', handleMouseMove)
      // .style('stroke-dasharray', ('5, 5, 5, 5, 5, 5, 10, 5, 10, 5, 10, 5'))
  }

  map.append('text')
    .attr('x', mapWidth/2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('text-decoration', 'underline')
    .text('Walking Routes');

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

/**
 * Draw the map of chester square with possible routes overlaid
 */
routeMap();
