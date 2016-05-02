//change the buttons depending on the user's dropdown selection
$(document).ready(function() {
	$('#policy-ranking-type').bind('change', function() {
		var elements = $('div.policy-second-tier').children().hide(); // hide all the elements
		var value = $(this).val();

		if (value.length) { // if somethings' selected
			elements.filter('.' + value).show(); // show the ones we want
		}
	}).trigger('change');
});

//set up bar chart
var cmargin = {top: 10, right: 50, bottom: 50, left: 50};
var cwidth = 500 - cmargin.left - cmargin.right,
    cheight = 400 - cmargin.top - cmargin.bottom;

var minimargin = {top:0, right:100, bottom:0, left:0};
var miniWidth = 400,
	miniHeight = 250;

var miniColorScale = d3.scale.threshold()
	.range(["#feedde", "#a63603"]);

var miniScale = (1.5*miniWidth);

// Geo Projection
var miniProjection = d3.geo.albersUsa()
	.scale(400)
	.translate([(miniWidth/2 - 30), miniHeight / 2]);

var miniPath = d3.geo.path()
	.projection(miniProjection);

var miniSvg = d3.select("#mini-map").append("svg")
	.attr("width", miniWidth + minimargin.left + minimargin.right)
	.attr("height", miniHeight + minimargin.top + minimargin.bottom)
	.append("g");

createMiniLegend();

//set up scales
var xPolicy = d3.scale.ordinal()
	.rangeRoundBands([0, cwidth - cmargin.left],.3);

var yPolicy = d3.scale.linear()
	.range([cheight, 0]);

//set up axes
var xPolicyAxis = d3.svg.axis()
	.scale(xPolicy)
	.orient("bottom");

var yPolicyAxis = d3.svg.axis()
	.scale(yPolicy)
	.orient("left");

//create bar chart
var chart = d3.select("#policy-chart")
	.append("svg")
	.attr("width", cwidth + cmargin.right + cmargin.left)
	.attr("height", cheight + cmargin.bottom + cmargin.top)
	.append("g")
	.attr("transform", "translate(" + cmargin.left + "," + cmargin.top  + ")");


//make global variable
var policyData;
var dropdownSelection;
var statePoliciesData;
var rateById = {};
var nameById = {};
var littleUsa;

queue()
	.defer(d3.json, "data/us-states-2.json")
	.defer(d3.csv, "data/datafinal.csv")
	.defer(d3.csv, "data/statebystatepolicy.csv")
	.await(loadPolicyData);

//load CSV file
function loadPolicyData(error, map, csv, statebystate) {
	if (error) throw error;

	statebystate.forEach(function(d){
		d.id = +d.id;
		d.textBan = +d.textBan;
		d.textOkay = +d.textOkay;
		d.handheldBan = +d.handheldBan;
		d.handheldOkay = +d.handheldOkay;
		d.seatbeltAll = +d.seatbeltAll;
		d.seatbeltFront = +d.seatbeltFront;
		d.seatbeltSecondary = +d.seatbeltSecondary;
		d.seatbeltNo = +d.seatbeltNo;
		d.duiNo = +d.duiNo;
		d.duiUnder100 = +d.duiUnder100;
		d.duiOver100 = +d.duiOver100;
		d.speedUpTo65 = +d.speedUpTo65;
		d.speed70 = +d.speed70;
		d.speed75Plus = +d.speed75Plus;
		d.openContainerBan = +d.openContainerBan;
		d.openContainerOkay = +d.openContainerOkay;
		nameById[+d.id] = d.state;
	});

	//store csv data in global variable
	littleUsa = map;
	policyData = csv;
	statePoliciesData = statebystate;

	chart.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + cmargin.left + ",0)")
		.attr("id", "y-policy-axis")
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", -40)
		.attr("x", -6)
		.attr("dy", ".6em")
		.style("text-anchor", "end")
		.text("Fatalities per 100 million vehicle miles traveled");


	chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + cmargin.left + "," + cheight + ")")
		.attr("id", "x-policy-axis");

	d3.selectAll("#policy-ranking-type").on("change", updateVisualization);

	d3.selectAll("#selected-law").on("change", updateVisualization);

	updateVisualization();

}

function updateVisualization() {

	//the higher-level law category selection
	dropdownSelection = (d3.select("#policy-ranking-type").node().value);


	mainSelection = (d3.select("#" + dropdownSelection).node().value);

	statePoliciesData.forEach(function (d) {
		rateById[+d.id] = d[mainSelection];
	});

	miniColorScale.domain([0,1]);

	//drawing the map and making it updateable
	var appending = miniSvg.selectAll("path")
		.attr("class", "state")
		.data(topojson.feature(littleUsa, littleUsa.objects.states).features);

	appending.enter()
		.append("path");

	appending
		.style("fill", function(d) { if (rateById[d.id] === 1){
			return "#4876AF";
		}
			else {return "#86CEFA"}
		})
		.attr("d", miniPath)
		.style("opacity", 0.9);

	appending.exit().remove();

	//set up domains
	xPolicy.domain(policyData.map(function(d) { return d.category; }));
	yPolicy.domain([.5, 1.5]);

	//Draw axes
	chart.selectAll("#x-policy-axis")
		.transition()
		.duration(800)
		.call(xPolicyAxis);

	chart.selectAll("#y-policy-axis")
		.transition()
		.duration(800)
		.call(yPolicyAxis);


	//make changing bar
	var bars = chart.selectAll("rect")
		.data(policyData);

	bars.enter()
		.append("rect")
		.attr("fill", "#4876af");

	bars
		.transition()
		.duration(800)
		.attr("class", "bars")
		.attr("x", function(d){return cmargin.left + xPolicy(d.category);})
		.attr("y", function (d) {
			return yPolicy(d[mainSelection])
		})
		.attr("width", xPolicy.rangeBand())
		.attr("height", function (d) {
			return cheight - yPolicy(d[mainSelection]);
		});

}

// Legend for MiniMap
function createMiniLegend(){
  var minilegend = miniSvg.append("g").attr("id","minilegend").attr("transform","translate(345,95)");

  minilegend.append("rect").attr("fill","#4876af").attr("width",10).attr("height",10).attr("x",-5).attr("y",0)
  minilegend.append("rect").attr("fill","#86cefa").attr("width",10).attr("height",10).attr("x",-5).attr("y",25)

  minilegend.append("text").text("States with Selected Policy").attr("x",10).attr("y",10);
  minilegend.append("text").text("Other States").attr("x",10).attr("y",35);

}


