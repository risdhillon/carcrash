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
var margin = {top: 40, right: 40, bottom: 40, left: 40};
var cwidth = 500;
var cheight = 400;

var miniWidth = 400 - margin.left - margin.right,
	miniHeight = 300 - margin.top - margin.bottom;

var miniColorScale = d3.scale.threshold()
	.range(["#feedde", "#a63603"]);

var miniScale = (1.5*miniWidth);

// Geo Projection
var miniProjection = d3.geo.albersUsa()
	.scale(500)
	.translate([miniWidth / 2, miniHeight / 2]);

var miniPath = d3.geo.path()
	.projection(miniProjection);

var miniSvg = d3.select("#mini-map").append("svg")
	.attr("width", miniWidth + margin.left + margin.right)
	.attr("height", miniHeight + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


//set up scales
var xPolicy = d3.scale.ordinal()
	.rangeRoundBands([0, cwidth - margin.left],.3);

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
	.attr("width", cwidth + margin.right + margin.left)
	.attr("height", cheight + margin.bottom + margin.top)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top  + ")");


//make global variable
var policyData;
var dropdownSelection;
var statePoliciesData;
var rateById = {};
var nameById = {};
var littleUsa;

queue()
	.defer(d3.json, "data/us-states.json")
	.defer(d3.csv, "data/datafinal.csv")
	.defer(d3.csv, "data/statebystatepolicy.csv")
	.await(loadData);

//load CSV file
function loadData(error, map, csv, statebystate) {
	if (error) throw error;


	statebystate.forEach(function(d){
		d.id = +d.id;
		d.textBan = +d.textBan;
		d.textOkay = +d.textOkay;
		d.handheldBan = +d.handheldBan;
		d.handheldOkay = +d.handheldOkay;
		d.seatbeltAll = +d.seatbeltAll;
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
			.attr("transform", "translate(" + margin.left + ",0)")
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
			.attr("transform", "translate(" + margin.left + "," + cheight + ")")
			.attr("id", "x-policy-axis");

		d3.selectAll("#policy-ranking-type").on("change", updateVisualization);

		d3.selectAll("#selected-law").on("change", updateVisualization);

		updateVisualization();


}

function updateVisualization() {

	//the higher-level law category selection
	dropdownSelection = (d3.select("#policy-ranking-type").node().value);

	console.log(dropdownSelection);




		mainSelection = (d3.select("#" + dropdownSelection).node().value);

		console.log(mainSelection);

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
			.attr("x", function(d){return margin.left + xPolicy(d.category);})
			.attr("y", function (d) {
				return yPolicy(d[mainSelection])
			})
			.attr("width", xPolicy.rangeBand())
			.attr("height", function (d) {
				return cheight - yPolicy(d[mainSelection]);
			});

}


