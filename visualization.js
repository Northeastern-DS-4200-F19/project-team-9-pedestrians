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


/** FILTERING FUNCTIONS */
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
  d3.select('#paths').remove();
  travelTimeGraph(data);
  routeMap();
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
  if (typeof d == "string") {
    // alert('this');
    holder = d;
    // alert(holder);
    // alert(holder.1);
    d3.selectAll('.'+d).each(function() {
      if (this.tagName.toLowerCase() === 'rect') {
        d3.select(this).attr('fill', 'yellow');
      } else if (this.tagName.toLowerCase() === 'path') {
        d3.select(this).attr('stroke', 'yellow');
      }
      else {
        d3.select(this).attr('fill', 'yellow');
      }
    })
  }
  else {
    d3.selectAll('.'+d.intersection).each(function() {
      if (this.tagName.toLowerCase() === 'rect') {
        d3.select(this).attr('fill', 'yellow');
      } else if (this.tagName.toLowerCase() === 'path') {
        d3.select(this).attr('stroke', 'yellow');
      } else {
        d3.select('#'+d.intersection).attr('fill', 'yellow');
      }
  })
  }



}

function handleMouseOut(d) {
  if (typeof holder == "string") {
    d3.selectAll('.'+holder).each(function() {
      if (this.tagName.toLowerCase() === 'rect') {
        d3.select(this).attr('fill', colorMap(holder));
      } else if (this.tagName.toLowerCase() === 'path') {
        d3.select(this).attr('stroke', colorMap(holder));
      } else {
        d3.select(this).attr('fill', colorMap(holder));
      }
    })
  }


  d3.selectAll('.'+d.intersection).each(function() {
    if (this.tagName.toLowerCase() === 'rect') {
      d3.select(this).attr('fill', colorMap(d.intersection));
    } else if (this.tagName.toLowerCase() === 'path') {
      d3.select(this).attr('stroke', colorMap(d.intersection));
    } else {
      d3.select('#'+d.intersection).attr('fill', colorMap(d.intersection));
    }
  })
  holder = 0
}

