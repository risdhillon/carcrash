var dmargin = {top: 10, right: 10, bottom: 100, left: 40},
    dmargin2 = {top: 230, right: 10, bottom: 20, left: 40},
    dwidth = 600 - dmargin.left - dmargin.right,
    dheight = 300 - dmargin.top - dmargin.bottom,
    dheight2 = 300 - dmargin2.top - dmargin2.bottom;

var parseDate = d3.time.format("%b %Y").parse;

var x = d3.time.scale().range([0, dwidth]),
    x2 = d3.time.scale().range([0, dwidth]),
    y = d3.scale.linear().range([dheight, 0]),
    y2 = d3.scale.linear().range([dheight2, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom").ticks(5).tickFormat(d3.time.format("%Y")),
    yAxis = d3.svg.axis().scale(y).orient("left");

var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);

var area = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x(d.date); })
    .y0(dheight)
    .y1(function(d) { return y(d.crash); });

var area2 = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x2(d.date); })
    .y0(dheight2)
    .y1(function(d) { return y2(d.crash); });

var svgz = d3.select("#brushmap").append("svg")
    .attr("width", dwidth + dmargin.left + dmargin.right)
    .attr("height", dheight + dmargin.top + dmargin.bottom);

svgz.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", dwidth)
    .attr("height", dheight);

var focus = svgz.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + dmargin.left + "," + dmargin.top + ")");

var context = svgz.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + dmargin2.left + "," + dmargin2.top + ")");

d3.csv("data/sp500.csv", type, function(error, data) {
  x.domain(d3.extent(data.map(function(d) { return d.date; })));
  y.domain([0, d3.max(data.map(function(d) { return d.crash; }))]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  focus.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area);

  focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + dheight + ")")
      .call(xAxis);

  focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area2);

  context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + dheight2 + ")")
      .call(xAxis2);

  context.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", dheight2 + 7);
});

function brushed() {
  x.domain(brush.empty() ? x2.domain() : brush.extent());
  focus.select(".area").attr("d", area);
  focus.select(".x.axis").call(xAxis);
}

function type(d) {
  d.date = parseDate(d.date);
  d.crash = +d.crash;
  return d;
}