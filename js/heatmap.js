
var bmargin = { top: 50, right: 0, bottom: 100, left: 30 },
    bwidth = 550 - bmargin.left - bmargin.right,
    bheight = 350 - bmargin.top - bmargin.bottom,
    gridSize = Math.floor(bwidth / 24),
    legendElementWidth = gridSize*2,
    buckets = 12,
    colors = ["#ffffff","#f7f9fb","#ecf1f7","#dae3ef","#b5c8df","#91accf","#5a83b7","#6182ab", "#395e8c","#243b57", "black"], // alternatively colorbrewer.YlGnBu[9]
    days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12a"];
    datasets = ["data/Total_Crash.tsv", "data/Drunk_Driving.tsv"];

var bsvg = d3.select("#heatmap").append("svg")
    .attr("width", bwidth + bmargin.left + bmargin.right)
    .attr("height", bheight + bmargin.top + bmargin.bottom)
    .append("g")
    .attr("transform", "translate(" + bmargin.left + "," + bmargin.top + ")");

var dayLabels = bsvg.selectAll(".dayLabel")
    .data(days)
    .enter().append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", function (d, i) { return i * gridSize; })
      .style("text-anchor", "end")
      .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
      .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

var timeLabels = bsvg.selectAll(".timeLabel")
    .data(times)
    .enter().append("text")
      .text(function(d) { return d; })
      .attr("x", function(d, i) { return i * gridSize; })
      .attr("y", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(" + gridSize / 2 + ", -6)")
      .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

var heatmapChart = function(tsvFile) {
  d3.tsv(tsvFile,
  function(d) {
    return {
      day: +d.day,
      hour: +d.hour,
      value: +d.value
    };
  },
  function(error, data) {
    var colorScale = d3.scale.quantile()
        .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
        .range(colors);

    var cards = bsvg.selectAll(".hour")
        .data(data, function(d) {return d.day+':'+d.hour;});

    cards.append("title");

    var cardtip = d3.tip()
                  .attr('class', 'd3-tip')
                  .style("visibility","visible")
                  .offset([-20, 0])
                  .html(function(d,i) {
                    return "Value:  <span style='color:red'>" + "" + d.value[i] + "";
                  });

    cards.enter().append("rect")
        .attr("x", function(d) { return (d.hour - 1) * gridSize; })
        .attr("y", function(d) { return (d.day - 1) * gridSize; })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "hour bordered")
        .attr("width", gridSize)
        .attr("height", gridSize)
        .style("fill", colors[0]);

    cards.transition().duration(1000)
        .style("fill", function(d) { return colorScale(d.value); });

    cards.select("title").text(function(d) { return d.value; });
    
    cardtip(bsvg.append("g"));

    cards.exit().remove();

    var blegend = bsvg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    blegend.enter().append("g")
        .attr("class", "legend");

    blegend.append("rect")
      .attr("x", function(d, i) { return legendElementWidth * i; })
      .attr("y", bheight)
      .attr("width", legendElementWidth)
      .attr("height", gridSize / 2)
      .style("fill", function(d, i) { return colors[i]; });

    blegend.append("text")
      .attr("class", "mono")
      .text(function(d) { return "≥ " + Math.round(d); })
      .attr("x", function(d, i) { return legendElementWidth * i; })
      .attr("y", bheight + gridSize);

    blegend.exit().remove();

  });  
};

heatmapChart(datasets[0]);


var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
  .data(datasets);


datasetpicker.enter()
  .append("input")
  .attr("value", function(d){return d.substring(5,18)})
  .attr("type", "button")
  .attr("class", "dataset-button")
  .on("click", function(d) {
    heatmapChart(d);
  });
