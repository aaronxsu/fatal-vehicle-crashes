$(document).ready(function(){
  Paloma.start();
});

$(document).on('page:restore', function(){
  Paloma.start();
});

var initializeMap = function(centroidLatLngArray){
  return L.map('index-map', {
    center: centroidLatLngArray,
    zoom: 8,
    scrollWheelZoom: false,
    zoomControl:false
  });
};

var objectValues = function(objectsArray, keysArray){
  return _.chain(keysArray)
          .map(function(key){
            return _.pluck(objectsArray, key)
          })
          .flatten()
          .value();
};

var crashCountCategory = function(count, breaksArray, length){
  return count > breaksArray[length - 2][1] ? 5 : //the 5th category
         count > breaksArray[length - 3][1] ? 4 : //the 4th category
         count > breaksArray[length - 4][1] ? 3 : //the 3rd category
         count > breaksArray[length - 5][1] ? 2 : //the 2nd category
                                              1;  //the 1st category
};

var fillColorCrashCount = function(category){
  return category == 5 ? '#800026' : //the 5th category
         category == 4 ? '#BD0026' : //the 4th category
         category == 3 ? '#E31A1C' : //the 3rd category
         category == 2 ? '#FC4E2A' : //the 2nd category
                         '#FFEDA0';  //the 1st category
};

var countyStyle = function(feature){
  return {
    fillColor: fillColorCrashCount(feature.properties.y_2004_cat),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
};


Paloma.controller('Crashes', {

  index: function(){

    var selectedYear = 2004;

    //Fill in the year field of the hidden search form for firing search and redirect to search page
    $('#year').val(selectedYear);

    //The county GeoJSON from controller's request to GitHub my data repo
    var countyGeojson = this.params.county;

    //Initialize the map and make the center in PA
    var mapIndex = initializeMap([40.967418, -77.106913]);

    //Crash counts in all counties from 2004 to 2013
    var allCrashCounts = objectValues(_.pluck(countyGeojson.features,'properties'),
                                      _.map(_.range(2004, 2014), function(year){return "y_"+year;}))
    //Crash count breaks for mapping purposes
    var allCrashCountsBreaks = _.map(ss.ckmeans(allCrashCounts, 5), function(group){ return [_.first(group), _.last(group)]});

    //Give each county's crash count in each year a category based on the breaks just calculated
    _.each(countyGeojson.features, function(eachCounty){
      _.each(_.map(_.range(2004, 2014), function(year){return "y_"+year;}), function(yearCountKey){
        eachCounty.properties[yearCountKey + '_cat'] = crashCountCategory(eachCounty.properties[yearCountKey], allCrashCountsBreaks, 5);
      });
    });

    //Add GeoJSON county data to the map
    var layerCrashCountByCounty = L.geoJSON(countyGeojson, {
      style: countyStyle, //set the style of each county
      onEachFeature: function(feature, layer){
        //once a county is clicked, show a popup of its name, crash count in this year, and a button to go to the detail page
        layer.on({
          click: function(e){
            //the popup html including the county name and the crash count in this year
            var popupHTML = "<p><b>" + feature.properties.County + "</b></p>"
                          + "<p>Crash Count: " + feature.properties["y_"+selectedYear] +"</p>";
            //if the crash count in this year, then add a view detail button
            if(feature.properties["y_"+selectedYear] > 0){
              popupHTML += "<button id='btn-popup-view-detail-" + feature.properties['FIPS'] + "' class='mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent'>View Details</button>"
            }
            //bind and open this popup
            e.target.bindPopup(popupHTML).openPopup();
            //when the view detail button is clicked, fill the fips field in the submit form (which is invisible)
            //and programatically click the submit form button to redirect to the search result page for this county's crashes in this year
            $('#btn-popup-view-detail-' + feature.properties['FIPS']).on("click", function(e){
              $('#fips').val(this.id.split('btn-popup-view-detail-')[1]);
              $('#btn-search-submit').click();
            });
          }
        });
      }
    })
    .addTo(mapIndex);

    //Add a legend to the map
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend'),
          grades = _.chain(allCrashCountsBreaks)
                    .map(function(breakArray, index){
                      if(index == 0){
                        return breakArray
                      }else{
                        return breakArray[1]
                      }
                    })
                    .flatten()
                    .value(),
          labels = [];
      for (var i = 0; i < grades.length - 1; i++) {
        div.innerHTML += '<i style="background:' + fillColorCrashCount(crashCountCategory(grades[i] + 1, allCrashCountsBreaks, 5)) + '"></i> '
                       + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }
      return div;
    };
    legend.addTo(mapIndex);

    //When the slider is changed
    $('#index-year-slider').on('click', function(e){
      //update the selected year variable
      selectedYear = $(this).val();
      //Display the selected year
      $('#slider-selected-year').text(selectedYear);
      //Update the year field of the search form
      $('#year').val(selectedYear);
      //update the county fill color based on crashes in this newly selected year
      layerCrashCountByCounty.setStyle(function(feature){
        return {
          fillColor: fillColorCrashCount(feature.properties["y_" + selectedYear + "_cat"])
        }
      })
    });

  },

  search: function(){

    var crashes = this.params.crashes,
        roads = this.params.roads,
        year = this.params.year,
        fips = this.params.fips;

    console.log(crashes);
    console.log(roads);
    console.log(year);
    console.log(fips);

  }
})
