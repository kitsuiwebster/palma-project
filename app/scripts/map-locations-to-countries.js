#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour mapper les codes location.csv aux GeoJSON de pays
 */

const LOCATION_CSV = path.join(__dirname, '../src/assets/data/location.csv');
const COUNTRIES_DIR = path.join(__dirname, '../src/assets/data/countries');

// Mapping des codes location.csv vers les codes ISO des pays
const LOCATION_TO_COUNTRY = {
  'AFG': 'AFG', // Afghanistan
  'AGE': 'ARG', // Argentina (Est)
  'AGW': 'ARG', // Argentina (Ouest) 
  'ALA': 'USA', // Alabama, USA
  'ALG': 'DZA', // Algeria
  'AND': 'IND', // Andaman Islands, India
  'ANG': 'AGO', // Angola
  'ARI': 'USA', // Arizona, USA
  'ARK': 'USA', // Arkansas, USA
  'ASS': 'IND', // Assam, India
  'BAH': 'BHS', // Bahamas
  'BAL': 'ESP', // Balearic Islands, Spain
  'BAN': 'BGD', // Bangladesh
  'BEN': 'BEN', // Benin
  'BER': 'BMU', // Bermuda
  'BIS': 'GNB', // Guinea-Bissau
  'BKN': 'BRN', // Brunei (Borneo Kalimantan Nord)
  'BLZ': 'BLZ', // Belize
  'BOL': 'BOL', // Bolivia
  'BOR': 'MYS', // Borneo (Malaysia)
  'BOT': 'BWA', // Botswana
  'BRA': 'BRA', // Brazil
  'BUR': 'MMR', // Burma/Myanmar
  'BZC': 'BRA', // Brazil Central
  'BZE': 'BRA', // Brazil Est
  'BZL': 'BRA', // Brazil
  'BZN': 'BRA', // Brazil Nord
  'BZS': 'BRA', // Brazil Sud
  'CAB': 'AGO', // Cabinda, Angola
  'CAF': 'CAF', // Central African Republic
  'CAL': 'USA', // California, USA
  'CAM': 'KHM', // Cambodia
  'CAN': 'CAN', // Canada
  'CAR': 'CUB', // Cuba (Caribbean)
  'CAS': 'AUS', // Australia (Cassowary Coast)
  'CAY': 'CYM', // Cayman Islands
  'CBD': 'KHM', // Cambodia
  'CEL': 'IDN', // Celebes/Sulawesi, Indonesia
  'CHA': 'TCD', // Chad
  'CHC': 'CHL', // Chile Central
  'CHH': 'CHN', // China
  'CHI': 'CHL', // Chile
  'CHN': 'CHN', // China Nord
  'CHS': 'CHN', // China Sud
  'CHT': 'CHL', // Chile
  'CLC': 'COL', // Colombia Central
  'CLM': 'COL', // Colombia
  'CMN': 'CMR', // Cameroon
  'CNY': 'CAN', // Canada
  'COL': 'COL', // Colombia
  'COM': 'COM', // Comoros
  'CON': 'COD', // Congo (DRC)
  'COO': 'COK', // Cook Islands
  'COR': 'CRI', // Costa Rica
  'COS': 'CRI', // Costa Rica
  'CPI': 'COL', // Colombia Pacific
  'CPP': 'CHL', // Chile Pacific
  'CPV': 'CPV', // Cape Verde
  'CRL': 'COL', // Colombia
  'CTC': 'AUS', // Australia Central
  'CTM': 'GTM', // Guatemala Central
  'CUB': 'CUB', // Cuba
  'CVI': 'CPV', // Cape Verde Islands
  'DJI': 'DJI', // Djibouti
  'DOM': 'DOM', // Dominican Republic
  'EAI': 'ECU', // Ecuador
  'ECU': 'ECU', // Ecuador
  'EGY': 'EGY', // Egypt
  'EHM': 'BHS', // Bahamas (Eleuthera)
  'ELS': 'SLV', // El Salvador
  'EQG': 'GNQ', // Equatorial Guinea
  'ERI': 'ERI', // Eritrea
  'ESA': 'SLV', // El Salvador
  'ETH': 'ETH', // Ethiopia
  'FIJ': 'FJI', // Fiji
  'FLA': 'USA', // Florida, USA
  'FOR': 'TWN', // Formosa/Taiwan
  'FRA': 'FRA', // France
  'FRG': 'GUF', // French Guiana
  'GAB': 'GAB', // Gabon
  'GAM': 'GMB', // Gambia
  'GEO': 'GEO', // Georgia
  'GGI': 'GEO', // Georgia
  'GHA': 'GHA', // Ghana
  'GNB': 'GNB', // Guinea-Bissau
  'GST': 'USA', // Georgia, USA
  'GUA': 'GTM', // Guatemala
  'GUF': 'GUF', // French Guiana
  'GUI': 'GIN', // Guinea
  'GUY': 'GUY', // Guyana
  'HAI': 'HTI', // Haiti
  'HAW': 'USA', // Hawaii, USA
  'HON': 'HND', // Honduras
  'IND': 'IND', // India
  'IRN': 'IRN', // Iran
  'IRQ': 'IRQ', // Iraq
  'ITA': 'ITA', // Italy
  'IVO': 'CIV', // Ivory Coast
  'JAM': 'JAM', // Jamaica
  'JAP': 'JPN', // Japan
  'JAV': 'IDN', // Java, Indonesia
  'JAW': 'IDN', // Java West, Indonesia
  'JNF': 'BRA', // Brazil (Janua)
  'KEN': 'KEN', // Kenya
  'KER': 'ATF', // Kerguelen Islands
  'KRI': 'KIR', // Kiribati
  'LAO': 'LAO', // Laos
  'LBR': 'LBR', // Liberia
  'LBY': 'LBY', // Libya
  'LEE': 'VIR', // US Virgin Islands (St. Croix)
  'LOU': 'USA', // Louisiana, USA
  'LSI': 'LCA', // Saint Lucia
  'MAD': 'MDG', // Madagascar
  'MAL': 'MYS', // Malaysia/Malaisie
  'MAU': 'MRT', // Mauritania
  'MCI': 'MEX', // Mexico Central
  'MDG': 'MDG', // Madagascar
  'MEX': 'MEX', // Mexico
  'MLI': 'MLI', // Mali
  'MLW': 'MWI', // Malawi
  'MLY': 'MYS', // Malaysia
  'MOL': 'IDN', // Moluccas, Indonesia
  'MOR': 'MAR', // Morocco
  'MOZ': 'MOZ', // Mozambique
  'MRN': 'MTQ', // Martinique
  'MRQ': 'MTQ', // Martinique
  'MSI': 'USA', // Mississippi, USA
  'MTN': 'MRT', // Mauritania
  'MXC': 'MEX', // Mexico Central
  'MXE': 'MEX', // Mexico Est
  'MXG': 'MEX', // Mexico Gulf
  'MXI': 'MEX', // Mexico
  'MXN': 'MEX', // Mexico Nord
  'MXS': 'MEX', // Mexico Sud
  'MXT': 'MEX', // Mexico
  'MYA': 'MMR', // Myanmar
  'NAM': 'NAM', // Namibia
  'NAN': 'VUT', // Vanuatu (New Hebrides)
  'NAT': 'BRA', // Brazil (Natal)
  'NCA': 'NCL', // New Caledonia
  'NCB': 'NCL', // New Caledonia
  'NCL': 'NCL', // New Caledonia
  'NEP': 'NPL', // Nepal
  'NFK': 'NFK', // Norfolk Island
  'NGA': 'NGA', // Nigeria
  'NGR': 'NGA', // Nigeria
  'NGU': 'PNG', // New Guinea/Papua New Guinea
  'NIC': 'NIC', // Nicaragua
  'NIG': 'NER', // Niger
  'NNS': 'KNA', // Saint Kitts and Nevis
  'NSW': 'AUS', // New South Wales, Australia
  'NTA': 'AUS', // Northern Territory, Australia
  'NWC': 'AUS', // Northwest Australia
  'NWG': 'AUS', // Northern Australia
  'NZN': 'NZL', // New Zealand Nord
  'NZS': 'NZL', // New Zealand Sud
  'OGA': 'USA', // Georgia, USA
  'OKL': 'USA', // Oklahoma, USA
  'OMA': 'USA', // Oklahoma, USA
  'PAK': 'PAK', // Pakistan
  'PAL': 'PLW', // Palau
  'PAN': 'PAN', // Panama
  'PAR': 'PRY', // Paraguay
  'PER': 'PER', // Peru
  'PHI': 'PHL', // Philippines
  'POR': 'PRT', // Portugal
  'PRI': 'PRI', // Puerto Rico
  'PUE': 'PRI', // Puerto Rico
  'QLD': 'AUS', // Queensland, Australia
  'QUE': 'AUS', // Queensland, Australia
  'REU': 'REU', // Réunion
  'ROD': 'MUS', // Rodrigues, Mauritius
  'RWA': 'RWA', // Rwanda
  'SAM': 'WSM', // Samoa
  'SAR': 'MYS', // Sarawak, Malaysia
  'SAU': 'SAU', // Saudi Arabia
  'SCA': 'USA', // South Carolina, USA
  'SCZ': 'SYC', // Seychelles
  'SEN': 'SEN', // Senegal
  'SEY': 'SYC', // Seychelles
  'SIC': 'ITA', // Sicily, Italy
  'SIE': 'SLE', // Sierra Leone
  'SIN': 'SGP', // Singapore
  'SOA': 'ZAF', // South Africa
  'SOL': 'SLB', // Solomon Islands
  'SOM': 'SOM', // Somalia
  'SPA': 'ESP', // Spain
  'SRI': 'LKA', // Sri Lanka
  'SRL': 'LKA', // Sri Lanka
  'SUD': 'SDN', // Sudan
  'SUL': 'IDN', // Sulawesi, Indonesia
  'SUM': 'IDN', // Sumatra, Indonesia
  'SUR': 'SUR', // Suriname
  'SWC': 'SWZ', // Swaziland/Eswatini
  'SWZ': 'SWZ', // Swaziland/Eswatini
  'TAI': 'TWN', // Taiwan
  'TAN': 'TZA', // Tanzania
  'TAS': 'AUS', // Tasmania, Australia
  'TCI': 'TCA', // Turks and Caicos
  'TEX': 'USA', // Texas, USA
  'THA': 'THA', // Thailand
  'TOG': 'TGO', // Togo
  'TOK': 'TKL', // Tokelau
  'TON': 'TON', // Tonga
  'TRI': 'TTO', // Trinidad and Tobago
  'TRT': 'TTO', // Trinidad and Tobago
  'TUA': 'TUV', // Tuvalu
  'TUN': 'TUN', // Tunisia
  'TUR': 'TUR', // Turkey
  'TVL': 'TUV', // Tuvalu
  'UGA': 'UGA', // Uganda
  'URU': 'URY', // Uruguay
  'VAN': 'VUT', // Vanuatu
  'VEN': 'VEN', // Venezuela
  'VIC': 'AUS', // Victoria, Australia
  'VIE': 'VNM', // Vietnam
  'VNA': 'VNM', // Vietnam
  'WAL': 'AUS', // Western Australia
  'WAS': 'AUS', // Western Australia
  'WAU': 'AUS', // Western Australia
  'WHM': 'BHS', // Bahamas
  'WIN': 'VCT', // Saint Vincent and the Grenadines
  'XMS': 'CXR', // Christmas Island
  'YEM': 'YEM', // Yemen
  'ZAI': 'COD', // Zaire (DRC)
  'ZAM': 'ZMB', // Zambia
  'ZIM': 'ZWE', // Zimbabwe
};

