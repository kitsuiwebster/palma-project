#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour télécharger les GeoJSON de tous les pays du monde
 * Crée un dossier countries/ avec un fichier par pays
 */

const COUNTRIES_DIR = path.join(__dirname, '../src/assets/data/countries');

// Liste complète des pays et territoires avec leurs codes ISO
const WORLD_COUNTRIES = [
  // Pays souverains
  { name: 'Afghanistan', code: 'AFG' },
  { name: 'Albania', code: 'ALB' },
  { name: 'Algeria', code: 'DZA' },
  { name: 'Argentina', code: 'ARG' },
  { name: 'Armenia', code: 'ARM' },
  { name: 'Australia', code: 'AUS' },
  { name: 'Austria', code: 'AUT' },
  { name: 'Azerbaijan', code: 'AZE' },
  { name: 'Bahamas', code: 'BHS' },
  { name: 'Bahrain', code: 'BHR' },
  { name: 'Bangladesh', code: 'BGD' },
  { name: 'Barbados', code: 'BRB' },
  { name: 'Belarus', code: 'BLR' },
  { name: 'Belgium', code: 'BEL' },
  { name: 'Belize', code: 'BLZ' },
  { name: 'Benin', code: 'BEN' },
  { name: 'Bhutan', code: 'BTN' },
  { name: 'Bolivia', code: 'BOL' },
  { name: 'Bosnia and Herzegovina', code: 'BIH' },
  { name: 'Botswana', code: 'BWA' },
  { name: 'Brazil', code: 'BRA' },
  { name: 'Brunei', code: 'BRN' },
  { name: 'Bulgaria', code: 'BGR' },
  { name: 'Burkina Faso', code: 'BFA' },
  { name: 'Burundi', code: 'BDI' },
  { name: 'Cabo Verde', code: 'CPV' },
  { name: 'Cambodia', code: 'KHM' },
  { name: 'Cameroon', code: 'CMR' },
  { name: 'Canada', code: 'CAN' },
  { name: 'Central African Republic', code: 'CAF' },
  { name: 'Chad', code: 'TCD' },
  { name: 'Chile', code: 'CHL' },
  { name: 'China', code: 'CHN' },
  { name: 'Colombia', code: 'COL' },
  { name: 'Comoros', code: 'COM' },
  { name: 'Congo', code: 'COG' },
  { name: 'Democratic Republic of the Congo', code: 'COD' },
  { name: 'Costa Rica', code: 'CRI' },
  { name: 'Croatia', code: 'HRV' },
  { name: 'Cuba', code: 'CUB' },
  { name: 'Cyprus', code: 'CYP' },
  { name: 'Czech Republic', code: 'CZE' },
  { name: 'Denmark', code: 'DNK' },
  { name: 'Djibouti', code: 'DJI' },
  { name: 'Dominica', code: 'DMA' },
  { name: 'Dominican Republic', code: 'DOM' },
  { name: 'Ecuador', code: 'ECU' },
  { name: 'Egypt', code: 'EGY' },
  { name: 'El Salvador', code: 'SLV' },
  { name: 'Equatorial Guinea', code: 'GNQ' },
  { name: 'Eritrea', code: 'ERI' },
  { name: 'Estonia', code: 'EST' },
  { name: 'Eswatini', code: 'SWZ' },
  { name: 'Ethiopia', code: 'ETH' },
  { name: 'Fiji', code: 'FJI' },
  { name: 'Finland', code: 'FIN' },
  { name: 'France', code: 'FRA' },
  { name: 'Gabon', code: 'GAB' },
  { name: 'Gambia', code: 'GMB' },
  { name: 'Georgia', code: 'GEO' },
  { name: 'Germany', code: 'DEU' },
  { name: 'Ghana', code: 'GHA' },
  { name: 'Greece', code: 'GRC' },
  { name: 'Grenada', code: 'GRD' },
  { name: 'Guatemala', code: 'GTM' },
  { name: 'Guinea', code: 'GIN' },
  { name: 'Guinea-Bissau', code: 'GNB' },
  { name: 'Guyana', code: 'GUY' },
  { name: 'Haiti', code: 'HTI' },
  { name: 'Honduras', code: 'HND' },
  { name: 'Hungary', code: 'HUN' },
  { name: 'Iceland', code: 'ISL' },
  { name: 'India', code: 'IND' },
  { name: 'Indonesia', code: 'IDN' },
  { name: 'Iran', code: 'IRN' },
  { name: 'Iraq', code: 'IRQ' },
  { name: 'Ireland', code: 'IRL' },
  { name: 'Israel', code: 'ISR' },
  { name: 'Italy', code: 'ITA' },
  { name: 'Ivory Coast', code: 'CIV' },
  { name: 'Jamaica', code: 'JAM' },
  { name: 'Japan', code: 'JPN' },
  { name: 'Jordan', code: 'JOR' },
  { name: 'Kazakhstan', code: 'KAZ' },
  { name: 'Kenya', code: 'KEN' },
  { name: 'Kiribati', code: 'KIR' },
  { name: 'Kuwait', code: 'KWT' },
  { name: 'Kyrgyzstan', code: 'KGZ' },
  { name: 'Laos', code: 'LAO' },
  { name: 'Latvia', code: 'LVA' },
  { name: 'Lebanon', code: 'LBN' },
  { name: 'Lesotho', code: 'LSO' },
  { name: 'Liberia', code: 'LBR' },
  { name: 'Libya', code: 'LBY' },
  { name: 'Liechtenstein', code: 'LIE' },
  { name: 'Lithuania', code: 'LTU' },
  { name: 'Luxembourg', code: 'LUX' },
  { name: 'Madagascar', code: 'MDG' },
  { name: 'Malawi', code: 'MWI' },
  { name: 'Malaysia', code: 'MYS' },
  { name: 'Maldives', code: 'MDV' },
  { name: 'Mali', code: 'MLI' },
  { name: 'Malta', code: 'MLT' },
  { name: 'Marshall Islands', code: 'MHL' },
  { name: 'Mauritania', code: 'MRT' },
  { name: 'Mauritius', code: 'MUS' },
  { name: 'Mexico', code: 'MEX' },
  { name: 'Micronesia', code: 'FSM' },
  { name: 'Moldova', code: 'MDA' },
  { name: 'Monaco', code: 'MCO' },
  { name: 'Mongolia', code: 'MNG' },
  { name: 'Montenegro', code: 'MNE' },
  { name: 'Morocco', code: 'MAR' },
  { name: 'Mozambique', code: 'MOZ' },
  { name: 'Myanmar', code: 'MMR' },
  { name: 'Namibia', code: 'NAM' },
  { name: 'Nauru', code: 'NRU' },
  { name: 'Nepal', code: 'NPL' },
  { name: 'Netherlands', code: 'NLD' },
  { name: 'New Zealand', code: 'NZL' },
  { name: 'Nicaragua', code: 'NIC' },
  { name: 'Niger', code: 'NER' },
  { name: 'Nigeria', code: 'NGA' },
  { name: 'North Korea', code: 'PRK' },
  { name: 'North Macedonia', code: 'MKD' },
  { name: 'Norway', code: 'NOR' },
  { name: 'Oman', code: 'OMN' },
  { name: 'Pakistan', code: 'PAK' },
  { name: 'Palau', code: 'PLW' },
  { name: 'Panama', code: 'PAN' },
  { name: 'Papua New Guinea', code: 'PNG' },
  { name: 'Paraguay', code: 'PRY' },
  { name: 'Peru', code: 'PER' },
  { name: 'Philippines', code: 'PHL' },
  { name: 'Poland', code: 'POL' },
  { name: 'Portugal', code: 'PRT' },
  { name: 'Qatar', code: 'QAT' },
  { name: 'Romania', code: 'ROU' },
  { name: 'Russia', code: 'RUS' },
  { name: 'Rwanda', code: 'RWA' },
  { name: 'Saint Kitts and Nevis', code: 'KNA' },
  { name: 'Saint Lucia', code: 'LCA' },
  { name: 'Saint Vincent and the Grenadines', code: 'VCT' },
  { name: 'Samoa', code: 'WSM' },
  { name: 'San Marino', code: 'SMR' },
  { name: 'Sao Tome and Principe', code: 'STP' },
  { name: 'Saudi Arabia', code: 'SAU' },
  { name: 'Senegal', code: 'SEN' },
  { name: 'Serbia', code: 'SRB' },
  { name: 'Seychelles', code: 'SYC' },
  { name: 'Sierra Leone', code: 'SLE' },
  { name: 'Singapore', code: 'SGP' },
  { name: 'Slovakia', code: 'SVK' },
  { name: 'Slovenia', code: 'SVN' },
  { name: 'Solomon Islands', code: 'SLB' },
  { name: 'Somalia', code: 'SOM' },
  { name: 'South Africa', code: 'ZAF' },
  { name: 'South Korea', code: 'KOR' },
  { name: 'South Sudan', code: 'SSD' },
  { name: 'Spain', code: 'ESP' },
  { name: 'Sri Lanka', code: 'LKA' },
  { name: 'Sudan', code: 'SDN' },
  { name: 'Suriname', code: 'SUR' },
  { name: 'Sweden', code: 'SWE' },
  { name: 'Switzerland', code: 'CHE' },
  { name: 'Syria', code: 'SYR' },
  { name: 'Taiwan', code: 'TWN' },
  { name: 'Tajikistan', code: 'TJK' },
  { name: 'Tanzania', code: 'TZA' },
  { name: 'Thailand', code: 'THA' },
  { name: 'Timor-Leste', code: 'TLS' },
  { name: 'Togo', code: 'TGO' },
  { name: 'Tonga', code: 'TON' },
  { name: 'Trinidad and Tobago', code: 'TTO' },
  { name: 'Tunisia', code: 'TUN' },
  { name: 'Turkey', code: 'TUR' },
  { name: 'Turkmenistan', code: 'TKM' },
  { name: 'Tuvalu', code: 'TUV' },
  { name: 'Uganda', code: 'UGA' },
  { name: 'Ukraine', code: 'UKR' },
  { name: 'United Arab Emirates', code: 'ARE' },
  { name: 'United Kingdom', code: 'GBR' },
  { name: 'United States', code: 'USA' },
  { name: 'Uruguay', code: 'URY' },
  { name: 'Uzbekistan', code: 'UZB' },
  { name: 'Vanuatu', code: 'VUT' },
  { name: 'Vatican City', code: 'VAT' },
  { name: 'Venezuela', code: 'VEN' },
  { name: 'Vietnam', code: 'VNM' },
  { name: 'Yemen', code: 'YEM' },
  { name: 'Zambia', code: 'ZMB' },
  { name: 'Zimbabwe', code: 'ZWE' },
  
  // Territoires et dépendances
  { name: 'Puerto Rico', code: 'PRI' },
  { name: 'Guam', code: 'GUM' },
  { name: 'US Virgin Islands', code: 'VIR' },
  { name: 'American Samoa', code: 'ASM' },
  { name: 'Northern Mariana Islands', code: 'MNP' },
  { name: 'Guadeloupe', code: 'GLP' },
  { name: 'Martinique', code: 'MTQ' },
  { name: 'French Guiana', code: 'GUF' },
  { name: 'Réunion', code: 'REU' },
  { name: 'Mayotte', code: 'MYT' },
  { name: 'New Caledonia', code: 'NCL' },
  { name: 'French Polynesia', code: 'PYF' },
  { name: 'Saint Pierre and Miquelon', code: 'SPM' },
  { name: 'Wallis and Futuna', code: 'WLF' },
  { name: 'Saint Barthélemy', code: 'BLM' },
  { name: 'Saint Martin', code: 'MAF' },
  { name: 'British Virgin Islands', code: 'VGB' },
  { name: 'Cayman Islands', code: 'CYM' },
  { name: 'Turks and Caicos Islands', code: 'TCA' },
  { name: 'Montserrat', code: 'MSR' },
  { name: 'Anguilla', code: 'AIA' },
  { name: 'Bermuda', code: 'BMU' },
  { name: 'Falkland Islands', code: 'FLK' },
  { name: 'Gibraltar', code: 'GIB' },
  { name: 'Saint Helena', code: 'SHN' },
  { name: 'Aruba', code: 'ABW' },
  { name: 'Curaçao', code: 'CUW' },
  { name: 'Sint Maarten', code: 'SXM' },
  { name: 'Bonaire', code: 'BES' },
  { name: 'Faroe Islands', code: 'FRO' },
  { name: 'Greenland', code: 'GRL' },
  { name: 'Åland Islands', code: 'ALA' },
  { name: 'Isle of Man', code: 'IMN' },
  { name: 'Jersey', code: 'JEY' },
  { name: 'Guernsey', code: 'GGY' },
  { name: 'Cook Islands', code: 'COK' },
  { name: 'Niue', code: 'NIU' },
  { name: 'Tokelau', code: 'TKL' },
  { name: 'Hong Kong', code: 'HKG' },
  { name: 'Macao', code: 'MAC' },
  { name: 'Norfolk Island', code: 'NFK' },
  { name: 'Christmas Island', code: 'CXR' },
  { name: 'Cocos Islands', code: 'CCK' },
  { name: 'Svalbard and Jan Mayen', code: 'SJM' },
  { name: 'Bouvet Island', code: 'BVT' },
  { name: 'South Georgia', code: 'SGS' },
  { name: 'French Southern Territories', code: 'ATF' },
  { name: 'British Indian Ocean Territory', code: 'IOT' },
  { name: 'Heard Island', code: 'HMD' },
  { name: 'Antarctica', code: 'ATA' }
];