function handleMouseMove() {
  
  if (d3v4.event != null) {
    tooltip
      .style("left", (d3v4.event.pageX - 34) + "px")
      .style("top", (d3v4.event.pageY - 12) + "px");
  }
  else {
    tooltip
      .style("left", (d3.event.pageX - 34) + "px")
      .style("top", (d3.event.pageY - 12) + "px");
    }
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
    .attr('y', height-travelHeight+35)
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
    .attr('transform', `translate(0,${mapHeight})`)
    .append('g')
    .attr('id', 'paths');

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

  let filteredPathData = {};

  if (selectedRoutes.length === 0) {
    filteredPathData = pathData;
  } else {
    for (let path in pathData) {
      if (selectedRoutes.indexOf(path) >= 0) {
        filteredPathData[path] = pathData[path];
      }
    }
  }

  // draw each walking path
  for (let path in filteredPathData) {
    map.append('path')
      .datum(filteredPathData[path])
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

function keyAndFilter() {
  let filterBox = d3.select('#vis-svg')
    .append('g')
    .attr('id', 'filter-box');

  filterBox
    .append('rect')
    .attr('x', 15)
    .attr('y', 5)
    .attr('height', 120)
    .attr('width', 210)
    .style('stroke', 'black')
    .style('stroke-width', 1)
    .style('fill', 'none');

  filterBox
    .append('text')
    .text('Filter')
    .attr('x', 110)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-sie', '14px')
    .style('text-decoration', 'underline');

  let keyBox = d3.select('#vis-svg')
    .append('g')
    .attr('id', 'key-box');

  keyBox
    .append('rect')
    .attr('x', 15)
    .attr('y', 135)
    .attr('height', 120)
    .attr('width', 210)
    .style('stroke', 'black')
    .style('stroke-width', 1)
    .style('fill', 'none');

  keyBox
    .append('text')
    .text('Key')
    .attr('x', 110)
    .attr('y', 150)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('text-decoration', 'underline');

  let x = 20;
  let startY = 165;

  let categories = [];

  d3.selectAll('.filterButton').each(function() {
    categories.push(this.value);
  });

  categories.forEach(function(c) {
    keyBox.append('rect')
      .attr('class', function() {
        console.log(c);
        return c;
      })
      .attr('x', x)
      .attr('y', startY)
      .attr('height', 10)
      .attr('width', 10)
      .on('mouseover', function() {
        handleMouseOver({intersection: c})
      })
      .on('mouseout', function(){
        handleMouseOut({intersection: c});
      })
      .style('fill', colorMap(c));

    keyBox.append('text')
      .attr('x', x + 12)
      .attr('y', startY + 8)
      .attr('text-anchor', 'left')
      .on('mouseover', function() {
        handleMouseOver({intersection: c})
      })
      .on('mouseout', function(){
        handleMouseOut({intersection: c});
      })
      .style('font-size', '14px')
      .text(function() {
        switch(c) {
          case 'Tremont': return 'Tremont (Current Legal Route)';
          case 'Jaywalk': return 'Jaywalking';
          case 'Crosswalk': return 'High-Visibility Crosswalk';
          case 'FlashingSignal': return 'Crosswalk with Flashing Signal';
          case 'PHB': return 'Pedestrian Hybrid Beacon';
        }
      });

    startY += 18;
  })

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

/**
 * Draw the Filter Box and the viz key
 */
keyAndFilter();

function violin() {
  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 30, bottom: 30, left: 40},
      width = 450 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3v4.select("#costsViz")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .attr('x', 440)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // Read the data and compute summary statistics for each specie
  d3v4.csv("data/costs.csv", function(data) {

    // Build and Show the Y scale
    var y = d3v4.scaleLinear()
      .domain([ 0,20000 ])          // Note that here the Y scale is set manually
      .range([height, 0])
    svg.append("g").call( d3.axisLeft(y) )

    svg.append('text')
      .text('Cost')
      .attr('x', 160)
      .attr('y', 10)
      .style('font-size', '14px')
      .style('text-decoration', 'underline');

    // Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    var x = d3v4.scaleBand()
      .range([ 0, width ])
      .domain(["FlashingSignal", "PHB", "Crosswalk", "Tremont", "Jaywalk"])
      .padding(0.05)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3v4.axisBottom(x))

    // Features of the histogram
    var histogram = d3v4.histogram()
          .domain(y.domain())
          .thresholds(y.ticks(40))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          .value(d => d)

    // Compute the binning for each group of the dataset
    var sumstat = d3v4.nest()  // nest function allows to group the calculation per level of a factor
      .key(function(d) { return d.Countermeasure;})
      .rollup(function(d) {   // For each key..
        input = d.map(function(g) { return g.Cost;})    // Keep the variable called Sepal_Length
        bins = histogram(input)   // And compute the binning on it.
        return(bins)
      })
      .entries(data)
    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    var maxNum = 0
    for ( i in sumstat ){
      allBins = sumstat[i].value
      lengths = allBins.map(function(a){return a.length;})
      longuest = d3v4.max(lengths)
      if (longuest > maxNum) { maxNum = longuest }
    }

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3v4.scaleLinear()
      .range([0, x.bandwidth()])
      .domain([-maxNum,maxNum])

    let currentInt = ""

    // Add the shape to this svg!
    svg
      .selectAll("myViolin")
      .data(sumstat)
      .enter()        // So now we are working group per group
      .append("g")
        .attr("transform", function(d){ console.log(d.key); currentInt = d.key; return("translate(" + x(d.key) +" ,0)") } ) // Translation on the right to be at the group position
        .attr("intersection", function(d) { return d.key})
        .attr("class", function(d) { return d.key})
        .attr("id", function(d) { return d.key})
        .style("fill",function(d){return colorMap(d.key)})
        .on('mouseover', function(d){
          handleMouseOver(d.key);
          //let cost = +parseFloat(d.Cost).toFixed(3);
          tooltip
            .style('display', 'inline-block')
            .html('<strong>' + d.key + '</strong>')// + '</br>' + time + ' sec')
            .style("left", (d3v4.event.pageX) + "px")
            .style("top", (d3v4.event.pageY - 28) + "px");
        })
        .on('mouseout', function(d){
          handleMouseOut(d);
          tooltip.style('display', 'none')
        })
        .on('mousemove', function(d) {
          handleMouseMove(d);
        })
      .append("path")
          .datum(function(d){return(d.value)})     // So now we are working bin per bin
          .attr("intersection", function(d) {return currentInt})
          .style("stroke", "none")
          //.style("fill",function(d){console.log(d);return colorMap(d.intersection)})
          .attr("d", d3v4.area()
              .x0(function(d){ return(xNum(-d.length)) } )
              .x1(function(d){ return(xNum(d.length)) } )
              .y(function(d){ return(y(d.x0)) } )
              .curve(d3v4.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
          )
  })
}
violin();
