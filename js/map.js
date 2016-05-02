Dateformat = d3.time.format("%Y-%m-%d");
axisformat = d3.time.format("%b")
sliderformat = d3.time.format("%b %y")

// SVG drawing area

// MAP SVG
var margin = {top: 60, right: 60, bottom: 60, left: 40};

var width = 750 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var scale0 = (1.5*width);

var centered,
    interval,
    currentFrame = 2010,
    isPlaying = false;

// Geo Projection
var projection = d3.geo.albersUsa()
    .scale(800)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#chart-area").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
     .append("g")
         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var zoom = svg.append("g");

var zooming = d3.behavior.zoom()
    .translate([width / 2, height / 2])
    .scale(scale0)
    .scaleExtent([scale0, 8 * scale0])
    .on("zoom", zoomed);

svg.append("rect")
    .attr("class", "background")
    .attr("fill", "none")
    .attr("width", width)
    .attr("height", height);
    // .on("click", clicked);

svg.call(zooming)
    .call(zooming.event);

// Map Legend
createLegend();



// Bar Chart SVG
var barmargin = {top: 10, right: 10, bottom: 30, left: 32};

var barwidth = 400 - barmargin.left - barmargin.right,
    barheight = 300 - barmargin.top - barmargin.bottom;

var barsvg = d3.select("#bar-chart-area").append("svg")
        .attr("width", barwidth + barmargin.left + barmargin.right)
        .attr("height", barheight + barmargin.top + barmargin.bottom)
     .append("g")
         .attr("transform", "translate(" + barmargin.left + "," + barmargin.top + ")");

var barx = d3.scale.ordinal().rangeRoundBands([0,barwidth],0.1);

var bary = d3.scale.linear().range([barheight,0]);

var barxAxis = d3.svg.axis().scale(barx).orient("bottom");

var baryAxis = d3.svg.axis().scale(bary).orient("left").ticks(10);

barsvg.append("g").attr("class", "axis x-axis").attr("transform", "translate(0," + barheight +")");

barsvg.append("g").attr("class","axis y-axis")

var checked;


// Load data parallel
queue()
    .defer(d3.json, "data/us-states.json")
    .defer(d3.csv, "data/final.csv")
    .defer(d3.csv, "data/mapStateInfo.csv")
    .await(loadMapData)

function loadMapData(error, data1, data2, data3) {

    // Convert TopoJSON to GeoJSON (target object = 'countries')
    usa = topojson.feature(data1, data1.objects.states).features

    // Render the U.S. by using the path generator
    zoom.append("g")
            .attr("id", "states")
        .selectAll("path")
            .data(usa)
        .enter().append("path")
            .attr("d", path)
            .attr("fill", "#E8E8E8")
        .on("mouseover", function(d, i){
            var currentState = this;
            d3.select(this).style("fill-opacity", 0.5);
            d3.select("#bar-chart-area")
                .selectAll(".bar")
                .style("fill", function(b){
                    if (b.id == d.id){
                        document.getElementById("barTitle").innerHTML = b.fullName;
                        return "#C80815";}
                    else return "#86CEFA";
                });
        })
        .on("mouseout", function(d, i){
            document.getElementById("barTitle").innerHTML = "State";
            d3.selectAll("path")
                .style({"fill-opacity": 1});
            d3.select("#bar-chart-area")
                .selectAll(".bar")
                .style("fill", "#86CEFA");
        })
        .on("click", function(d,i){
            var currentState = this;
            clicked(d, currentState);
        });

    // Make data global variable
    crashData = data2;
    stateData = data3;

    // Coverting strings into numbers
    crashData.forEach(function(d){
        d.LAT = +d.LAT;
        d.LONG = +d.LONG;
        d.FATALS = +d.FATALS
        d.ROUTE = +d.ROUTE
        d.DATE = Dateformat.parse(d.YEAR+"-"+d.MONTH+"-"+d.DAY)
        d.YEAR = +d.YEAR
        d.MONTH = +d.MONTH
        d.DAY = +d.DAY
    });

    // Initial display of data (for first position in slider)
    newData = crashData.filter( function(d) {
      return (d.YEAR==2010);
    })

    // Create Time Slider
    createSlider();

    d3.select("#play")
      .attr("title","Play animation")
      .on("click",function(){
        if ( !isPlaying ){
          isPlaying = true;
          d3.select(this).classed("pause",true).attr("title","Pause animation");
          animate();
        } else {
          isPlaying = false;
          d3.select(this).classed("pause",false).attr("title","Play animation");
          clearInterval( interval );
        }
      });

    // Bar Data parse
    stateData.forEach(function(d){
        d.id = +d.id;
        d.deaths = +d.deaths;
        d.deaths100k = +d.deaths100k;
        d.deaths100kAvg = +d.deaths100kAvg;
        d.deaths100Mmi = +d.deaths100Mmi;
        d.deaths10MmiAvg = +d.deaths10MmiAvg;
        d.ruralSpeed = +d.ruralSpeed;
        d.minSuspension = +d.minSuspension;
        d.deaths = +d.deaths;
    })

    // Draw the visualization for the first time
    updateMap(newData);

    // Draw the bars for the first time
    drawBars(stateData);
};

