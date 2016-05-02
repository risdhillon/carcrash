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
var cmargin = {top: 50, right: 50, bottom: 50, left: 50};
var cwidth = 500 - cmargin.left - cmargin.right,
    cheight = 400 - cmargin.top - cmargin.bottom;

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

//initialize data
loadData();

//make global variable
var policyData;
var dropdownSelection;

//load CSV file
function loadData() {
	d3.csv("data/datafinal.csv", function (csv) {

		//console.log(csv);

		//store csv data in global variable
		policyData = csv;

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

	});
}

function updateVisualization() {

	//the higher-level law category selection
	dropdownSelection = (d3.select("#policy-ranking-type").node().value);

	//console.log(dropdownSelection);


		mainSelection = (d3.select("#" + dropdownSelection).node().value);

		//console.log(mainSelection);


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


