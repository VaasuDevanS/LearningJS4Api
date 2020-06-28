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
  "esri/geometry/geometryEngine",
  "esri/widgets/FeatureTable",
  "esri/widgets/Sketch",
  "esri/layers/GraphicsLayer",
  "esri/tasks/support/Query",
], function(MapView, Map, FeatureLayer, Home, Graphic, geometryEngine, FeatureTable,
            Sketch, GraphicsLayer, Query) {
	

// Map
const drawing_layer = new GraphicsLayer();
const map = new Map({ basemap: "streets", layers: [drawing_layer] })
const accidentsurl = "https://services5.arcgis.com/c7Oidgft2bQ65Tib/arcgis/rest/services/TrafficAccidents/FeatureServer"

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
	url: accidentsurl,
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
					   color: "green",
					   size: "5px",
					   outline: { color: "green", width: 1 }
					  },
    }
});
map.add(accidents);


// FeatureTable
featureTable = new FeatureTable({
                     layer: accidents,
				     container: document.getElementById("featuretable")
});


// Sketch
const sketch = new Sketch({
          layer: drawing_layer,
          view: view,
          creationMode: "update"
});
view.ui.add(sketch, "top-right");



// Process
let geom = undefined, highlight = undefined;
// Store the geometry
sketch.on('create', function(evt){
    if(evt.state === 'complete'){
	  geom = evt.graphic.geometry;
    }
});

$("#process").click(function() {
	
  if (geom != undefined) {
	  
    // Calculate the buffer and add to map
    buffer = geometryEngine.geodesicBuffer(geom, $("#buffervalue").val(), "meters");
    var bufferGraphic = new Graphic({
        geometry: buffer,
        symbol: {
		  type: "simple-fill",
          fill: "none",
          outline: {
            color: "cyan",
            width: 1
          }
        }
    });
    view.graphics.add(bufferGraphic);
	
	
	// Create query
	const query = accidents.createQuery();
	query.geometry = buffer;
    query.spatialRelationship = "intersects";
	query.outFields = [ "*" ];
	query.returnGeometry = false;
	accidents.queryFeatures(query).then(function(response){
		
	  // Generate the chart
	  var year_counts = {}, sql_query = "";
	  var results = response.features;
	  for (let i of results){ year_counts[i.attributes.Year_] = 0; }
	  for (let i of results){
		  year_counts[i.attributes.Year_] += 1;
		  sql_query += "FID = " + i.attributes.FID + " or ";
	  }
	  new Chartist.Bar('.ct-chart1', {
                labels: Object.keys(year_counts),
                series: Object.values(year_counts)
      }, { distributeSeries: true });
	  
	  
	  // Zoom to buffer
	  view.goTo(buffer);
	  
		
	  // Highlight points
	  view.whenLayerView(accidents).then(function(layerView){
	    highlight = layerView.highlight(results);
	  });
	  
	  
	  // Filter attribute table
	  $("#featuretable").empty();
	  filtered_layer = new FeatureLayer({ url: accidentsurl,
	                                      definitionExpression: sql_query.slice(0, -4) });
	  setTimeout(function(){
	    featureTable = new FeatureTable({ layer: filtered_layer,
				                          container: document.getElementById("featuretable") });
      }, 5000); 
	  
      
	})

  }
});


// Clear function
$("#clear").click(function() {
  
  view.graphics.removeAll();
  drawing_layer.removeAll();
  geom = undefined;
  $("#chart").empty();
  highlight.remove();
  $("#featuretable").empty();
  featureTable = new FeatureTable({ layer: new FeatureLayer({ url: accidentsurl }),
				                    container: document.getElementById("featuretable")
  });
  
});



});
