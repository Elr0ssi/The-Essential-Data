const categorySelect = document.getElementById('category-select');
const detailsPanel = document.getElementById('country-details');
const detailsCards = document.getElementById('detail-cards');

const map = L.map('map', {
  zoomControl: true,
  minZoom: 2,
  maxZoom: 8,
  worldCopyJump: true
}).setView([20, 2], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

let worldLayer;
let dataset = {};
let selectedCountryCode = null;

const colorScale = (score) => {
  if (score == null) return '#334155';
  if (score >= 85) return '#fef08a';
  if (score >= 70) return '#67e8f9';
  if (score >= 55) return '#22d3ee';
  return '#1d4ed8';
};

const legendControl = L.control({ position: 'bottomleft' });
legendControl.onAdd = () => {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = `
    <strong>Intensité du score</strong>
    <div class="legend-gradient"></div>
    <small>Faible → Élevé</small>
  `;
  return div;
};
legendControl.addTo(map);

function styleFeature(feature) {
  const code = feature.properties.ISO_A3;
  const category = categorySelect.value;
  const score = dataset[code]?.[category]?.score;
  const isSelected = selectedCountryCode === code;

  return {
    fillColor: colorScale(score),
    weight: isSelected ? 2.2 : 1,
    opacity: 1,
    color: isSelected ? '#f8fafc' : '#9ca3af',
    fillOpacity: 0.75
  };
}

function updateDetails(code) {
  const category = categorySelect.value;
  const country = dataset[code];

  if (!country || !country[category]) {
    detailsPanel.querySelector('h2').textContent = code || 'Pays inconnu';
    detailsPanel.querySelector('.subtitle').textContent = 'Aucune donnée pour cette catégorie.';
    detailsCards.innerHTML = '';
    return;
  }

  detailsPanel.querySelector('h2').textContent = country.name;
  detailsPanel.querySelector('.subtitle').textContent = `Données ${category}`;

  const detailEntries = Object.entries(country[category].details);
  detailsCards.innerHTML = detailEntries
    .map(
      ([label, value]) => `
      <article class="card">
        <span class="label">${label}</span>
        <span class="value">${value}</span>
      </article>
    `
    )
    .join('');
}

function onEachFeature(feature, layer) {
  const code = feature.properties.ISO_A3;
  layer.on({
    mouseover: () => {
      layer.setStyle({ weight: 2, color: '#f1f5f9' });
    },
    mouseout: () => {
      if (worldLayer) {
        worldLayer.resetStyle(layer);
      }
    },
    click: () => {
      selectedCountryCode = code;
      worldLayer.setStyle(styleFeature);
      updateDetails(code);
    }
  });

  const category = categorySelect.value;
  const score = dataset[code]?.[category]?.score;
  layer.bindTooltip(`${feature.properties.ADMIN}<br>Score: ${score ?? 'N/A'}`);
}

async function boot() {
  const [worldResponse, dataResponse] = await Promise.all([
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'),
    fetch('data/countryData.json')
  ]);

  const worldGeoJson = await worldResponse.json();
  dataset = await dataResponse.json();

  worldLayer = L.geoJSON(worldGeoJson, {
    style: styleFeature,
    onEachFeature
  }).addTo(map);
}

categorySelect.addEventListener('change', () => {
  if (!worldLayer) return;
  worldLayer.setStyle(styleFeature);
  if (selectedCountryCode) {
    updateDetails(selectedCountryCode);
  }
});

boot().catch((error) => {
  console.error(error);
  detailsPanel.querySelector('.subtitle').textContent = 'Impossible de charger les données.';
});
