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
const highlightColor = "#ffe100";

let inputs = d3.selectAll('input')
  .on('click', function(){
    filter(this);
  });

function roundSeconds(s) {
  let min = Math.floor(s / 60);
  let sec = Math.floor(s - (min * 60));
  return "" + min + "min " + sec + "sec";
}

/**
 * Returns a color based on the route input
 */
function colorMap(route) {
  switch(route) {
    case "Tremont":
      return "#5f4690";
    case "Jaywalk":
      return "#24967d";
    case "Crosswalk":
      return "#edad08";
    case "FlashingSignal":
      return "#b04256";
    case "PHB":
      return "#bf6e05";
  }
}

/** * * * * * * * FILTERING FUNCTIONS * ** * * * * * * **/
let selectedRoutes = [];

function filter(d) {
  let route = d.value;
  let i = selectedRoutes.indexOf(route);

  if (i === -1) {
    selectedRoutes.push(route);
  } else {
    selectedRoutes.splice(i, 1);
  }
  d3.select('#walking-times').remove();
  d3.select('#paths').remove();
  d3.select('#cost-svg').remove();
  travelTimeGraph();
  routeMap();
  violin();
}


/** * * * * * * * * MOUSE EVENTS * * * * * * * * * */
function handleMouseOver(d) {
  d3.selectAll('.'+d.intersection).each(function() {
    if (this.tagName.toLowerCase() === 'rect') {
      d3.select(this).attr('fill', highlightColor);
    } else if (this.tagName.toLowerCase() === 'path') {
      if (this.id === 'violin') {
        d3.select(this).style('fill', highlightColor);
      } else {
        d3.select(this).attr('stroke', highlightColor);
      }

    } else {
      d3.select('#'+d.intersection).attr('fill', highlightColor);
    }
  })
}

