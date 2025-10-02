#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour créer des VRAIS GeoJSON avec les vraies frontières
 */

const LOCATION_CSV = path.join(__dirname, '../src/assets/data/location.csv');
const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

// URLs pour récupérer les vraies géométries
const WORLD_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const US_STATES_URL = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

// Mapping complet des codes vers les noms réels dans les GeoJSON - TOUS LES 198 CODES
const LOCATION_MAPPINGS = {
  'AFG': { type: 'country', names: ['Afghanistan'] },
  'AGE': { type: 'country', names: ['Argentina'] },
  'AGW': { type: 'country', names: ['Argentina'] },
  'ALA': { type: 'us_state', names: ['Alabama'] },
  'ALG': { type: 'country', names: ['Algeria'] },
  'AND': { type: 'country', names: ['India'] },
  'ANG': { type: 'country', names: ['Angola'] },
  'ARI': { type: 'us_state', names: ['Arizona'] },
  'ARK': { type: 'us_state', names: ['Arkansas'] },
  'ASS': { type: 'country', names: ['India'] },
  'BAH': { type: 'country', names: ['Bahamas'] },
  'BAL': { type: 'country', names: ['Spain'] },
  'BAN': { type: 'country', names: ['Bangladesh'] },
  'BEN': { type: 'country', names: ['Benin'] },
  'BER': { type: 'country', names: ['Bermuda'] },
  'BIS': { type: 'country', names: ['Guinea-Bissau'] },
  'BKN': { type: 'country', names: ['Brunei'] },
  'BLZ': { type: 'country', names: ['Belize'] },
  'BOL': { type: 'country', names: ['Bolivia'] },
  'BOR': { type: 'country', names: ['Malaysia'] },
  'BOT': { type: 'country', names: ['Botswana'] },
  'BUR': { type: 'country', names: ['Myanmar'] },
  'BZC': { type: 'country', names: ['Brazil'] },
  'BZE': { type: 'country', names: ['Brazil'] },
  'BZL': { type: 'country', names: ['Brazil'] },
  'BZN': { type: 'country', names: ['Brazil'] },
  'BZS': { type: 'country', names: ['Brazil'] },
  'CAB': { type: 'country', names: ['Angola'] },
  'CAF': { type: 'country', names: ['Central African Republic'] },
  'CAL': { type: 'us_state', names: ['California'] },
  'CAY': { type: 'country', names: ['Cayman Islands'] },
  'CBD': { type: 'country', names: ['Cambodia'] },
  'CHA': { type: 'country', names: ['Chad'] },
  'CHC': { type: 'country', names: ['Chile'] },
  'CHH': { type: 'country', names: ['China'] },
  'CHS': { type: 'country', names: ['China'] },
  'CHT': { type: 'country', names: ['Chile'] },
  'CLC': { type: 'country', names: ['Colombia'] },
  'CLM': { type: 'country', names: ['Colombia'] },
  'CMN': { type: 'country', names: ['Cameroon'] },
  'CNY': { type: 'country', names: ['Canada'] },
  'COM': { type: 'country', names: ['Comoros'] },
  'CON': { type: 'country', names: ['Democratic Republic of the Congo', 'Dem. Rep. Congo'] },
  'COO': { type: 'country', names: ['Cook Islands'] },
  'COS': { type: 'country', names: ['Costa Rica'] },
  'CPI': { type: 'country', names: ['Colombia'] },
  'CPP': { type: 'country', names: ['Chile'] },
  'CPV': { type: 'country', names: ['Cape Verde'] },
  'CRL': { type: 'country', names: ['Colombia'] },
  'CTM': { type: 'country', names: ['Guatemala'] },
  'CUB': { type: 'country', names: ['Cuba'] },
  'CVI': { type: 'country', names: ['Cape Verde'] },
  'DJI': { type: 'country', names: ['Djibouti'] },
  'DOM': { type: 'country', names: ['Dominican Republic'] },
  'EAI': { type: 'country', names: ['Ecuador'] },
  'ECU': { type: 'country', names: ['Ecuador'] },
  'EGY': { type: 'country', names: ['Egypt'] },
  'EHM': { type: 'country', names: ['Bahamas'] },
  'ELS': { type: 'country', names: ['El Salvador'] },
  'EQG': { type: 'country', names: ['Equatorial Guinea'] },
  'ERI': { type: 'country', names: ['Eritrea'] },
  'ETH': { type: 'country', names: ['Ethiopia'] },
  'FIJ': { type: 'country', names: ['Fiji'] },
  'FLA': { type: 'us_state', names: ['Florida'] },
  'FRA': { type: 'country', names: ['France'] },
  'FRG': { type: 'country', names: ['French Guiana'] },
  'GAB': { type: 'country', names: ['Gabon'] },
  'GAM': { type: 'country', names: ['Gambia'] },
  'GEO': { type: 'country', names: ['Georgia'] },
  'GGI': { type: 'country', names: ['Georgia'] },
  'GHA': { type: 'country', names: ['Ghana'] },
  'GNB': { type: 'country', names: ['Guinea-Bissau'] },
  'GST': { type: 'us_state', names: ['Georgia'] },
  'GUA': { type: 'country', names: ['Guatemala'] },
  'GUI': { type: 'country', names: ['Guinea'] },
  'GUY': { type: 'country', names: ['Guyana'] },
  'HAI': { type: 'country', names: ['Haiti'] },
  'HAW': { type: 'us_state', names: ['Hawaii'] },
  'HON': { type: 'country', names: ['Honduras'] },
  'IND': { type: 'country', names: ['India'] },
  'IRN': { type: 'country', names: ['Iran'] },
  'IRQ': { type: 'country', names: ['Iraq'] },
  'ITA': { type: 'country', names: ['Italy'] },
  'IVO': { type: 'country', names: ['Ivory Coast', "Côte d'Ivoire"] },
  'JAM': { type: 'country', names: ['Jamaica'] },
  'JAP': { type: 'country', names: ['Japan'] },
  'JAW': { type: 'country', names: ['Indonesia'] },
  'JNF': { type: 'country', names: ['Brazil'] },
  'KEN': { type: 'country', names: ['Kenya'] },
  'KER': { type: 'country', names: ['French Southern Territories'] },
  'KRI': { type: 'country', names: ['Kiribati'] },
  'LAO': { type: 'country', names: ['Laos'] },
  'LBR': { type: 'country', names: ['Liberia'] },
  'LBY': { type: 'country', names: ['Libya'] },
  'LEE': { type: 'country', names: ['United States Virgin Islands'] },
  'LOU': { type: 'us_state', names: ['Louisiana'] },
  'LSI': { type: 'country', names: ['Saint Lucia'] },
  'MAU': { type: 'country', names: ['Mauritania'] },
  'MCI': { type: 'country', names: ['Mexico'] },
  'MDG': { type: 'country', names: ['Madagascar'] },
  'MLI': { type: 'country', names: ['Mali'] },
  'MLW': { type: 'country', names: ['Malawi'] },
  'MLY': { type: 'country', names: ['Malaysia'] },
  'MOL': { type: 'country', names: ['Indonesia'] },
  'MOR': { type: 'country', names: ['Morocco'] },
  'MOZ': { type: 'country', names: ['Mozambique'] },
  'MRN': { type: 'country', names: ['Martinique'] },
  'MRQ': { type: 'country', names: ['Martinique'] },
  'MSI': { type: 'us_state', names: ['Mississippi'] },
  'MTN': { type: 'country', names: ['Mauritania'] },
  'MXC': { type: 'country', names: ['Mexico'] },
  'MXE': { type: 'country', names: ['Mexico'] },
  'MXG': { type: 'country', names: ['Mexico'] },
  'MXI': { type: 'country', names: ['Mexico'] },
  'MXN': { type: 'country', names: ['Mexico'] },
  'MXS': { type: 'country', names: ['Mexico'] },
  'MXT': { type: 'country', names: ['Mexico'] },
  'MYA': { type: 'country', names: ['Myanmar'] },
  'NAM': { type: 'country', names: ['Namibia'] },
  'NAT': { type: 'country', names: ['Brazil'] },
  'NCA': { type: 'country', names: ['New Caledonia'] },
  'NCB': { type: 'country', names: ['New Caledonia'] },
  'NEP': { type: 'country', names: ['Nepal'] },
  'NFK': { type: 'country', names: ['Norfolk Island'] },
  'NGA': { type: 'country', names: ['Nigeria'] },
  'NGR': { type: 'country', names: ['Nigeria'] },
  'NIC': { type: 'country', names: ['Nicaragua'] },
  'NNS': { type: 'country', names: ['Saint Kitts and Nevis'] },
  'NSW': { type: 'country', names: ['Australia'] },
  'NTA': { type: 'country', names: ['Australia'] },
  'NWC': { type: 'country', names: ['Australia'] },
  'NWG': { type: 'country', names: ['Australia'] },
  'NZN': { type: 'country', names: ['New Zealand'] },
  'NZS': { type: 'country', names: ['New Zealand'] },
  'OGA': { type: 'us_state', names: ['Georgia'] },
  'OKL': { type: 'us_state', names: ['Oklahoma'] },
  'OMA': { type: 'us_state', names: ['Oklahoma'] },
  'PAK': { type: 'country', names: ['Pakistan'] },
  'PAL': { type: 'country', names: ['Palau'] },
  'PAN': { type: 'country', names: ['Panama'] },
  'PAR': { type: 'country', names: ['Paraguay'] },
  'PER': { type: 'country', names: ['Peru'] },
  'PHI': { type: 'country', names: ['Philippines'] },
  'POR': { type: 'country', names: ['Portugal'] },
  'PUE': { type: 'country', names: ['Puerto Rico'] },
  'QLD': { type: 'country', names: ['Australia'] },
  'REU': { type: 'country', names: ['Réunion'] },
  'ROD': { type: 'country', names: ['Mauritius'] },
  'RWA': { type: 'country', names: ['Rwanda'] },
  'SAM': { type: 'country', names: ['Samoa'] },
  'SAR': { type: 'country', names: ['Malaysia'] },
  'SAU': { type: 'country', names: ['Saudi Arabia'] },
  'SCA': { type: 'us_state', names: ['South Carolina'] },
  'SCZ': { type: 'country', names: ['Seychelles'] },
  'SEN': { type: 'country', names: ['Senegal'] },
  'SEY': { type: 'country', names: ['Seychelles'] },
  'SIC': { type: 'country', names: ['Italy'] },
  'SIE': { type: 'country', names: ['Sierra Leone'] },
  'SIN': { type: 'country', names: ['Singapore'] },
  'SOL': { type: 'country', names: ['Solomon Islands'] },
  'SOM': { type: 'country', names: ['Somalia'] },
  'SPA': { type: 'country', names: ['Spain'] },
  'SRL': { type: 'country', names: ['Sri Lanka'] },
  'SUD': { type: 'country', names: ['Sudan'] },
  'SUL': { type: 'country', names: ['Indonesia'] },
  'SUM': { type: 'country', names: ['Indonesia'] },
  'SUR': { type: 'country', names: ['Suriname'] },
  'SWC': { type: 'country', names: ['Eswatini'] },
  'SWZ': { type: 'country', names: ['Eswatini'] },
  'TAI': { type: 'country', names: ['Taiwan'] },
  'TAN': { type: 'country', names: ['Tanzania'] },
  'TCI': { type: 'country', names: ['Turks and Caicos Islands'] },
  'TEX': { type: 'us_state', names: ['Texas'] },
  'THA': { type: 'country', names: ['Thailand'] },
  'TOG': { type: 'country', names: ['Togo'] },
  'TOK': { type: 'country', names: ['Tokelau'] },
  'TON': { type: 'country', names: ['Tonga'] },
  'TRT': { type: 'country', names: ['Trinidad and Tobago'] },
  'TUA': { type: 'country', names: ['Tuvalu'] },
  'TUN': { type: 'country', names: ['Tunisia'] },
  'TUR': { type: 'country', names: ['Turkey'] },
  'TVL': { type: 'country', names: ['Tuvalu'] },
  'UGA': { type: 'country', names: ['Uganda'] },
  'URU': { type: 'country', names: ['Uruguay'] },
  'VAN': { type: 'country', names: ['Vanuatu'] },
  'VEN': { type: 'country', names: ['Venezuela'] },
  'VIC': { type: 'country', names: ['Australia'] },
  'VIE': { type: 'country', names: ['Vietnam'] },
  'VNA': { type: 'country', names: ['Vietnam'] },
  'WAL': { type: 'country', names: ['Australia'] },
  'WAU': { type: 'country', names: ['Australia'] },
  'WHM': { type: 'country', names: ['Bahamas'] },
  'WIN': { type: 'country', names: ['Saint Vincent and the Grenadines'] },
  'XMS': { type: 'country', names: ['Christmas Island'] },
  'YEM': { type: 'country', names: ['Yemen'] },
  'ZAI': { type: 'country', names: ['Democratic Republic of the Congo', 'Dem. Rep. Congo'] },
  'ZAM': { type: 'country', names: ['Zambia'] },
  'ZIM': { type: 'country', names: ['Zimbabwe'] }
};

