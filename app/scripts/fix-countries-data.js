#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger les données de pays en utilisant une source plus fiable
 */

const COUNTRIES_DIR = path.join(__dirname, '../src/assets/data/countries');
const MAP_OUTPUT = path.join(__dirname, '../src/assets/data/map.geojson');

// Source alternative plus fiable
const NATURAL_EARTH_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';

async function fixCountriesData() {
  console.log('🔧 Fetching reliable world countries data...\n');
  
  try {
    // Télécharger les données complètes du monde
    const response = await fetch(NATURAL_EARTH_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const worldData = await response.json();
    console.log(`✅ Downloaded world data with ${worldData.features.length} countries`);
    
    // Créer la nouvelle carte avec tous les pays
    const mapFeatures = [];
    
    for (const feature of worldData.features) {
      const props = feature.properties;
      const countryName = props.NAME || props.NAME_EN || props.ADMIN || 'Unknown';
      
      // Éviter les duplicatas et les régions non-pays
      if (countryName && 
          countryName !== 'Unknown' && 
          !countryName.includes('Antarctica') &&
          feature.geometry && 
          feature.geometry.coordinates) {
        
        const mapFeature = {
          "type": "Feature",
          "properties": {
            "name": countryName,
            "speciesCount": 51,
            "densityZone": "High Density Native Zones",
            "color": "#2d5a2d"
          },
          "geometry": feature.geometry
        };
        
        mapFeatures.push(mapFeature);
      }
    }
    
    // Créer le GeoJSON final
    const worldMap = {
      "type": "FeatureCollection",
      "features": mapFeatures
    };
    
    // Sauvegarder
    fs.writeFileSync(MAP_OUTPUT, JSON.stringify(worldMap, null, 2), 'utf8');
    
    console.log(`\n🎉 Fixed world map created successfully!`);
    console.log(`📊 Statistics:`);
    console.log(`   ✅ Countries included: ${mapFeatures.length}`);
    console.log(`   📁 Output: ${MAP_OUTPUT}`);
    console.log(`   🎨 All countries colored as "High Density Native Zones" (#2d5a2d)`);
    
    // Afficher quelques exemples de pays
    const exampleCountries = mapFeatures.slice(0, 10).map(f => f.properties.name);
    console.log(`   🌍 Example countries: ${exampleCountries.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCountriesData().catch(console.error);