// Render visualization
function updateMap(crashData) {

    d3.select("#showYear #currentYear").html("Number of Crashes in " + currentFrame + ":");

    d3.select("#showYear #tNumber").html(crashData.length);

    // Get checkbox values
    var checkboxes = document.getElementsByName('route');

    var time1 = new Date().getTime();

    // For storing checkbox value
    var selectRoutes = [];

    // Get checkbox values
    for (var i=0, n=checkboxes.length; i<n;i++) {
      if (checkboxes[i].checked) 
        selectRoutes.push(+checkboxes[i].value);
    }


    // Filter data according to checked boxes
    var filtered = crashData.filter(function(d){
        if (selectRoutes.includes(d.ROUTE))
            return d;
    });

    // circles data join
    circles = zoom.selectAll(".circle")
        .data(filtered);

    // circles enter
    circles
        .enter()
        .append("circle")
        .attr("class", "circle bubble");

    // circles update
    circles
        .attr("fill", function(d) {
            fill_colors = ["#c80815", "#4876af", "#f0f0f0","#f0f0f0", "#f0f0f0"];
            return fill_colors[d.ROUTE-1];
        })
        .attr("cx", function(d) {
            return (projection([d.LONG,d.LAT]) ? projection([d.LONG,d.LAT]) : [-500,0])[0];
        })
        .attr("cy", function(d) {
            return (projection([d.LONG,d.LAT]) ? projection([d.LONG,d.LAT]) : [-500,0])[1];
        })
        // .attr("r", 0)
        // .transition().duration(800)
        .attr("r", function(d) {return 1.5*d.FATALS});


    // State list for d3 tooltip
    var stateList = ["N/A","Alabama","Alaska","N/A","Arizona", "Arkansas", "California","N/A", "Colorado", "Connecticut", "Delaware", "D.C", "Florida", "Georgia", "N/A", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Virgin Islands", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

    // d3. tooltip
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<span style='color: #86CEFA'>" + stateList[d.STATE] + "</span>" + "<br>" + "<strong> <span style='color:#D6D6D6'> Date: " + "</span>" + Dateformat(d.DATE) + "</strong> <br> <strong> <span style='color:#D6D6D6'> Number of People Killed: " + "</span>"+  d.FATALS + "</strong>" + "</br>";
        });

    svg.call(tip);

    circles.on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    // circles exit
    circles
        .exit()
        // .transition()
        // .duration(800)
        // .style("opacity",0)
        .remove();

};

// Legend for SVG Map
function createLegend(){
  var legend = zoom.append("g").attr("id","legend").attr("transform","translate(480,-20)");

  legend.append("circle").attr("fill","#c80815").attr("r",5).attr("cx",-5).attr("cy",10)
  legend.append("circle").attr("fill","#4876af").attr("r",5).attr("cx",-5).attr("cy",30)
  legend.append("circle").attr("fill","#f0f0f0").attr("r",5).attr("cx",-5).attr("cy",50)

  legend.append("text").text("Interstate Highway Crashes").attr("x",5).attr("y",13);
  legend.append("text").text("U.S. Highway Crashes").attr("x",5).attr("y",33);
  legend.append("text").text("Other Highway Crashes").attr("x",5).attr("y",53);

  legend.append("circle").attr("fill","#C80815").attr("r",1.5).attr("cx",150).attr("cy",350);
  legend.append("text").text("1 killed").attr("x",160).attr("y",353);

  legend.append("circle").attr("fill","#C80815").attr("r",(5*1.5)).attr("cx",147).attr("cy",327);
  legend.append("text").text("5 killed").attr("x",160).attr("y",330);

  legend.append("circle").attr("fill","#C80815").attr("r",15).attr("cx",140).attr("cy",300);
  legend.append("text").text("10 killed").attr("x",160).attr("y",303);
}