async function downloadRealGeometries() {
  console.log('🌍 Downloading real world geometries...\n');
  
  // Télécharger les pays du monde
  console.log('📡 Fetching world countries...');
  const worldResponse = await fetch(WORLD_URL);
  const worldData = await worldResponse.json();
  console.log(`✅ Got ${worldData.features.length} countries`);
  
  // Télécharger les états américains
  console.log('📡 Fetching US states...');
  const usResponse = await fetch(US_STATES_URL);
  const usData = await usResponse.json();
  console.log(`✅ Got ${usData.features.length} US states`);
  
  return { worldData, usData };
}

function findGeometry(locationCode, mapping, worldData, usData) {
  if (!mapping) return null;
  
  let sourceData = mapping.type === 'us_state' ? usData : worldData;
  
  for (const searchName of mapping.names) {
    const feature = sourceData.features.find(f => {
      const props = f.properties;
      if (mapping.type === 'us_state') {
        return props.name?.toLowerCase() === searchName.toLowerCase();
      } else {
        return props.NAME?.toLowerCase() === searchName.toLowerCase() ||
               props.NAME_EN?.toLowerCase() === searchName.toLowerCase() ||
               props.ADMIN?.toLowerCase() === searchName.toLowerCase();
      }
    });
    
    if (feature) {
      return feature.geometry;
    }
  }
  
  return null;
}

