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
}

var objectValues = function(objectsArray, keysArray){
  
}



Paloma.controller('Crashes', {
  index: function(){

    var countyGeojson = this.params.county;

    var mapIndex = initializeMap([40.997455, -77.715260]);

    L.geoJSON(countyGeojson).addTo(mapIndex);



    console.log(countyGeojson);

    $('#index-year-slider').on('click', function(e){
      $('#slider-selected-year').text($(this).val());
    })


  },
  show: function(){

  }
})