async function downloadCountryGeoJSON(country, index, total) {
  console.log(`[${index + 1}/${total}] Downloading ${country.name} (${country.code})...`);
  
  const sources = [
    `https://raw.githubusercontent.com/georgique/world-geojson/develop/countries/${country.code.toLowerCase()}.json`,
    `https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson`,
    `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson`
  ];
  
  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (response.ok) {
        const geoData = await response.json();
        
        // Si c'est un FeatureCollection mondial, extraire le pays
        if (geoData.type === 'FeatureCollection') {
          const countryFeature = geoData.features.find(feature => {
            const props = feature.properties;
            return props.ISO_A3?.toLowerCase() === country.code.toLowerCase() ||
                   props.ADM0_A3?.toLowerCase() === country.code.toLowerCase() ||
                   props.NAME?.toLowerCase().includes(country.name.toLowerCase()) ||
                   props.NAME_EN?.toLowerCase().includes(country.name.toLowerCase());
          });
          
          if (countryFeature) {
            return {
              type: 'Feature',
              properties: {
                name: country.name,
                code: country.code,
                ...countryFeature.properties
              },
              geometry: countryFeature.geometry
            };
          }
        } else {
          // GeoJSON direct du pays
          return {
            type: 'Feature',
            properties: {
              name: country.name,
              code: country.code,
              ...(geoData.properties || {})
            },
            geometry: geoData.geometry || geoData
          };
        }
      }
    } catch (error) {
      // Continuer avec la source suivante
    }
  }
  
  console.log(`  ❌ Failed to download ${country.name}`);
  return null;
}