async function createRealLocationGeoJSONs() {
  console.log('🗺️  Creating REAL location GeoJSONs with actual borders...\n');
  
  // Télécharger les données géographiques
  const { worldData, usData } = await downloadRealGeometries();
  
  // Créer le dossier locations
  if (!fs.existsSync(LOCATIONS_DIR)) {
    fs.mkdirSync(LOCATIONS_DIR, { recursive: true });
  }
  
  // Lire le CSV pour obtenir les locations utilisées
  const csvContent = fs.readFileSync(LOCATION_CSV, 'utf8');
  const lines = csvContent.split('\n');
  const usedLocations = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const [locationCode] = line.split(',');
      if (locationCode && locationCode !== 'Area_code_L3') {
        usedLocations.add(locationCode);
      }
    }
  }
  
  console.log(`📊 Processing ${usedLocations.size} locations from CSV\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const locationCode of usedLocations) {
    const filename = `${locationCode.toLowerCase()}.json`;
    const filepath = path.join(LOCATIONS_DIR, filename);
    
    const mapping = LOCATION_MAPPINGS[locationCode];
    
    if (!mapping) {
      console.log(`❌ ${locationCode}: No mapping defined`);
      failed++;
      continue;
    }
    
    const geometry = findGeometry(locationCode, mapping, worldData, usData);
    
    if (!geometry) {
      console.log(`❌ ${locationCode}: Geometry not found for ${mapping.names.join('/')}`);
      failed++;
      continue;
    }
    
    const geoJSON = {
      "type": "Feature",
      "properties": {
        "name": mapping.names[0],
        "locationCode": locationCode,
        "speciesCount": 0,
        "densityZone": "Palm Distribution Zone",
        "color": "#2d5a2d",
        "isPalmZone": true
      },
      "geometry": geometry
    };
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
      console.log(`✅ ${locationCode}: ${mapping.names[0]} (${mapping.type})`);
      success++;
    } catch (error) {
      console.log(`❌ ${locationCode}: Error saving - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n🎉 Real location GeoJSON creation complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Directory: ${LOCATIONS_DIR}`);
}

createRealLocationGeoJSONs().catch(console.error);