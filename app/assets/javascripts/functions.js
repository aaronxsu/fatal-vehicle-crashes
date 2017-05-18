$(document).ready(function(){
  Paloma.start();
});

$(document).on('page:restore', function(){
  Paloma.start();
});

var initializeMap = function(mapId, zoonLevel, centroidLatLngArray, isZoomable, isZoomControl){
  return L.map(mapId, {
    center: centroidLatLngArray,
    zoom: zoonLevel,
    scrollWheelZoom: isZoomable,
    zoomControl: isZoomControl
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

var lineWidth = function(breaks, crashCount){
  return crashCount >= breaks[2][0]? 8 :
         crashCount >= breaks[1][0]? 5 :
                                     2;

  // console.log(breaks, crashCount)
  // if(crashCount >= breaks[2][0]){ return 10; }
  // else if(crashCount >= breaks[1][0]){ return 1; }
  // else { return 1; }
};

var lineColor = function(breaks, crashCount){
  return crashCount >= breaks[2][0]? "#3844b3" :
         crashCount >= breaks[1][0]? "#7881d5" :
                                     "#c3c7ec";
};

var weatherCondition = function(year, weatherCode){
  switch(weatherCode) {
    case 0:
      return year >= 2010 ? "No Additional Atmospheric Conditions" : "No Adverse Atmospheric Conditions";
      break;
    case 1:
      return year >= 2010 ? "Clear" : "No Adverse Atmospheric Conditions";
      break;
    case 2:
      return "Rain";
      break;
    case 3:
      return "Sleet, Hail";
      break;
    case 4:
      return "Snow";
      break;
    case 5:
      return "Fog";
      break;
    case 6:
      return year >= 2007 ? "Severe Crosswinds" : "Rain and Fog";
      break;
    case 7:
      return year >= 2007 ? "Blowing Sand, Soil, Dirt" : "Sleet and Fog";
      break;
    case 8:
      return "Other";
      break;
    case 9:
      return "Unknown";
      break;
    case 10:
      return "Cloudy";
      break;
    case 11:
      return "Blowing Snow";
      break;
    case 12:
      return "Freezing Rain or Drizzle";
      break;
    case 98:
      return "Not Reported";
      break;
    case 99:
      return "Unknown";
      break;
    default:
      return "";
  }
}

//all have popups with crash info
//when hovered, the circle becomes bigger
var addCrashPoints = function(year, eachCrashObject, map){
  var popupHTML = "<p><b>Date</b>: " + eachCrashObject.month_text + " " + eachCrashObject.day + "</p>"
                + "<p><b>Day</b>: " + eachCrashObject.day_week_text + "</p>"
                + "<p><b>Time</b>: ~" + eachCrashObject.hour + ":00</p>"
                + "<p><b>Fatalities</b>: " + eachCrashObject.fatals + "</p>"
                + "<p><b>Drunk Individuals</b>: " + eachCrashObject.drunk + "</p>"
                + "<p><b>Weather</b>: " + weatherCondition(year, eachCrashObject.weather) + "</p>";

  return L.circleMarker([eachCrashObject.latitude, eachCrashObject.longitude],{
    radius: 5,
    stroke: false,
    fillOpacity: 0.8,
    fillColor: '#b33844',
  })
  .bindPopup(popupHTML)
  .on({
    mouseover: function(e){ e.target.setRadius(10); },
    mouseout: function(e) { e.target.setRadius(5);  }
  })
  .addTo(map);
}

var mapIdToKey = function(id){
  switch(id) {
    case "month":
      return "month_text";
      break;
    case "day":
      return "day_week_text";
      break;
    default:
      return id;
  }
}

var pluckCrashInfoValues = function(dataCrash, key){
  return _.chain(dataCrash)
          .pluck(key)
          .uniq()
          .sortBy(function(num){
            return num
          }).
          value();
}

Paloma.controller('Crashes', {

  index: function(){

    var selectedYear = 2004;

    //Fill in the year field of the hidden search form for firing search and redirect to search page
    $('#year').val(selectedYear);

    //The county GeoJSON from controller's request to GitHub my data repo
    var countyGeojson = this.params.county;

    //Initialize the map and make the center in PA
    var mapIndex = initializeMap('index-map', 8, [40.967418, -77.106913], false, false);

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

    //variables sent from the back end controller
    var crashes = this.params.crashes, //an array of crash point objects from db query based on county fips and year
        roads = this.params.roads, //geojson from github based on county fips
        year = this.params.year, //year of this search
        fips = this.params.fips, //county fips of this search
        countyCentroid = this.params.county_centroid, //[lat, lng] of the county centroid, from github county centorid data
        countyName = this.params.county_name; //county name

    //the torque layer to store carto time series map tiles
    var torqueLayer;

    //hide all attribute filter dropdown
    $(".filter-dropdown").hide();
    //populate the title with county name and year
    $("#search-header-county").text(countyName);
    $("#search-header-year").text(year);

    //all crash counts on road segments
    var allRoadCrashCounts = objectValues(_.pluck(roads.features,'properties'), ["crash_" + year]);
    //three buckest of values to break the crash counts on roads into three parts
    var allRoadCrashCountsBreaks = _.map(ss.ckmeans(allRoadCrashCounts, 3), function(group){ return [_.first(group), _.last(group)]});

    //initialize this county's map
    var mapSearch = initializeMap('search-map', 12, countyCentroid, true, true);
    var cartoToner = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    }).addTo(mapSearch);

    //add the roads to this map, crash counts on roads are represented by width and color of lines
    var layerRoads = L.geoJSON(roads, {
      style: function(feature){
        return {
          weight: lineWidth(allRoadCrashCountsBreaks, feature.properties["crash_" + year]),
          color: lineColor(allRoadCrashCountsBreaks, feature.properties["crash_" + year])
        }
      }
    })
    .addTo(mapSearch);

    //add all crash points to the map
    var layerCrashPoints = _.map(crashes, function(eachCrashObject){
      return addCrashPoints(year, eachCrashObject, mapSearch)
    });

    //Append options to the dropdown based on this queried data
    var months = pluckCrashInfoValues(crashes, "month");
    _.each(months, function(monthNum){
      var monthText = _.find(crashes, function(crash){return crash.month == monthNum}).month_text;
      $("#dropdown-month").append("<li class='mdl-menu__item' id='month-"+ monthText +"'>" + monthText + "</li>");
    });
    var days = pluckCrashInfoValues(crashes, "day_week");
    _.each(days, function(dayNum){
      var dayText = _.find(crashes, function(crash){return crash.day_week == dayNum}).day_week_text;
      $("#dropdown-day").append("<li class='mdl-menu__item' id='day-"+ dayText +"'>" + dayText + "</li>");
    });
    var hours = pluckCrashInfoValues(crashes, "hour");
    _.each(hours, function(hourNum){
      var hourText = (hourNum == 88 || hourNum == 99 ? "Unknown" : "~ " + hourNum + ":00");
      $("#dropdown-hour").append("<li class='mdl-menu__item' id='hour-"+ hourNum +"'>" + hourText + "</li>");
    });
    var fatals = pluckCrashInfoValues(crashes, "fatals");
    _.each(fatals, function(fatalNum){
      $("#dropdown-fatals").append("<li class='mdl-menu__item' id='fatals-"+ fatalNum +"'>" + fatalNum + "</li>");
    });
    var drunks = pluckCrashInfoValues(crashes, "drunk");
    _.each(drunks, function(drunkNum){
      $("#dropdown-drunk").append("<li class='mdl-menu__item' id='drunk-"+ drunkNum +"'>" + drunkNum + "</li>");
    });
    var weathers = pluckCrashInfoValues(crashes, "weather");
    _.each(weathers, function(weatherNum){
      var weatherText = weatherCondition(year, weatherNum);
      $("#dropdown-weather").append("<li class='mdl-menu__item' id='weather-"+ weatherNum +"'>" + weatherText + "</li>");
    });


    //when one of three tabs is clicked
    $(".mdl-tabs__tab").on("click", function(e){
      //if there is any static crash points rendered (all or filtered)
      //clear them
      //then add all crash points to the map
      if(layerCrashPoints.length){
        _.each(layerCrashPoints, function(eachLayer){ mapSearch.removeLayer(eachLayer);})
        layerCrashPoints = [];
        layerCrashPoints = _.map(crashes, function(eachCrashObject){
          return addCrashPoints(year, eachCrashObject, mapSearch)
        });
      }
      //if there is a torque layer rendered, clear it
      if(!_.isEmpty(torqueLayer)){
        mapSearch.removeLayer(torqueLayer);
        torqueLayer = {};
      }
      //if the torque layer switch is on, turn it off
      if($("#switch-time-series").prop("checked")){
        $("#switch-time-series").click();
      }
    });

    //when the time series switch is on
    //clear whatever is on the map
    //render the torque map by carto
    $("#switch-time-series").on("click", function(e){
      var status = $(this).prop("checked");
      //if the swith is on
      if(status){
        //clear the rendered static points
        if(layerCrashPoints.length){
          _.each(layerCrashPoints, function(eachLayer){ mapSearch.removeLayer(eachLayer);})
          layerCrashPoints = [];
        }
        //just in case if there is a torque layer on the map, clean it
        if(!_.isEmpty(torqueLayer)){
          mapSearch.removeLayer(torqueLayer);
          torqueLayer = {};
        }
        //render the new torque layer
        var CARTOCSS = [
          "Map {",
            "-torque-frame-count:256;",
            "-torque-animation-duration:30;",
            "-torque-time-attribute:'time_order';",
            "-torque-aggregation-function:'count(cartodb_id)';",
            "-torque-resolution:4;",
            "-torque-data-aggregation:linear;",
          "}",
          "#pa_crashes{",
            "comp-op: lighter;",
            "marker-fill-opacity: 0.9;",
            "marker-line-color: #FFFFFF;",
            "marker-line-width: 1;",
            "marker-line-opacity: 1;",
            "marker-type: ellipse;",
            "marker-width: 6;",
            "marker-fill: #FFA300;",
          "}",
          "#pa_crashes[frame-offset=1] {",
           "marker-width:8;",
           "marker-fill-opacity:0.45;",
          "}",
          "#pa_crashes[frame-offset=2] {",
           "marker-width:10;",
           "marker-fill-opacity:0.225;",
          "}",
          "#pa_crashes[frame-offset=3] {",
           "marker-width:12;",
           "marker-fill-opacity:0.15;",
          "}",
          "#pa_crashes[frame-offset=4] {",
          " marker-width:14;",
           "marker-fill-opacity:0.1125;",
          "}"
        ].join('\n');

        torqueLayer = new L.TorqueLayer({
          user       : 'xunzesu',
          table      : "pa_crashes",
          query      : "SELECT * FROM pa_crashes WHERE year = " + year + " AND fips = " + fips,
          zIndex     : 1000,
          cartocss   : CARTOCSS
        });

        torqueLayer.error(function(err){
          for(error in err){ console.warn(err[error]); }
        });

        torqueLayer.addTo(mapSearch);
        torqueLayer.play();

      }else {
        //if the swith is off
        //clear the torque time series map
        mapSearch.removeLayer(torqueLayer);
        torqueLayer = {};
        //add static points back to the map
        layerCrashPoints = _.map(crashes, function(eachCrashObject){
          return addCrashPoints(year, eachCrashObject, mapSearch)
        });
      }
    })

    //when the dropdown option is clicked, fill in the text field
    //clear all points on the map
    //filter data based on selected option
    //add the filtered data to the map
    $(".mdl-menu__item").on("click", function(e){
      //this id is in the form of xx-yy, e.g.: month-Januaray
      var id = this.id;
      var htmlId = id.split("-")[0];
      var value = id.split("-")[1];

      //fill in the text field for the dropdown
      var fillVal;
      if(htmlId == "hour"){
        fillVal = (value == 88 || value == 99 ? "Unknown" : "~ " + value + ":00");
      }else if(htmlId == "weather"){
        fillVal = weatherCondition(year, value);
      }else {
        fillVal = value;
      }
      $("#filter-" + id.split("-")[0] + "-dropdown-selected").val(fillVal);

      //clear all points on the map and the variable storing the points
      if(layerCrashPoints.length){
        _.each(layerCrashPoints, function(eachLayer){ mapSearch.removeLayer(eachLayer);})
        layerCrashPoints = [];
      }

      //add the filtered points to the map
      layerCrashPoints = _.chain(crashes)
                          .filter(function(crash){ return crash[mapIdToKey(id.split("-")[0])].toString() == id.split("-")[1]; })
                          .map(function(point){ return addCrashPoints(year, point, mapSearch); })
                          .value();
    });

    //when any radio button is clicked, hide all dropdowns first
    //and then show the corresponding dropdown
    //clear any dropdown text field
    $('input[id*="radio-"]').on("click", function(e){
      var id = this.id.split("-")[1];
      $(".filter-dropdown").hide();
      $("#filter-" + id + "-dropdown").show();
      $("input[id*='-dropdown-selected']").val("");
    });


    console.log("Crashes:", crashes);
    console.log("Roads:", roads);
    console.log("Year:", year);
    console.log("FIPS:", fips);
    console.log("County Centroids:", countyCentroid);
    console.log("County Names:", countyName);

  }
})
