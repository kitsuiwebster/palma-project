#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour ajouter des propriétés d'affichage explicites
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

// États américains qui doivent avoir des noms explicites
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

async function addDisplayProperties() {
  console.log('🏷️  Adding explicit display properties...\n');
  
  let updated = 0;
  
  for (const [stateCode, stateName] of Object.entries(US_STATES)) {
    const filename = `${stateCode.toLowerCase()}.json`;
    const filepath = path.join(LOCATIONS_DIR, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        const geoJSON = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        // Ajouter des propriétés explicites pour l'affichage
        geoJSON.properties.displayName = stateName;
        geoJSON.properties.country = 'United States';
        geoJSON.properties.type = 'state';
        geoJSON.properties.admin = stateName;
        geoJSON.properties.NAME = stateName;
        geoJSON.properties.NAME_EN = stateName;
        
        // Sauvegarder
        fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
        
        console.log(`✅ ${stateCode}: ${stateName} - added display properties`);
        updated++;
      }
      
    } catch (error) {
      console.log(`❌ ${stateCode}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Updated ${updated} US states with display properties!`);
}

addDisplayProperties().catch(console.error);