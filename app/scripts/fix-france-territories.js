#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger les territoires français avec de vraies frontières
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

async function getCountryBoundaries() {
  console.log('🌍 Downloading real country boundaries...\n');
  
  try {
    // API plus détaillée pour les pays et territoires
    const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const worldData = await response.json();
    console.log(`✅ Downloaded world data with ${worldData.features.length} features`);
    
    return worldData;
  } catch (error) {
    console.log(`❌ Error downloading boundaries: ${error.message}`);
    return null;
  }
}

function findTerritoryBoundary(worldData, searchNames) {
  for (const searchName of searchNames) {
    const feature = worldData.features.find(f => {
      const props = f.properties;
      const name = props.NAME || props.name || props.NAME_EN || props.ADMIN || '';
      return name.toLowerCase().includes(searchName.toLowerCase());
    });
    
    if (feature) {
      console.log(`   Found: ${feature.properties.NAME || feature.properties.name} for search "${searchName}"`);
      return feature.geometry;
    }
  }
  return null;
}

// Calcul de couleur basé sur le nombre d'espèces
function generateColorScale(count, minCount = 1, maxCount = 307) {
  const intensity = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
  
  const lightColor = [140, 200, 140]; // Vert clair
  const darkColor = [20, 60, 20];    // Vert très foncé
  
  const r = Math.round(lightColor[0] + (darkColor[0] - lightColor[0]) * intensity);
  const g = Math.round(lightColor[1] + (darkColor[1] - lightColor[1]) * intensity);
  const b = Math.round(lightColor[2] + (darkColor[2] - lightColor[2]) * intensity);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

async function fixFranceTerritories() {
  console.log('🇫🇷 Fixing French territories with real boundaries...\n');
  
  const worldData = await getCountryBoundaries();
  if (!worldData) {
    console.log('❌ Could not download world data');
    return;
  }
  
  // Territoires à corriger avec leurs variantes de noms
  const territories = {
    'FRA': {
      name: 'France',
      speciesCount: 1,
      searchNames: ['France', 'Metropolitan France', 'French Republic']
    },
    'FRG': {
      name: 'French Guiana',
      speciesCount: 61,
      searchNames: ['French Guiana', 'Guyane', 'Guiana']
    },
    'REU': {
      name: 'Réunion',
      speciesCount: 6,
      searchNames: ['Réunion', 'Reunion', 'La Réunion']
    },
    'MRN': {
      name: 'Martinique',
      speciesCount: 1,
      searchNames: ['Martinique']
    },
    'MRQ': {
      name: 'Martinique',
      speciesCount: 2,
      searchNames: ['Martinique']
    }
  };
  
  let fixed = 0;
  let failed = 0;
  
  for (const [code, data] of Object.entries(territories)) {
    console.log(`🔍 Processing ${code}: ${data.name}...`);
    
    const geometry = findTerritoryBoundary(worldData, data.searchNames);
    
    if (geometry) {
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
        "geometry": geometry
      };
      
      const filename = `${code.toLowerCase()}.json`;
      const filepath = path.join(LOCATIONS_DIR, filename);
      
      try {
        fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
        console.log(`   ✅ ${code}: ${data.name} updated with real boundaries`);
        fixed++;
      } catch (error) {
        console.log(`   ❌ ${code}: Error saving - ${error.message}`);
        failed++;
      }
    } else {
      console.log(`   ⚠️  ${code}: No geometry found for ${data.name}`);
      failed++;
    }
  }
  
  console.log(`\n🎉 French territories processing complete!`);
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ❌ Failed: ${failed}`);
}

fixFranceTerritories().catch(console.error);