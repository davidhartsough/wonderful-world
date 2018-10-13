// Remind everyone that the world is wonderful
console.log("What a wonderful world");

var geocoder;
var sv;
var panorama;
var panoTimeout;
var patienceTimeout;
var percent = 0;
var isTrying = false;
var bePatient = false;

function initialize() {
  // Init the Geocoder to look up address later
  geocoder = new google.maps.Geocoder();
  // Init the Street View Service to grab photospheres later
  sv = new google.maps.StreetViewService();
  // Hide/disable nearly all controls and UI
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("street-view"),
    {
      disableDefaultUI: true,
      disableDoubleClickZoom: true,
      fullscreenControl: false,
      addressControl: false,
      clickToGo: false,
      linksControl: false,
      panControl: false,
      scrollwheel: false,
      showRoadLabels: false,
      enableCloseButton: false,
      zoomControl: false
    }
  );
  // Continually rotate the heading
  window.setInterval(function() {
    var pov = panorama.getPov();
    // Pan view right
    pov.heading += 0.4;
    // Update current point of view
    panorama.setPov(pov);
    // Update progress bar
    percent = (pov.heading / 360) * 100;
    document.getElementById("progress").style.width = percent + "%";
    // Request new photosphere after full rotation
    if (pov.heading > 360 && !isTrying) {
      // Reset view heading to due north
      pov.heading = 0;
      // Set current point of view to that heading
      panorama.setPov(pov);
      // Request a new photosphere panorama
      tryGetPano();
    }
  }, 50);
  // Get first photosphere panorama
  tryGetPano();
}

function getRandomLatLng() {
  // Latitude: 0 - 90
  var lat = Math.random() * 90;
  // Select positive or negative
  lat *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
  // Longitude: 0 - 180
  var lng = Math.random() * 180;
  // Set longitude positive or negative
  lng *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
  // Return Google Maps LatLng object
  return new google.maps.LatLng(lat, lng);
}

function tryGetPano() {
  isTrying = true;
  var point = getRandomLatLng();
  // Attempt to get a photosphere at the random coordinates, within 9 million meters
  sv.getPanoramaByLocation(point, 9000000, processSVData);
  panoTimeout = false;
}

function processSVData(data, status) {
  // If a photosphere panorama was found,
  if (status === "OK") {
    // Clear the address to prep it for the new one
    document.getElementById("address").innerHTML = "";
    // Create a reverse geocoding request using our lat lng data
    var request = {};
    request.latLng = data.location.latLng;
    // And send that request to the Google Maps Geocoder
    geocoder.geocode(request, handleGeocodingResponse);
    // Write down the new coordinates
    console.log(data.location.latLng.lat() + "," + data.location.latLng.lng());
    // Show off the new photosphere panorama
    panorama.setPano(data.location.pano);
    // Reset the progress bar
    percent = 0;
    document.getElementById("progress").style.width = 0;
    // Enforce patience, because Google can only handle so many requests
    isTrying = false;
    // Never let timeouts double up
    if (patienceTimeout) {
      clearTimeout(patienceTimeout);
    }
    // Wait 3 seconds before allowing another request
    patienceTimeout = setTimeout(function() {
      bePatient = false;
    }, 3000);
  } else {
    // If there's already a timeout happening, clear it
    if (panoTimeout) {
      clearTimeout(panoTimeout);
    }
    // Send another request in 1.5 seconds
    panoTimeout = setTimeout(function() {
      tryGetPano();
    }, 1500);
    // Reset progress bar
    percent = 0;
    document.getElementById("progress").style.width = 0;
  }
}

function requestNew() {
  // If there are no current requests or timeouts,
  if (!isTrying && !bePatient) {
    // Enforce patience
    bePatient = true;
    // Make another request
    tryGetPano();
  }
}

function handleGeocodingResponse(results, status) {
  // If the reverse geocoding was successful,
  if (status === "OK") {
    // Grab the first result because it has the most specific address
    var firstResult = results[0];
    // Ensure there is a result to work with
    if (firstResult) {
      // Grab the formatted_address because it is the most complete one
      var address = firstResult.formatted_address;
      // Update the DOM
      document.getElementById("address").innerHTML = address;
      // Write that down
      console.log(address);
    }
  }
}
