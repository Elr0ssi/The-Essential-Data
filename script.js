const categorySelect = document.getElementById('category-select');
const detailsPanel = document.getElementById('country-details');
const detailsCards = document.getElementById('detail-cards');
const floatingInfo = document.getElementById('floating-info');

let dataset = {};
let countries = [];
let selectedCountryCode = null;
let globe;

const colorScale = (score) => {
  if (score == null) return 'rgba(71, 85, 105, 0.72)';
  if (score >= 85) return 'rgba(254, 240, 138, 0.88)';
  if (score >= 70) return 'rgba(103, 232, 249, 0.86)';
  if (score >= 55) return 'rgba(34, 211, 238, 0.82)';
  return 'rgba(29, 78, 216, 0.8)';
};

const selectedColor = (score) => {
  if (score == null) return 'rgba(255, 255, 255, 0.95)';
  if (score >= 85) return 'rgba(250, 204, 21, 1)';
  if (score >= 70) return 'rgba(6, 182, 212, 1)';
  if (score >= 55) return 'rgba(14, 165, 233, 1)';
  return 'rgba(99, 102, 241, 1)';
};

function getCountryCode(feature) {
  return feature.properties.ISO_A3 || feature.id;
}

function getScore(feature) {
  const code = getCountryCode(feature);
  const category = categorySelect.value;
  return dataset[code]?.[category]?.score;
}

function updateDetails(code) {
  const category = categorySelect.value;
  const country = dataset[code];

  if (!country || !country[category]) {
    detailsPanel.querySelector('h2').textContent = code || 'Pays inconnu';
    detailsPanel.querySelector('.subtitle').textContent = 'Aucune donnée pour cette catégorie.';
    detailsCards.innerHTML = '';
    floatingInfo.textContent = `${code || 'Pays inconnu'} : pas de données disponibles.`;
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

  floatingInfo.textContent = `${country.name} • ${category} • score ${country[category].score}/100`;
}

function refreshGlobeStyles() {
  globe
    .polygonsData(countries)
    .polygonCapColor((feature) => {
      const score = getScore(feature);
      const code = getCountryCode(feature);
      return code === selectedCountryCode ? selectedColor(score) : colorScale(score);
    })
    .polygonSideColor(() => 'rgba(12, 22, 46, 0.4)')
    .polygonStrokeColor((feature) =>
      getCountryCode(feature) === selectedCountryCode ? 'rgba(248, 250, 252, 1)' : 'rgba(148, 163, 184, 0.55)'
    )
    .polygonAltitude((feature) => (getCountryCode(feature) === selectedCountryCode ? 0.06 : 0.012));
}

function initializeGlobe(worldGeoJson) {
  countries = worldGeoJson.features;

  globe = Globe()(document.getElementById('globeViz'))
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#56ccf2')
    .atmosphereAltitude(0.18)
    .lineHoverPrecision(0)
    .onPolygonClick((feature) => {
      selectedCountryCode = getCountryCode(feature);
      refreshGlobeStyles();
      updateDetails(selectedCountryCode);

      const [lng, lat] = feature.properties.LABEL_X && feature.properties.LABEL_Y
        ? [feature.properties.LABEL_X, feature.properties.LABEL_Y]
        : [0, 20];

      globe.pointOfView({ lat, lng, altitude: 1.8 }, 1200);
    })
    .onPolygonHover((feature) => {
      const name = feature?.properties?.ADMIN;
      const score = feature ? getScore(feature) : null;
      if (name) {
        floatingInfo.textContent = `${name} • score ${score ?? 'N/A'} (${categorySelect.value})`;
      } else if (selectedCountryCode) {
        const selectedName = dataset[selectedCountryCode]?.name || selectedCountryCode;
        floatingInfo.textContent = `${selectedName} sélectionné`;
      } else {
        floatingInfo.textContent = 'Cliquez sur un pays pour afficher ses données.';
      }
    })
    .polygonsTransitionDuration(260)
    .polygonLabel(
      (feature) => `<b>${feature.properties.ADMIN}</b><br/>Score: ${getScore(feature) ?? 'N/A'}<br/>Catégorie: ${categorySelect.value}`
    );

  refreshGlobeStyles();

  globe.pointOfView({ lat: 22, lng: 2, altitude: 2.3 }, 500);
}

async function boot() {
  const [worldResponse, dataResponse] = await Promise.all([
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'),
    fetch('data/countryData.json')
  ]);

  dataset = await dataResponse.json();
  const worldGeoJson = await worldResponse.json();

  initializeGlobe(worldGeoJson);
}

categorySelect.addEventListener('change', () => {
  if (!globe) return;
  refreshGlobeStyles();
  if (selectedCountryCode) {
    updateDetails(selectedCountryCode);
  }
});

boot().catch((error) => {
  console.error(error);
  detailsPanel.querySelector('.subtitle').textContent = 'Impossible de charger les données.';
});
