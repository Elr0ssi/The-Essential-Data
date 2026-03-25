const categorySelect = document.getElementById('category-select');
const detailsPanel = document.getElementById('country-details');
const detailsCards = document.getElementById('detail-cards');
const floatingInfo = document.getElementById('floating-info');

let dataset = {};
let countries = [];
let selectedCountryCode = null;
let selectedFeature = null;
let globe = null;

const FALLBACK_NAME = 'Pays inconnu';

function colorScale(score) {
  if (score == null) return 'rgba(71, 85, 105, 0.72)';
  if (score >= 85) return 'rgba(254, 240, 138, 0.88)';
  if (score >= 70) return 'rgba(103, 232, 249, 0.86)';
  if (score >= 55) return 'rgba(34, 211, 238, 0.82)';
  return 'rgba(29, 78, 216, 0.8)';
}

function selectedColor(score) {
  if (score == null) return 'rgba(255, 255, 255, 0.95)';
  if (score >= 85) return 'rgba(250, 204, 21, 1)';
  if (score >= 70) return 'rgba(6, 182, 212, 1)';
  if (score >= 55) return 'rgba(14, 165, 233, 1)';
  return 'rgba(99, 102, 241, 1)';
}

function getCountryCode(feature) {
  return feature?.properties?.ISO_A3 || feature?.id || null;
}

function getCountryName(feature) {
  return feature?.properties?.ADMIN || dataset[getCountryCode(feature)]?.name || FALLBACK_NAME;
}

function getScore(feature) {
  const code = getCountryCode(feature);
  const category = categorySelect.value;
  return dataset[code]?.[category]?.score;
}

function geometryCenter(feature) {
  const geometry = feature?.geometry;
  if (!geometry) {
    return { lat: 20, lng: 0 };
  }

  const points = [];
  const pushCoords = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      points.push(coords);
      return;
    }
    coords.forEach(pushCoords);
  };

  pushCoords(geometry.coordinates);

  if (!points.length) {
    return { lat: 20, lng: 0 };
  }

  const [sumLng, sumLat] = points.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0]
  );

  return {
    lng: sumLng / points.length,
    lat: sumLat / points.length
  };
}

function updateDetails(code) {
  const category = categorySelect.value;
  const country = dataset[code];

  if (!country || !country[category]) {
    const label = country?.name || code || FALLBACK_NAME;
    detailsPanel.querySelector('h2').textContent = label;
    detailsPanel.querySelector('.subtitle').textContent = 'Aucune donnée pour cette catégorie.';
    detailsCards.innerHTML = `
      <article class="card">
        <span class="label">Statut</span>
        <span class="value">Pas de données</span>
      </article>
    `;
    floatingInfo.textContent = `${label} : pas de données disponibles (${category}).`;
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
  if (!globe) return;

  globe
    .polygonsData(countries)
    .polygonCapColor((feature) => {
      const score = getScore(feature);
      const code = getCountryCode(feature);
      return code === selectedCountryCode ? selectedColor(score) : colorScale(score);
    })
    .polygonSideColor(() => 'rgba(12, 22, 46, 0.45)')
    .polygonStrokeColor((feature) =>
      getCountryCode(feature) === selectedCountryCode
        ? 'rgba(248, 250, 252, 1)'
        : 'rgba(148, 163, 184, 0.45)'
    )
    .polygonAltitude((feature) => (getCountryCode(feature) === selectedCountryCode ? 0.09 : 0.015))
    .polygonLabel(
      (feature) => `<b>${getCountryName(feature)}</b><br/>Score: ${getScore(feature) ?? 'N/A'}<br/>Catégorie: ${categorySelect.value}`
    );
}

function selectCountry(feature) {
  selectedFeature = feature;
  selectedCountryCode = getCountryCode(feature);
  updateDetails(selectedCountryCode);
  refreshGlobeStyles();

  const center = geometryCenter(feature);
  globe.pointOfView({ lat: center.lat, lng: center.lng, altitude: 1.6 }, 1000);
}

function initGlobe(features) {
  countries = features;
  globe = Globe()(document.getElementById('globeViz'))
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#56ccf2')
    .atmosphereAltitude(0.18)
    .lineHoverPrecision(0.2)
    .polygonsTransitionDuration(260)
    .onPolygonClick(selectCountry)
    .onPolygonHover((feature) => {
      if (feature) {
        floatingInfo.textContent = `${getCountryName(feature)} • score ${getScore(feature) ?? 'N/A'} (${categorySelect.value})`;
        return;
      }

      if (selectedCountryCode) {
        const selectedName = dataset[selectedCountryCode]?.name || selectedCountryCode;
        floatingInfo.textContent = `${selectedName} sélectionné`;
      } else {
        floatingInfo.textContent = 'Cliquez sur un pays pour afficher ses données.';
      }
    });

  refreshGlobeStyles();
  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);
}

async function loadWorldCountries() {
  const response = await fetch('https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson');
  if (!response.ok) {
    throw new Error(`Erreur chargement carte: ${response.status}`);
  }

  const geo = await response.json();
  return geo.features;
}

async function boot() {
  const [countriesData, countriesDetails] = await Promise.all([
    loadWorldCountries(),
    fetch('data/countryData.json').then((res) => {
      if (!res.ok) throw new Error(`Erreur chargement dataset: ${res.status}`);
      return res.json();
    })
  ]);

  dataset = countriesDetails;
  initGlobe(countriesData);

  const defaultFeature = countriesData.find((feature) => getCountryCode(feature) === 'FRA');
  if (defaultFeature) {
    selectCountry(defaultFeature);
  } else {
    floatingInfo.textContent = 'Cliquez sur un pays pour afficher ses données.';
  }
}

categorySelect.addEventListener('change', () => {
  refreshGlobeStyles();
  if (selectedFeature) {
    updateDetails(selectedCountryCode);
  }
});

boot().catch((error) => {
  console.error(error);
  floatingInfo.textContent = 'Erreur de chargement du globe.';
  detailsPanel.querySelector('h2').textContent = 'Erreur';
  detailsPanel.querySelector('.subtitle').textContent = 'Vérifiez votre connexion réseau.';
  detailsCards.innerHTML = `
    <article class="card">
      <span class="label">Détail</span>
      <span class="value">${error.message}</span>
    </article>
  `;
});
