#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour créer une carte de distribution des palmiers
 * - Zones de location.csv en couleur
 * - Reste du monde en gris
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');
const COUNTRIES_DIR = path.join(__dirname, '../src/assets/data/countries');
const MAP_OUTPUT = path.join(__dirname, '../src/assets/data/map.geojson');

const WORLD_GEOJSON_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

async function createPalmDistributionMap() {
  console.log('🌴 Creating palm distribution map...\n');
  
  const mapFeatures = [];
  
  // 1. Charger toutes les locations de palmiers (en couleur)
  console.log('📍 Loading palm distribution zones...');
  
  const locationFiles = fs.readdirSync(LOCATIONS_DIR).filter(f => f.endsWith('.json'));
  console.log(`   Found ${locationFiles.length} palm distribution zones`);
  
  for (const filename of locationFiles) {
    try {
      const filepath = path.join(LOCATIONS_DIR, filename);
      const locationData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      // Préserver les propriétés existantes (couleur d'intensité, densityZone, speciesCount)
      locationData.properties.isPalmZone = true;
      // NE PAS écraser la couleur et densityZone - elles sont déjà calculées selon l'intensité
      
      mapFeatures.push(locationData);
      
    } catch (error) {
      console.log(`   ❌ Error loading ${filename}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Loaded ${mapFeatures.length} palm zones`);
  
  // Pas de pays de fond - seulement les zones du CSV
  console.log('\n🎯 Map will contain ONLY the 198 palm distribution zones from location.csv');
  
  // 3. Créer le GeoJSON final
  const palmDistributionMap = {
    "type": "FeatureCollection",
    "features": mapFeatures
  };
  
  // 4. Sauvegarder
  try {
    fs.writeFileSync(MAP_OUTPUT, JSON.stringify(palmDistributionMap, null, 2), 'utf8');
    
    const stats = fs.statSync(MAP_OUTPUT);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n🎉 Palm distribution map created!`);
    console.log(`📊 Statistics:`);
    console.log(`   🌴 Palm zones: ${mapFeatures.length}`);
    console.log(`   🌍 Background countries: 0 (removed as requested)`);
    console.log(`   📁 Total features: ${mapFeatures.length}`);
    console.log(`   💾 File size: ${fileSizeMB} MB`);
    console.log(`   📂 Output: ${MAP_OUTPUT}`);
    
    console.log(`\n🎨 Color scheme:`);
    console.log(`   🟢 Palm zones: Variable intensity based on species count`);
    console.log(`   ⚪ Other areas: None (only CSV zones displayed)`);
    
  } catch (error) {
    console.error('❌ Error saving map:', error.message);
  }
}

createPalmDistributionMap().catch(console.error);