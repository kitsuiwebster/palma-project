#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour télécharger les GeoJSON manquants
 */

const COUNTRIES_DIR = path.join(__dirname, '../src/assets/data/countries');

const MISSING_COUNTRIES = [
  { name: 'Angola', code: 'AGO', alt: ['Angola'] },
  { name: 'French Guiana', code: 'GUF', alt: ['French Guiana', 'Guyane'] },
  { name: 'Martinique', code: 'MTQ', alt: ['Martinique'] },
  { name: 'Réunion', code: 'REU', alt: ['Reunion', 'Réunion'] },
  { name: 'Tokelau', code: 'TKL', alt: ['Tokelau'] },
  { name: 'Christmas Island', code: 'CXR', alt: ['Christmas Island'] }
];

async function downloadMissingCountry(country) {
  console.log(`[${country.code}] Downloading ${country.name}...`);
  
  const sources = [
    `https://raw.githubusercontent.com/georgique/world-geojson/develop/countries/${country.code.toLowerCase()}.json`,
    `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson`
  ];
  
  // Essayer la source directe
  try {
    const response = await fetch(sources[0]);
    if (response.ok) {
      const geoData = await response.json();
      return {
        type: 'Feature',
        properties: {
          name: country.name,
          code: country.code,
          ...geoData.properties
        },
        geometry: geoData.geometry || geoData
      };
    }
  } catch (error) {
    console.log(`  ❌ Direct source failed: ${error.message}`);
  }
  
  // Essayer Natural Earth
  try {
    console.log(`  🔍 Searching in Natural Earth database...`);
    const response = await fetch(sources[1]);
    if (response.ok) {
      const worldData = await response.json();
      
      for (const alt of country.alt) {
        const feature = worldData.features.find(f => {
          const props = f.properties;
          return props.ISO_A3?.toLowerCase() === country.code.toLowerCase() ||
                 props.ADM0_A3?.toLowerCase() === country.code.toLowerCase() ||
                 props.NAME?.toLowerCase().includes(alt.toLowerCase()) ||
                 props.NAME_EN?.toLowerCase().includes(alt.toLowerCase()) ||
                 props.ADMIN?.toLowerCase().includes(alt.toLowerCase());
        });
        
        if (feature) {
          console.log(`  ✅ Found in Natural Earth as: ${feature.properties.NAME || feature.properties.ADMIN}`);
          return {
            type: 'Feature',
            properties: {
              name: country.name,
              code: country.code,
              ...feature.properties
            },
            geometry: feature.geometry
          };
        }
      }
    }
  } catch (error) {
    console.log(`  ❌ Natural Earth failed: ${error.message}`);
  }
  
  console.log(`  ❌ Could not find ${country.name}`);
  return null;
}

async function downloadAllMissing() {
  console.log('🌍 Downloading missing country GeoJSON files...\n');
  
  let successCount = 0;
  let failedCount = 0;
  
  for (const country of MISSING_COUNTRIES) {
    const filename = `${country.code.toLowerCase()}.json`;
    const filepath = path.join(COUNTRIES_DIR, filename);
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(filepath)) {
      console.log(`[${country.code}] ✅ Already exists: ${filename}`);
      successCount++;
      continue;
    }
    
    try {
      const geoData = await downloadMissingCountry(country);
      
      if (geoData) {
        fs.writeFileSync(filepath, JSON.stringify(geoData, null, 2), 'utf8');
        console.log(`[${country.code}] ✅ Saved: ${filename}\n`);
        successCount++;
      } else {
        console.log(`[${country.code}] ❌ Failed to download\n`);
        failedCount++;
      }
      
    } catch (error) {
      console.log(`[${country.code}] ❌ Error: ${error.message}\n`);
      failedCount++;
    }
    
    // Délai entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n🎉 Download complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  
  // Mettre à jour l'index
  if (successCount > 0) {
    console.log(`\n📝 Updating countries index...`);
    // On pourrait mettre à jour l'index ici si nécessaire
  }
}

downloadAllMissing().catch(console.error);