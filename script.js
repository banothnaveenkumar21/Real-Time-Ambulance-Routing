let routes = [];
let map = L.map('map').setView([17.3850, 78.4867], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let start = [17.3850, 78.4867];
let end = [17.4435, 78.3772];

let routeCoords = [];
let marker = L.marker(start).addTo(map);

let polyline;

// 🚑 Get Route from OSRM
function getRoute() {

  let url = `https://router.project-osrm.org/route/v1/driving/
    ${start[1]},${start[0]};
    ${end[1]},${end[0]}
    ?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {

      routeCoords = data.routes[0].geometry.coordinates.map(coord => [
        coord[1], coord[0]
      ]);

      if (polyline) map.removeLayer(polyline);

      polyline = L.polyline(routeCoords, { color: 'blue' }).addTo(map);

      map.fitBounds(polyline.getBounds());

      document.getElementById("status").innerText = "Route Ready 🚑";
    });
}

// 🚗 Simulate Movement
function simulate() {

  let i = 0;

  let interval = setInterval(() => {

    if (i >= routeCoords.length) {
      clearInterval(interval);
      document.getElementById("status").innerText = "Arrived";
      return;
    }

    marker.setLatLng(routeCoords[i]);

    let speed = Math.floor(Math.random() * 60 + 20);

    document.getElementById("speed").innerText = speed;
    document.getElementById("status").innerText =
      speed < 10 ? "Slow" : "Moving";

    i++;

  }, 1000);
}
function openModal() {
  document.getElementById("routeModal").style.display = "block";
}

function closeModal() {
  document.getElementById("routeModal").style.display = "none";
}
function confirmRoute() {

  let startValue = document.getElementById("startSelect").value;
  let destValue = document.getElementById("destSelect").value;

  let startCoords;

  if (startValue === "current") {
    startCoords = currentLocation;
  } else {
    startCoords = startValue.split(',').map(Number);
  }

  let destination = destValue.split(',').map(Number);

  closeModal();

  drawRoute(startCoords, destination);
}
function drawMultipleRoutes(start, end) {

  // Remove old routes
  routes.forEach(r => map.removeLayer(r));
  routes = [];

  // Variations to simulate alternate routes
  let variations = [
    [0, 0],
    [0.01, -0.01],
    [-0.01, 0.01]
  ];

  let colors = ["blue", "green", "red"];

  variations.forEach((offset, index) => {

    let modifiedStart = [
      start[0] + offset[0],
      start[1] + offset[1]
    ];

    let url = `https://router.project-osrm.org/route/v1/driving/${modifiedStart[1]},${modifiedStart[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {

        if (!data.routes || data.routes.length === 0) return;

        let coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

        let routeLine = L.polyline(coords, {
          color: colors[index],
          weight: 5
        }).addTo(map);

        routeLine.bindPopup("Route " + (index + 1));

        routes.push(routeLine);

        if (index === 0) {
          map.fitBounds(routeLine.getBounds());
        }

      });

  });

  document.getElementById("status").innerText = "3 Routes Generated 🚑";
}
function confirmMultipleRoutes() {

  let startValue = document.getElementById("startSelect").value;
  let destValue = document.getElementById("destSelect").value;

  let start = (startValue === "current")
    ? currentLocation
    : startValue.split(',').map(Number);

  let end = destValue.split(',').map(Number);

  drawMultipleRoutes(start, end);
}
let startMarker = null;
let endMarker = null;

let startCoords = null;
let endCoords = null;
function resetMap() {

  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);
  if (polyline) map.removeLayer(polyline);

  startCoords = null;
  endCoords = null;

  document.getElementById("startSelect").innerHTML =
    `<option value="current">Use Current Location</option>`;

  document.getElementById("destSelect").innerHTML =
    `<option value="">Select Destination</option>`;

  document.getElementById("status").innerText = "Reset - Select Points";
}
map.on('click', function(e) {

  let lat = e.latlng.lat.toFixed(5);
  let lng = e.latlng.lng.toFixed(5);

  let coordString = `${lat},${lng}`;

  // First click → Start
  if (!startCoords) {

    startCoords = [parseFloat(lat), parseFloat(lng)];

    if (startMarker) map.removeLayer(startMarker);

    startMarker = L.marker(startCoords).addTo(map)
      .bindPopup("📍 Start Location").openPopup();

    // 🔥 Update popup dropdown
    let startSelect = document.getElementById("startSelect");
    startSelect.innerHTML = `<option value="${coordString}">Pinned Location (${lat}, ${lng})</option>`;
  }

  // Second click → Destination
  else if (!endCoords) {

    endCoords = [parseFloat(lat), parseFloat(lng)];

    if (endMarker) map.removeLayer(endMarker);

    endMarker = L.marker(endCoords).addTo(map)
      .bindPopup("🏁 Destination").openPopup();

    // 🔥 Update destination dropdown
    let destSelect = document.getElementById("destSelect");
    destSelect.innerHTML = `<option value="${coordString}">Pinned Location (${lat}, ${lng})</option>`;

    // Draw route
    drawMultipleRoutes(startCoords, endCoords);
  }

  // Third click → Reset
  else {
    resetMap();

    startCoords = [parseFloat(lat), parseFloat(lng)];

    startMarker = L.marker(startCoords).addTo(map)
      .bindPopup("📍 Start Location").openPopup();

    document.getElementById("startSelect").innerHTML =
      `<option value="${coordString}">Pinned Location (${lat}, ${lng})</option>`;
  }

});