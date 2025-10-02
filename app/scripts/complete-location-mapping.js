#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour créer un mapping complet automatique
 */

const LOCATION_CSV = path.join(__dirname, '../src/assets/data/location.csv');

// Mapping simple : si on ne trouve pas dans les mappings complexes, on utilise le pays entier
const COUNTRY_FALLBACKS = {
  'AFG': 'Afghanistan',
  'AGE': 'Argentina', 'AGW': 'Argentina',
  'ALG': 'Algeria',
  'AND': 'India', // Andaman Islands -> India
  'ANG': 'Angola',
  'ASS': 'India', // Assam -> India
  'BAH': 'Bahamas',
  'BAL': 'Spain', // Balearic Islands -> Spain
  'BAN': 'Bangladesh',
  'BEN': 'Benin',
  'BER': 'Bermuda',
  'BIS': 'Guinea-Bissau',
  'BKN': 'Brunei',
  'BLZ': 'Belize',
  'BOL': 'Bolivia',
  'BOR': 'Malaysia', // Borneo -> Malaysia (majority)
  'BOT': 'Botswana',
  'BRA': 'Brazil', 'BZC': 'Brazil', 'BZE': 'Brazil', 'BZL': 'Brazil', 'BZN': 'Brazil', 'BZS': 'Brazil', 'JNF': 'Brazil', 'NAT': 'Brazil',
  'BUR': 'Myanmar',
  'CAB': 'Angola', // Cabinda -> Angola
  'CAF': 'Central African Republic',
  'CAM': 'Cambodia', 'CBD': 'Cambodia',
  'CAN': 'Canada', 'CNY': 'Canada',
  'CAR': 'Cuba', // Caribbean -> Cuba (main)
  'CAS': 'Australia', 'CTC': 'Australia', 'NSW': 'Australia', 'NTA': 'Australia', 'NWC': 'Australia', 'NWG': 'Australia', 'QLD': 'Australia', 'QUE': 'Australia', 'TAS': 'Australia', 'VIC': 'Australia', 'WAL': 'Australia', 'WAS': 'Australia', 'WAU': 'Australia',
  'CAY': 'Cayman Islands',
  'CEL': 'Indonesia', 'SUL': 'Indonesia', // Celebes/Sulawesi -> Indonesia
  'CHA': 'Chad',
  'CHC': 'Chile', 'CHI': 'Chile', 'CHT': 'Chile', 'CPP': 'Chile',
  'CHH': 'China', 'CHN': 'China', 'CHS': 'China',
  'CLC': 'Colombia', 'CLM': 'Colombia', 'COL': 'Colombia', 'CPI': 'Colombia', 'CRL': 'Colombia',
  'CMN': 'Cameroon',
  'COM': 'Comoros',
  'CON': 'Democratic Republic of the Congo', 'ZAI': 'Democratic Republic of the Congo',
  'COO': 'Cook Islands',
  'COR': 'Costa Rica', 'COS': 'Costa Rica',
  'CPV': 'Cape Verde', 'CVI': 'Cape Verde',
  'CTM': 'Guatemala',
  'CUB': 'Cuba',
  'DJI': 'Djibouti',
  'DOM': 'Dominican Republic',
  'EAI': 'Ecuador', 'ECU': 'Ecuador',
  'EGY': 'Egypt',
  'EHM': 'Bahamas',
  'ELS': 'El Salvador', 'ESA': 'El Salvador',
  'EQG': 'Equatorial Guinea',
  'ERI': 'Eritrea',
  'ETH': 'Ethiopia',
  'FIJ': 'Fiji',
  'FOR': 'Taiwan', 'TAI': 'Taiwan',
  'FRA': 'France',
  'FRG': 'French Guiana',
  'GAB': 'Gabon',
  'GAM': 'Gambia',
  'GEO': 'Georgia', 'GGI': 'Georgia',
  'GHA': 'Ghana',
  'GNB': 'Guinea-Bissau',
  'GUA': 'Guatemala',
  'GUF': 'French Guiana',
  'GUI': 'Guinea',
  'GUY': 'Guyana',
  'HAI': 'Haiti',
  'HON': 'Honduras',
  'IND': 'India',
  'IRN': 'Iran',
  'IRQ': 'Iraq',
  'ITA': 'Italy', 'SIC': 'Italy', // Sicily -> Italy
  'IVO': 'Ivory Coast',
  'JAM': 'Jamaica',
  'JAP': 'Japan',
  'JAV': 'Indonesia', 'JAW': 'Indonesia', 'MOL': 'Indonesia', 'SUM': 'Indonesia', // Java, Moluccas, Sumatra -> Indonesia
  'KEN': 'Kenya',
  'KER': 'French Southern Territories',
  'KRI': 'Kiribati',
  'LAO': 'Laos',
  'LBR': 'Liberia',
  'LBY': 'Libya',
  'LEE': 'United States Virgin Islands',
  'LSI': 'Saint Lucia',
  'MAD': 'Madagascar', 'MDG': 'Madagascar',
  'MAL': 'Malaysia', 'MLY': 'Malaysia', 'SAR': 'Malaysia', // Malaysia, Sarawak
  'MAU': 'Mauritania', 'MTN': 'Mauritania',
  'MCI': 'Mexico', 'MEX': 'Mexico', 'MXC': 'Mexico', 'MXE': 'Mexico', 'MXG': 'Mexico', 'MXI': 'Mexico', 'MXN': 'Mexico', 'MXS': 'Mexico', 'MXT': 'Mexico',
  'MLI': 'Mali',
  'MLW': 'Malawi',
  'MOR': 'Morocco',
  'MOZ': 'Mozambique',
  'MRN': 'Martinique', 'MRQ': 'Martinique',
  'MYA': 'Myanmar',
  'NAM': 'Namibia',
  'NAN': 'Vanuatu', 'VAN': 'Vanuatu',
  'NCA': 'New Caledonia', 'NCB': 'New Caledonia', 'NCL': 'New Caledonia',
  'NEP': 'Nepal',
  'NFK': 'Norfolk Island',
  'NGA': 'Nigeria', 'NGR': 'Nigeria',
  'NGU': 'Papua New Guinea',
  'NIC': 'Nicaragua',
  'NIG': 'Niger',
  'NNS': 'Saint Kitts and Nevis',
  'NZN': 'New Zealand', 'NZS': 'New Zealand',
  'PAK': 'Pakistan',
  'PAL': 'Palau',
  'PAN': 'Panama',
  'PAR': 'Paraguay',
  'PER': 'Peru',
  'PHI': 'Philippines',
  'POR': 'Portugal',
  'PRI': 'Puerto Rico', 'PUE': 'Puerto Rico',
  'REU': 'Réunion',
  'ROD': 'Mauritius',
  'RWA': 'Rwanda',
  'SAM': 'Samoa',
  'SAU': 'Saudi Arabia',
  'SCZ': 'Seychelles', 'SEY': 'Seychelles',
  'SEN': 'Senegal',
  'SIE': 'Sierra Leone',
  'SIN': 'Singapore',
  'SOA': 'South Africa',
  'SOL': 'Solomon Islands',
  'SOM': 'Somalia',
  'SPA': 'Spain',
  'SRI': 'Sri Lanka', 'SRL': 'Sri Lanka',
  'SUD': 'Sudan',
  'SUR': 'Suriname',
  'SWC': 'Eswatini', 'SWZ': 'Eswatini',
  'TAN': 'Tanzania',
  'TCI': 'Turks and Caicos Islands',
  'THA': 'Thailand',
  'TOG': 'Togo',
  'TOK': 'Tokelau',
  'TON': 'Tonga',
  'TRI': 'Trinidad and Tobago', 'TRT': 'Trinidad and Tobago',
  'TUA': 'Tuvalu', 'TVL': 'Tuvalu',
  'TUN': 'Tunisia',
  'TUR': 'Turkey',
  'UGA': 'Uganda',
  'URU': 'Uruguay',
  'VEN': 'Venezuela',
  'VIE': 'Vietnam', 'VNA': 'Vietnam',
  'WHM': 'Bahamas',
  'WIN': 'Saint Vincent and the Grenadines',
  'XMS': 'Christmas Island',
  'YEM': 'Yemen',
  'ZAM': 'Zambia',
  'ZIM': 'Zimbabwe'
};

