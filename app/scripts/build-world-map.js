#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour créer une carte mondiale avec tous les pays en "High Density Native Zones"
 */

const COUNTRIES_DIR = path.join(__dirname, '../src/assets/data/countries');
const MAP_OUTPUT = path.join(__dirname, '../src/assets/data/map.geojson');

async function buildWorldMap() {
  console.log('🗺️  Building world map with all countries...\n');
  
  // Lire l'index des pays
  const indexPath = path.join(COUNTRIES_DIR, 'index.json');
  let countryIndex;
  
  try {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    countryIndex = JSON.parse(indexContent);
  } catch (error) {
    console.error('❌ Error reading country index:', error.message);
    return;
  }
  
  const mapFeatures = [];
  let processedCount = 0;
  let errorCount = 0;
  
  // Traiter chaque pays disponible
  for (const country of countryIndex.countries) {
    if (!country.available) {
      console.log(`⏭️  Skipping ${country.name} (not available)`);
      continue;
    }
    
    try {
      const countryPath = path.join(COUNTRIES_DIR, country.filename);
      const countryContent = fs.readFileSync(countryPath, 'utf8');
      const countryData = JSON.parse(countryContent);
      
      // Créer la feature pour la carte
      const feature = {
        "type": "Feature",
        "properties": {
          "name": country.name,
          "speciesCount": 50, // Valeur par défaut
          "densityZone": "High Density Native Zones",
          "color": "#2d5a2d"
        },
        "geometry": countryData.geometry
      };
      
      mapFeatures.push(feature);
      processedCount++;
      
      if (processedCount % 50 === 0) {
        console.log(`✅ Processed ${processedCount} countries...`);
      }
      
    } catch (error) {
      console.log(`❌ Error processing ${country.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  // Créer le GeoJSON final
  const worldMap = {
    "type": "FeatureCollection",
    "features": mapFeatures
  };
  
  // Sauvegarder
  try {
    fs.writeFileSync(MAP_OUTPUT, JSON.stringify(worldMap, null, 2), 'utf8');
    console.log(`\n🎉 World map created successfully!`);
    console.log(`📊 Statistics:`);
    console.log(`   ✅ Countries processed: ${processedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Output: ${MAP_OUTPUT}`);
    console.log(`   🎨 All countries colored as "High Density Native Zones"`);
  } catch (error) {
    console.error('❌ Error writing map file:', error.message);
  }
}

buildWorldMap().catch(console.error);