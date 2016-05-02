  var legend_awidth = 120;

  var amargin = {top: 20, right: 20, bottom: 30, left: 60},
          awidth = 750 - amargin.left - amargin.right+legend_awidth,
          aheight = 450 - amargin.top - amargin.bottom;

  var x3 = d3.scale.ordinal()
          .rangeRoundBands([0, awidth], .1);

  var yAbsolute = d3.scale.linear() // for absolute scale
          .rangeRound([aheight, 0]);

  var yRelative = d3.scale.linear() // for absolute scale
          .rangeRound([aheight, 0]);

  var color = d3.scale.ordinal()
          .range(["#fcbfc3","#fa868e", "#f9616b", "#f73b48", "#c80815"]);

  var axAxis = d3.svg.axis()
          .scale(x3)
          .orient("bottom");

  var yAxisRelative = d3.svg.axis()
          .scale(yRelative)
          .orient("left")
          .tickFormat(d3.format(".1%"));

  var yAxisAbsolute = d3.svg.axis()
          .scale(yAbsolute)
          .orient("left");


  var asvg = d3.select("#stacked-chart").append("svg")
          .attr("width", awidth + amargin.left + amargin.right+legend_awidth)
          .attr("height", aheight + amargin.top + amargin.bottom)
          .append("g")
          .attr("transform", "translate(" + amargin.left + "," + amargin.top + ")");

  d3.csv("data/drunkdata.csv", function(error, data) {
    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "State"; }));


    data.forEach(function(d) {
      var mystate = d.State;
      var y0 = 0;
      d.ages = color.domain().map(function(name) { return {mystate:mystate, name: name, y0: y0, y1: y0 += +d[name]}; });

      d.total = d.ages[d.ages.length - 1].y1;// the last row
      d.pct = [];

      for (var i=0;i <d.ages.length;i ++ ){

        var y_coordinate = +d.ages[i].y1/d.total;
        var y_height1 = (d.ages[i].y1)/d.total;
        var y_height0 = (d.ages[i].y0)/d.total;
        var y_pct = y_height1 - y_height0;
        d.pct.push({
          y_coordinate: y_coordinate,
          y_height1: y_height1,
          y_height0: y_height0,
          name: d.ages[i].name,
          mystate: d.State,
          y_pct: y_pct

        });


      }


    });



    data.sort(function(a, b) { return b.total - a.total; });


    x3.domain(data.map(function(d) { return d.State; }));
    yAbsolute.domain([0, d3.max(data, function(d) { return d.total; })]);//Absolute View scale
    yRelative.domain([0,1])// Relative View domain

    var absoluteView = false // define a boolean variable, true is absolute view, false is relative view
    // Initial view is absolute

    asvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + aheight + ")")
            .call(axAxis);

    asvg.select(".x").selectAll("text")
        .style("text-anchor", "end")
        .attr("dx","-0.5em")
        .attr("dy","-0.3em")
        .attr("transform","rotate(-90)");


//Define the rect of Relative


    var stateRelative = asvg.selectAll(".relative")
            .data(data)
            .enter().append("g")
            .attr("class", "relative")
            .attr("transform", function(d) {
              return "translate(" + "0 "+ ",0)";

            });



    stateRelative.selectAll("rect")
            .data(function(d) {
              return d.pct;
            })
            .enter().append("rect")
            .attr("width", x3.rangeBand())
            .attr("y", function(d) {
              return yRelative(d.y_coordinate);
            })
            .attr("x",function(d) {return x3(d.mystate)})
            .attr("height", function(d) {
              return yRelative(d.y_height0) - yRelative(d.y_height1); //distance
            })
            .attr("fill", function(d){return color(d.name)})
            .attr("stroke","pink")
            .attr("stroke-width",0.2)
            .attr("id",function(d) {return d.mystate})
            .attr("class","relative")
            .attr("id",function(d) {return d.mystate})
            .style("pointer-events","all");


    stateRelative.selectAll("rect")
            .on("mouseover", function(d){
              if(!absoluteView){
                var xPos = parseFloat(d3.select(this).attr("x"));
                var yPos = parseFloat(d3.select(this).attr("y"));
                var yheight = parseFloat(d3.select(this).attr("height"));

                d3.select(this).attr("stroke","gray").attr("stroke-width",0.8);

                asvg.append("text")
                        .attr("x",xPos)
                        .attr("y",yPos + yheight/2)
                        .attr("class","tooltip")
                        .text(Math.floor(d.y_pct.toFixed(2)*100) + "% fatal crashes of " + d.mystate );
                console.log(yPos + yheight/2)
                console.log(Math.floor(d.y_pct.toFixed(2)*100) + "% fatal crashes of " + d.mystate )
              }
            })
            .on("mouseout",function(){
              asvg.select(".tooltip").remove();
              d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);

            })


