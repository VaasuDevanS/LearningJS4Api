/*
Developer: Vaasudevan Srinivasan
Created on: Jun 25, 2020
Last Modified on: Jun 25, 2020
Description: Script with useful Javascript functions
*/


// https://developers.arcgis.com/javascript/latest/guide/select-a-basemap/
require([
  "esri/views/MapView",
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/Graphic",
  "esri/geometry/geometryEngine"
], function(MapView, Map, FeatureLayer, Home, Graphic, geometryEngine) {
	

let geom = undefined;


// Map
var map = new Map({ basemap: "satellite" })

// Basemap
var view = new MapView({
    container: "map",
    map: map,
    center: [-66.649597, 45.957315],
    zoom: 11
});

// HomeButton
var homeBtn = new Home({ view: view });
view.ui.add(homeBtn, "top-left");


// Accident points
var accidents = new FeatureLayer({
	url: "https://services5.arcgis.com/c7Oidgft2bQ65Tib/arcgis/rest/services/TrafficAccidents/FeatureServer",
	renderer: {
      type: "unique-value",
      field: "Year_",
	  uniqueValueInfos: [ {value: 2009, symbol: {
											  type: "simple-marker",
											  style: "circle",
											  color: "yellow",
											  size: "5px",
											  outline: { color: "yellow", width: 1 }
										  }
	  } ],
	  defaultSymbol: { type: "simple-marker",
					   style: "circle",
					   color: "pink",
					   size: "5px",
					   outline: { color: "pink", width: 1 }
					  },
    }
});
map.add(accidents);


// Select based on click (https://gis.stackexchange.com/a/350175)
view.on("click", function(event) {  
  view.hitTest(event).then(function(response) {
      var firstLayer = response.results[0];
      geom = firstLayer.graphic.geometry;
      var symbol = {
          type: "simple-marker",
          style: "square",
          color: "blue",
          size: "8px",
          outline: { color: [ 255, 0, 0 ], width: 2 }
      };
      var graphic = new Graphic(geom, symbol);
      view.graphics.removeAll();
      view.graphics.add(graphic);
    });
});


// Generate buffer function
$("#genbuffer").click(function() {
  if (geom == undefined) {
	  alert("Select a point; then click buffer..");
	  return;
  }
  var buffvalue = $("#buffervalue").val();
  buffer = geometryEngine.geodesicBuffer(geom, buffvalue, "meters");
  view.graphics.removeAll();
  var bufferGraphic = new Graphic({
        geometry: buffer,
        symbol: {
          type: "simple-fill",
          color: "red",
          outline: {
            color: "rgba(0,0,0,.5)",
            width: 2
          }
        }
      });
  view.graphics.add(bufferGraphic);
});


// Clear function
$("#clear").click(function() {
  view.graphics.removeAll();
  geom = undefined;
});



});