async function createCountriesDirectory() {
  if (!fs.existsSync(COUNTRIES_DIR)) {
    fs.mkdirSync(COUNTRIES_DIR, { recursive: true });
    console.log(`📁 Created directory: ${COUNTRIES_DIR}`);
  }
}

async function downloadAllCountries() {
  console.log('🌍 Starting download of all world countries GeoJSON...\n');
  
  await createCountriesDirectory();
  
  let successCount = 0;
  let failedCount = 0;
  const failed = [];
  
  for (let i = 0; i < WORLD_COUNTRIES.length; i++) {
    const country = WORLD_COUNTRIES[i];
    
    try {
      const geoData = await downloadCountryGeoJSON(country, i, WORLD_COUNTRIES.length);
      
      if (geoData) {
        const filename = `${country.code.toLowerCase()}.json`;
        const filepath = path.join(COUNTRIES_DIR, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(geoData, null, 2), 'utf8');
        console.log(`  ✅ Saved: ${filename}`);
        successCount++;
      } else {
        failed.push(country.name);
        failedCount++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error downloading ${country.name}: ${error.message}`);
      failed.push(country.name);
      failedCount++;
    }
    
    // Petit délai pour éviter de surcharger les serveurs
    if (i < WORLD_COUNTRIES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Créer un index de tous les pays
  const countryIndex = {
    total: WORLD_COUNTRIES.length,
    successful: successCount,
    failed: failedCount,
    countries: WORLD_COUNTRIES.map(country => ({
      name: country.name,
      code: country.code,
      available: !failed.includes(country.name),
      filename: `${country.code.toLowerCase()}.json`
    }))
  };
  
  const indexPath = path.join(COUNTRIES_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(countryIndex, null, 2), 'utf8');
  
  console.log('\n🎉 Download complete!');
  console.log(`📊 Statistics:`);
  console.log(`   ✅ Successfully downloaded: ${successCount} countries`);
  console.log(`   ❌ Failed: ${failedCount} countries`);
  console.log(`   📁 Files saved in: ${COUNTRIES_DIR}`);
  console.log(`   📋 Index created: ${indexPath}`);
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed countries: ${failed.join(', ')}`);
  }
}

// Lancer le téléchargement
downloadAllCountries().catch(console.error);