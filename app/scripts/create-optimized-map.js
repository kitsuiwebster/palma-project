#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour créer une carte optimisée avec géométries simplifiées
 */

const MAP_OUTPUT = path.join(__dirname, '../src/assets/data/map.geojson');

// Source avec géométries simplifiées (plus petite)
const SIMPLIFIED_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

async function createOptimizedMap() {
  console.log('🔧 Creating optimized map with simplified geometries...\n');
  
  try {
    const response = await fetch(SIMPLIFIED_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const worldData = await response.json();
    console.log(`✅ Downloaded simplified world data with ${worldData.features.length} countries`);
    
    // Créer la carte avec tous les pays en même couleur
    const mapFeatures = worldData.features
      .filter(feature => {
        const props = feature.properties;
        const countryName = props.NAME || props.NAME_EN || props.ADMIN;
        return countryName && 
               feature.geometry && 
               feature.geometry.coordinates &&
               !countryName.includes('Antarctica');
      })
      .map(feature => ({
        "type": "Feature",
        "properties": {
          "name": feature.properties.NAME || feature.properties.NAME_EN || feature.properties.ADMIN,
          "speciesCount": 50,
          "densityZone": "High Density Native Zones",
          "color": "#2d5a2d"
        },
        "geometry": feature.geometry
      }));
    
    const worldMap = {
      "type": "FeatureCollection", 
      "features": mapFeatures
    };
    
    // Sauvegarder
    fs.writeFileSync(MAP_OUTPUT, JSON.stringify(worldMap, null, 2), 'utf8');
    
    const stats = fs.statSync(MAP_OUTPUT);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n🎉 Optimized map created!`);
    console.log(`📊 Statistics:`);
    console.log(`   ✅ Countries: ${mapFeatures.length}`);
    console.log(`   📁 File size: ${fileSizeMB} MB`);
    console.log(`   🎨 All same color: #2d5a2d`);
    
    // Vérifier que les pays problématiques sont présents
    const countryNames = mapFeatures.map(f => f.properties.name);
    const testCountries = ['Somalia', 'Nigeria', 'India', 'United States of America', 'Mali', 'Niger'];
    
    console.log(`\n🔍 Test countries check:`);
    testCountries.forEach(country => {
      const found = countryNames.find(name => name.includes(country.split(' ')[0]));
      console.log(`   ${found ? '✅' : '❌'} ${country}: ${found || 'NOT FOUND'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createOptimizedMap().catch(console.error);