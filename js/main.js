// Instance the tour
var tour = new Tour({
  steps: [
  {
    element: "#chart-area",
    title: "Map",
    placement: "top",
    content: "Each point represents a crash in that location that year. Hover on the circle to see the date and number of people killed in the crash."
  },
  {
    element: "#checkboxes",
    title: "Filter by Highway Type",
    placement: "left",
    content: "Click on the checkboxes to show and hide different types of highways. Notice that the intersection of highways tend to have more accidents and larger fatality."
  },
  {
    element: "#map-slider",
    title: "Time Slider",
    content: "Slide to select the year, or hit the autoplay button to walk through the years. Notice certain areas have a lot of accidents every year."
  },
  {
    element: "#chart-area",
    title: "Zooming & Dragging",
    placement: "top",
    content: "Click on a state to zoom in. Click on the highlighted state again to zoom out. Drag to move the map."
  },
  {
    element: "#bar-chart-area",
    title: "Comparing between States",
    placement: "top",
    content: "Compare fatality rates across different states. Use the dropdown box to select the criteria, and the sort checkbox to sort by values."
  }
]});

$('#tour').click(function(e){
    // Initialize the tour
    tour.init(true);

    // Start the tour
    tour.start();

    // it's also good practice to preventDefault on the click event
    // to avoid the click triggering whatever is within href:
    e.preventDefault(); 
});