function handleMouseOut(d) {
  d3.selectAll('.'+d.intersection).each(function() {
    if (this.tagName.toLowerCase() === 'rect') {
      d3.select(this).attr('fill', colorMap(d.intersection));
    } else if (this.tagName.toLowerCase() === 'path') {
      if (this.id === 'violin') {
        d3.select(this).style('fill', colorMap(d.intersection));
      } else {
        d3.select(this).attr('stroke', colorMap(d.intersection));
      }
    } else {
      d3.select('#'+d.intersection).attr('fill', colorMap(d.intersection));
    }
  });
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


/** * * * * * * RENDERING FUNCTIONS * * * * * * * * */

/**
 * Draws our Walking Travel Time Visualization
 * @param data - the data read from avg_travel_times.csv
 */
function travelTimeGraph() {

  // define local variables relevant to this viz
  let travelWidth = width/2;
  let travelHeight = height/2;


  d3.csv('data/avg_travel_times.csv', function(d) {
    // formats our data objects
    return {
      intersection: d.Route,
      seconds: +d.Average_Travel_Time
    }
  }).then(drawChart);

  function drawChart(data) {
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
      .call(d3.axisBottom(xScale));

    travelTimeChart.append('g')
      .attr('class', 'y axis')
      .attr('transform', `translate(${width-travelWidth+margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // DRAW the histogram
    let bar = travelTimeChart.selectAll('rect')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr("x", function(d){
        if (xScale.bandwidth() > 120) {
          return (xScale(d.intersection) + xScale.bandwidth()/2) - 60
        } else {
          return xScale(d.intersection);
        }
      })
      .attr("y", function(d){return yScale(d.seconds);})
      .attr("width", function() {
        if (xScale.bandwidth() > 120) {
          return 120;
        } else {
          return xScale.bandwidth()
        }
      })
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
          .html('<strong>' + d.intersection + '</strong>' + '</br>' + roundSeconds(time))
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
      .attr('x', width-travelWidth)
      .attr('y', height-travelHeight/2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .attr('transform', `rotate(-90, ${width-travelWidth}, ${height-travelHeight/2})`)
      .text("Seconds");
  }


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
      .attr('stroke-width', 1)
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
      .attr('stroke-width', 3)
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

/**
 * Draw the violin plot to show cost distribution of projects
 */
function violin() {
  // set the dimensions and margins of the graph
  let margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 450 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  let svg = d3v4.select("#costsViz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr('id', 'cost-svg')
    .attr('x', 440)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // Read the data and compute summary statistics for each specie
  d3v4.csv("data/costs.csv", function(data) {

    let filteredData = [];
    let routes = ['Tremont', 'Jaywalk', 'Crosswalk', 'FlashingSignal', 'PHB'];
    let domainList = [];

    if (selectedRoutes.length > 0) {
      data.forEach(function(obj) {
        if (selectedRoutes.indexOf(obj.Countermeasure) >= 0) {
          filteredData.push(obj);
        }
      });
      routes.forEach(function(r) {
        if (selectedRoutes.indexOf(r) >= 0) {
          domainList.push(r);
        }
      });
    } else {
      filteredData = data;
      domainList = routes;
    }
    console.log(filteredData);
    let maxCost = d3.max(filteredData, function(d){return +d.Cost});
    console.log(maxCost);
    // Build and Show the Y scale
    let y = d3v4.scaleLinear()
      .domain([ 0,maxCost ])          // Note that here the Y scale is set manually
      .range([height, 20]);
    svg.append("g").call( d3.axisLeft(y) );

    svg.append('text')
      .text('Project Cost Distribution')
      .attr('x', 120)
      .attr('y', 10)
      .style('font-size', '14px')
      .style('text-decoration', 'underline');








    // Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    let x = d3v4.scaleBand()
      .range([ 0, width ])
      .domain(domainList)
      .padding(0.05);// This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3v4.axisBottom(x));

    // Features of the histogram
    let histogram = d3v4.histogram()
      .domain(y.domain())
      .thresholds(y.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of
      // the violin plot
      .value(d => d);

    // Compute the binning for each group of the dataset
    let sumstat = d3v4.nest()  // nest function allows to group the calculation per level of a factor
      .key(function(d) { return d.Countermeasure;})
      .rollup(function(d) {   // For each key..
        input = d.map(function(g) { return g.Cost;});  // Keep the variable called Sepal_Length
        bins = histogram(input); // And compute the binning on it.
        return(bins)
      })
      .entries(filteredData);

    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    let maxNum = 0;

    for (let i in sumstat ){
      let allBins = sumstat[i].value;
      let lengths = allBins.map(function(a){return a.length;});
      let longest = d3v4.max(lengths);
      if (longest > maxNum) { maxNum = longest }
    }

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    let xNum = d3v4.scaleLinear()
      .range([0, x.bandwidth()])
      .domain([-maxNum,maxNum]);

    let currentInt = "";

    // Add the shape to this svg!
    svg
      .selectAll("myViolin")
      .data(sumstat)
      .enter()        // So now we are working group per group
      .append("g")
      .attr("transform", function(d){currentInt = d.key; return("translate(" + x(d.key) +" ,0)") } ) // Translation on the right to be at the group position
      .attr("intersection", function(d) { return d.key})
      .attr("class", function(d) { return d.key})
      .attr("id", function(d) { return d.key})
      // .style("fill",function(d){return colorMap(d.key)})
      .on('mouseover', function(d){
        handleMouseOver({intersection: d.key});
        //let cost = +parseFloat(d.Cost).toFixed(3);
        tooltip
          .style('display', 'inline-block')
          .html('<strong>' + d.key + '</strong>')// + '</br>' + time + ' sec')
          .style("left", (d3v4.event.pageX) + "px")
          .style("top", (d3v4.event.pageY - 28) + "px");
      })
      .on('mouseout', function(d){
        handleMouseOut({intersection: d.key});
        tooltip.style('display', 'none')
      })
      .on('mousemove', function(d) {
        handleMouseMove(d);
      })
      .append("path")
      .style("fill",function(d){return colorMap(d.key)})
      .attr("class", function(d) {return d.key})
      .attr('id', 'violin')
      .datum(function(d){return(d.value)})     // So now we are working bin per bin
      .style("stroke", "none")
      .attr("d", d3v4.area()
        .x0(function(d){ return(xNum(-d.length)) } )
        .x1(function(d){ return(xNum(d.length)) } )
        .y(function(d){ return(y(d.x0)) } )
        .curve(d3v4.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
      )
  })
}

/**
 * Draw the key box, filter box, add labels and titles where needed
 */
function keyAndFilter() {

  let keyBox = d3.select('#vis-svg')
    .append('g')
    .attr('id', 'key-box');

  let dollarX = 450;
  let dollarY = 130;

  d3.select('#vis-svg')
    .append('text')
    .text('Dollars')
    .style('font-size', '14px')
    .attr('text-anchor', 'middle')
    .attr('x', dollarX)
    .attr('y', dollarY)
    .attr('transform', `rotate(-90, ${dollarX}, ${dollarY})`);

  keyBox
    .append('rect')
    .attr('x', 15)
    .attr('y', 15)
    .attr('height', 120)
    .attr('width', 210)
    .style('stroke', 'black')
    .style('stroke-width', 1)
    .style('fill', 'none');

  keyBox
    .append('text')
    .text('Filter')
    .attr('x', 110)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('text-decoration', 'underline');

  let x = 20;
  let startY = 45;

  let categories = ['Tremont', 'Jaywalk', 'Crosswalk', 'FlashingSignal', 'PHB'];

  categories.forEach(function(c) {
    keyBox.append('rect')
      .attr('class', function() {
        return c;
      })
      .attr('id', c + 'key')
      .attr('x', x)
      .attr('y', startY)
      .attr('height', 10)
      .attr('width', 10)
      .on('click', function() {
        filter({value: c});
        if (d3.select('#'+c+'key').style('fill') === 'rgb(230, 230, 230)') {
          d3.select('#'+c+'key')
            .style('fill', colorMap(c))
            .style('stroke', 'none');

        } else {
          d3.select('#'+c+'key')
            .style('fill', "#e6e6e6")
            .style('stroke', colorMap(c));
        }
      })
      .on('mouseover', function() {
        handleMouseOver({intersection: c})
      })
      .on('mouseout', function(){
        handleMouseOut({intersection: c});
      })
      .style('fill', "#e6e6e6")
      .style('stroke', colorMap(c));

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


/** * * * * * * * EXECUTIVE METHOD CALLS * * * * * * * * * * * * * * */

/**  draw the bar graph
 */
travelTimeGraph();

/**
 * Draw the map of chester square with possible routes overlaid
 */
routeMap();

/**
 * Draw the Filter Box and the viz key
 */
keyAndFilter();

/**
 * Draw the violin plot
 */
violin();