async function analyzeLocationMapping() {
  console.log('🗺️  Analyzing location.csv to country mapping...\n');
  
  // Lire le CSV
  const csvContent = fs.readFileSync(LOCATION_CSV, 'utf8');
  const lines = csvContent.split('\n');
  const locations = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const [locationCode] = line.split(',');
      if (locationCode && locationCode !== 'Area_code_L3') {
        locations.add(locationCode);
      }
    }
  }
  
  console.log(`📊 Found ${locations.size} unique location codes in CSV`);
  
  // Vérifier le mapping
  const mapped = [];
  const unmapped = [];
  
  for (const location of locations) {
    if (LOCATION_TO_COUNTRY[location]) {
      const countryCode = LOCATION_TO_COUNTRY[location];
      const geojsonFile = path.join(COUNTRIES_DIR, `${countryCode.toLowerCase()}.json`);
      
      if (fs.existsSync(geojsonFile)) {
        mapped.push({ location, country: countryCode, exists: true });
      } else {
        mapped.push({ location, country: countryCode, exists: false });
      }
    } else {
      unmapped.push(location);
    }
  }
  
  console.log(`\n✅ Mapped locations: ${mapped.length}`);
  console.log(`❌ Unmapped locations: ${unmapped.length}`);
  
  if (unmapped.length > 0) {
    console.log(`\n🔍 Unmapped location codes:`);
    unmapped.forEach(code => console.log(`   - ${code}`));
  }
  
  const missingGeoJSON = mapped.filter(m => !m.exists);
  if (missingGeoJSON.length > 0) {
    console.log(`\n📁 Missing GeoJSON files:`);
    missingGeoJSON.forEach(m => console.log(`   - ${m.location} → ${m.country} (${m.country.toLowerCase()}.json)`));
  }
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total locations: ${locations.size}`);
  console.log(`   Successfully mapped: ${mapped.filter(m => m.exists).length}`);
  console.log(`   Need GeoJSON creation: ${missingGeoJSON.length}`);
  console.log(`   Need location mapping: ${unmapped.length}`);
}

analyzeLocationMapping().catch(console.error);