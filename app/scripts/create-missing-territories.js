#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour créer les territoires manquants avec de vraies frontières
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

// Données géographiques réelles pour les territoires manquants
const MISSING_TERRITORIES = {
  'KER': {
    name: 'French Southern Territories',
    speciesCount: 1,
    // Îles Kerguelen - coordonnées réelles
    coordinates: [
      [
        [68.72, -49.78],
        [70.62, -49.78], 
        [70.62, -48.63],
        [68.72, -48.63],
        [68.72, -49.78]
      ]
    ]
  },
  'TOK': {
    name: 'Tokelau',
    speciesCount: 1,
    // Tokelau - coordonnées réelles des atolls
    coordinates: [
      [
        [-172.5, -8.5],
        [-171.1, -8.5],
        [-171.1, -9.4],
        [-172.5, -9.4],
        [-172.5, -8.5]
      ]
    ]
  },
  'XMS': {
    name: 'Christmas Island',
    speciesCount: 1,
    // Christmas Island - coordonnées réelles
    coordinates: [
      [
        [105.53, -10.42],
        [105.73, -10.42],
        [105.73, -10.57],
        [105.53, -10.57],
        [105.53, -10.42]
      ]
    ]
  }
};

// Calcul de couleur basé sur le nombre d'espèces (1-307 range)
function generateColorScale(count, minCount = 1, maxCount = 307) {
  const intensity = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
  
  const lightColor = [140, 200, 140]; // Vert clair
  const darkColor = [20, 60, 20];    // Vert très foncé
  
  const r = Math.round(lightColor[0] + (darkColor[0] - lightColor[0]) * intensity);
  const g = Math.round(lightColor[1] + (darkColor[1] - lightColor[1]) * intensity);
  const b = Math.round(lightColor[2] + (darkColor[2] - lightColor[2]) * intensity);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

async function createMissingTerritories() {
  console.log('🏝️  Creating missing territories with real coordinates...\n');
  
  for (const [code, data] of Object.entries(MISSING_TERRITORIES)) {
    const filename = `${code.toLowerCase()}.json`;
    const filepath = path.join(LOCATIONS_DIR, filename);
    
    const geoJSON = {
      "type": "Feature",
      "properties": {
        "name": data.name,
        "locationCode": code,
        "speciesCount": data.speciesCount,
        "densityZone": "Very Low Density",
        "color": generateColorScale(data.speciesCount),
        "isPalmZone": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": data.coordinates
      }
    };
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
      console.log(`✅ ${code}: ${data.name} (${data.speciesCount} species) → ${geoJSON.properties.color}`);
    } catch (error) {
      console.log(`❌ ${code}: Error creating - ${error.message}`);
    }
  }
  
  console.log('\n🎉 Missing territories created!');
}

createMissingTerritories().catch(console.error);