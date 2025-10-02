#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger les propriétés des états américains
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

// États américains identifiés
const US_STATES = ['ALA', 'ARI', 'ARK', 'CAL', 'FLA', 'GST', 'HAW', 'LOU', 'MSI', 'OGA', 'OKL', 'OMA', 'SCA', 'TEX'];

async function fixUSStatesProperties() {
  console.log('🇺🇸 Fixing US states properties...\n');
  
  let fixed = 0;
  
  for (const stateCode of US_STATES) {
    const filename = `${stateCode.toLowerCase()}.json`;
    const filepath = path.join(LOCATIONS_DIR, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        const geoJSON = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        // S'assurer que seules nos propriétés sont présentes
        const cleanGeoJSON = {
          "type": "Feature",
          "properties": {
            "name": geoJSON.properties.name,
            "locationCode": geoJSON.properties.locationCode,
            "speciesCount": geoJSON.properties.speciesCount,
            "densityZone": geoJSON.properties.densityZone,
            "color": geoJSON.properties.color,
            "isPalmZone": geoJSON.properties.isPalmZone
          },
          "geometry": {
            "type": geoJSON.geometry.type,
            "coordinates": geoJSON.geometry.coordinates
          }
        };
        
        // Sauvegarder la version nettoyée
        fs.writeFileSync(filepath, JSON.stringify(cleanGeoJSON, null, 2), 'utf8');
        
        console.log(`✅ ${stateCode}: ${geoJSON.properties.name} - cleaned properties`);
        fixed++;
      } else {
        console.log(`⚠️  ${stateCode}: File not found`);
      }
      
    } catch (error) {
      console.log(`❌ ${stateCode}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Fixed ${fixed} US states properties!`);
}

fixUSStatesProperties().catch(console.error);