// Slider Autoplay option
function animate(){
    interval = setInterval( function(){
    currentFrame++;

    if ( currentFrame == 2015 ) currentFrame = 2010;

    d3.select("#slider-div .d3-slider-handle")
      .style("left", 100*((currentFrame - 2010)/5) + "%" );
    slider.value(currentFrame)

    newData = crashData.filter( function(d) {
      return (d.YEAR == currentFrame);
    })

    updateMap(newData);

    if ( currentFrame == 2014){
      isPlaying = false;
      currentFrame == 2010;
      d3.select("#play").classed("pause",false).attr("title","Play animation");
      clearInterval( interval );
      return;
    }
  },1000);
}


// Slider Function
function createSlider() {

    // Slider function (d3.slider.js)
    slider = d3.slider()
      .axis(d3.svg.axis().ticks(5).tickFormat(d3.format("d")))
      .min(2010)
      .max(2014)
      .step(1)
      .on("slide", function(evt, value) {
        newData = crashData.filter( function(d) {
          return (d.YEAR == value);
        })
        updateMap(newData);
      })

    d3.select('#map-slider').call(slider);
}


// Click zoom function for map
function clicked(d, currentState) {

  if (d3.event.defaultPrevented) return;

  var x, y, k;

  if (d && centered !== d) {
    d3.select("#chart-area").selectAll("path").style("fill", "#E8E8E8");
    d3.select(currentState).style("fill", "#86CEFA");
    selID = d3.select(currentState)[0][0]["__data__"]["id"];
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    d3.select('#chart-area').selectAll("path").style("fill", "#E8E8E8");
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  zoom.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  zoom.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");

}

// Pan & zoom function for map (panning, draggin, & zooming)
function zoomed() {
    projection
      .translate(zooming.translate())
      .scale(zooming.scale());

    // zoom.selectAll(".circle")
    //   .attr("d", path);

    zoom.selectAll("path")
      .attr("d", path);

    zoom.selectAll(".circle")
    .attr("cx", function(d) {
        return (projection([d.LONG,d.LAT]) ? projection([d.LONG,d.LAT]) : [-500,0])[0];
    })
    .attr("cy", function(d) {
        return (projection([d.LONG,d.LAT]) ? projection([d.LONG,d.LAT]) : [-500,0])[1];
    });

}

// Draw barchart
function drawBars(data){

    // Check for dropdown box selection
    var selection = d3.select("#bar-type").property("value");

    // Check if the sorted box is checked
    var check = document.getElementsByName('sortBox');
    checked = check[0]["checked"];

    if (checked == true){
        valSorted = data.sort(function(a, b) { return b[selection] - a[selection]; });
    }
    else {
        valSorted = data.sort(function(a,b) {return d3.ascending(a.state, b.state);});
    };

    barx.domain(data.map(function(d){return d.state;}));
    bary.domain([0, d3.max(data, function(d){return d[selection];})]);

    var statebars = barsvg.selectAll(".bar")
        .data(valSorted)

    statebars.enter()
        .append("rect")
        .attr("class","bar")

    // Update
    statebars
        .transition()
        .duration(1000)
        .attr("x", function(d) { return barx(d.state); })
        .attr("y", function(d) { return bary(d[selection]); })
        .attr("width", barx.rangeBand())
        .attr("height", function(d) { return barheight - bary(d[selection]); })
        .attr("fill", "#86CEFA");

    statebars
        .on("mouseover", function(d, i){
            d3.select(this).style("fill","#C80815");
            document.getElementById("barTitle").innerHTML = d.fullName;
            d3.select("#chart-area")
                .selectAll("path")
                .style("fill", function(b){
                    if (b.id == d.id) {return "#86CEFA";}
                    else {return "#E8E8E8"};
                });
        })
        .on("mouseout", function(d, i){
            document.getElementById("barTitle").innerHTML = "State";
            d3.select("#chart-area").selectAll("path").style("fill","#E8E8E8")
            d3.select("#bar-chart-area").selectAll(".bar").style("fill", "#86CEFA");
        });

    // Exit
    statebars.exit().remove();

    // Update x & y axis
    barsvg
        .select(".x-axis")
        .transition()
        .duration(1000)
        .call(barxAxis)

    barsvg
        .select(".x-axis").selectAll("text")
            .style("text-anchor", "end")
            .style("font-size", "7px")
            .attr("dx","-1em")
            .attr("dy","-1em")
            .attr("transform","rotate(-90)");

    barsvg
        .select(".y-axis")
        .transition()
        .duration(1000)
        .call(baryAxis);
}