// End of define rect of relative



// define rect for absolute


    var stateAbsolute= asvg.selectAll(".absolute")
            .data(data)
            .enter().append("g")
            .attr("class", "absolute")
            .attr("transform", function(d) { return "translate(" + "0" + ",0)"; });



    stateAbsolute.selectAll("rect")
            .data(function(d) { return d.ages})
            .enter().append("rect")
            .attr("width", x3.rangeBand())
            .attr("y", function(d) {

              return yAbsolute(d.y1);
            })
            .attr("x",function(d) {
              return x3(d.mystate)
            })
            .attr("height", function(d) {
              return yAbsolute(d.y0) - yAbsolute(d.y1);
            })
            .attr("fill", function(d){
              return color(d.name)
            })
            .attr("id",function(d) {
              return d.mystate
            })
            .attr("class","absolute")
            .style("pointer-events","all")
            .attr("opacity",0); // initially it is invisible, i.e. start with Absolute View



    //define two different scales, but one of them will always be hidden.
    asvg.append("g")
            .attr("class", "y axis absolute")
            .call(yAxisAbsolute)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Crash Fatalities");

    asvg.append("g")
            .attr("class", "y axis relative")
            .call(yAxisRelative)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Crash Fatalities");

    asvg.select(".y.axis.absolute").style("opacity",0);


    // end of define absolute


// adding legend

    var legend = asvg.selectAll(".legend")
            .data(color.domain().slice().reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + (8 + i * 20) + ")"; });

    legend.append("rect")
            .attr("x", awidth - 18+legend_awidth)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", color);

    legend.append("text")
            .attr("x", awidth - 24+legend_awidth)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

    asvg.append("text")
          .text("BAC Level")
          .attr("x", awidth - 50 +legend_awidth)
          .attr("y", 0)



    // var clickButton = svg.selectAll(".clickButton")
    //         .data([30,30])
    //         .enter().append("g")
    //         .attr("class","clickButton")
    //         .attr("transform","translate(0," + 180 +")");


    // clickButton.append("text")
    //         .attr("x", awidth +legend_awidth)
    //         .attr("y", 9)
    //         .attr("dy", ".35em")
    //         .style("text-anchor", "end")
    //         .text("Switch View")
    //         // .attr("id","clickChangeView")
    //         .attr("class", "btn cs-btn") ;


    // start with relative view
    Transition2Relative();


    // Switch view on click the clickButton
    d3.selectAll("#"+ "clickChangeView")
            .on("click",function(){

              if(absoluteView){ // absolute, otherwise relative
                Transition2Relative();
              } else {
                Transition2Absolute();
              }
              absoluteView = !absoluteView // change the current view status
            });




    function Transition2Absolute(){
      //Currently it is Relative
      stateRelative.selectAll("rect").transition().duration(2000).style("opacity",0);
      stateAbsolute.selectAll("rect").transition().duration(2000).style("opacity",1);//show absolute view rectangles
      asvg.select(".y.axis.relative").transition().duration(2000).style("opacity",0);
      asvg.select(".y.axis.absolute").transition().duration(2000).style("opacity",1);// show absolute view axis

    }

    function Transition2Relative(){
      //Currently it is absolute
      stateAbsolute.selectAll("rect").transition().duration(2000).attr("fill",function(d) {return  color(d.name)})
      stateAbsolute.selectAll("rect").transition().duration(2000).style("opacity",0);//show absolute view rectangles
      stateRelative.selectAll("rect").transition().duration(2000).style("opacity",1);
      asvg.select(".y.axis.relative").transition().duration(2000).style("opacity",1);
      asvg.select(".y.axis.absolute").transition().duration(2000).style("opacity",0);// show absolute view axis

    }
  });