// États américains
const US_STATES = {
  'ALA': 'Alabama',
  'ARI': 'Arizona', 
  'ARK': 'Arkansas',
  'CAL': 'California',
  'FLA': 'Florida',
  'GST': 'Georgia',
  'HAW': 'Hawaii',
  'LOU': 'Louisiana',
  'MSI': 'Mississippi',
  'OGA': 'Georgia',
  'OKL': 'Oklahoma',
  'OMA': 'Oklahoma',
  'SCA': 'South Carolina',
  'TEX': 'Texas'
};

async function generateCompleteMapping() {
  console.log('🔄 Generating complete location mapping...\n');
  
  // Lire tous les codes du CSV
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
  
  console.log(`📊 Found ${usedLocations.size} unique locations in CSV`);
  
  // Générer le mapping complet
  const mappingLines = [];
  let countryCount = 0;
  let stateCount = 0;
  let missingCount = 0;
  
  mappingLines.push('const LOCATION_MAPPINGS = {');
  
  for (const locationCode of Array.from(usedLocations).sort()) {
    if (US_STATES[locationCode]) {
      mappingLines.push(`  '${locationCode}': { type: 'us_state', names: ['${US_STATES[locationCode]}'] },`);
      stateCount++;
    } else if (COUNTRY_FALLBACKS[locationCode]) {
      mappingLines.push(`  '${locationCode}': { type: 'country', names: ['${COUNTRY_FALLBACKS[locationCode]}'] },`);
      countryCount++;
    } else {
      mappingLines.push(`  // '${locationCode}': { type: 'country', names: ['UNKNOWN'] }, // TODO: Define mapping`);
      missingCount++;
    }
  }
  
  mappingLines.push('};');
  
  console.log(`✅ Mapping generated:`);
  console.log(`   🌍 Countries: ${countryCount}`);
  console.log(`   🇺🇸 US States: ${stateCount}`);
  console.log(`   ❓ Missing: ${missingCount}`);
  console.log(`   📝 Total: ${countryCount + stateCount}`);
  
  // Écrire le mapping dans le fichier
  const mappingContent = mappingLines.join('\n');
  console.log(`\n📝 Generated mapping:\n${mappingContent}`);
  
  return { countryCount, stateCount, missingCount };
}

generateCompleteMapping().catch(console.error);