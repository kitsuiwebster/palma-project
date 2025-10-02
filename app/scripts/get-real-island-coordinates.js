#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour récupérer les VRAIES coordonnées d'îles depuis OpenStreetMap
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

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

async function getRealIslandCoordinates() {
  console.log('🏝️  Getting REAL island coordinates from OpenStreetMap...\n');
  
  const islands = [
    {
      name: 'Martinique',
      codes: ['MRN', 'MRQ'],
      species: [1, 2],
      url: 'https://nominatim.openstreetmap.org/search?q=Martinique&format=geojson&polygon_geojson=1&addressdetails=1'
    },
    {
      name: 'Réunion',
      codes: ['REU'],
      species: [6],
      url: 'https://nominatim.openstreetmap.org/search?q=Réunion&format=geojson&polygon_geojson=1&addressdetails=1'
    }
  ];
  
  for (const island of islands) {
    console.log(`🔍 Fetching ${island.name} from OpenStreetMap...`);
    
    try {
      const response = await fetch(island.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`   📦 Got ${data.features.length} features for ${island.name}`);
      
      // Trouver la feature avec polygon (pas point)
      const polygonFeature = data.features.find(f => 
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      );
      
      if (!polygonFeature) {
        console.log(`   ❌ No polygon found for ${island.name}`);
        continue;
      }
      
      console.log(`   ✅ Found ${polygonFeature.geometry.type} for ${island.name}`);
      
      // Créer les fichiers pour chaque code
      for (let i = 0; i < island.codes.length; i++) {
        const code = island.codes[i];
        const speciesCount = island.species[i];
        
        const geoJSON = {
          "type": "Feature",
          "properties": {
            "name": island.name,
            "locationCode": code,
            "speciesCount": speciesCount,
            "densityZone": "Very Low Density",
            "color": generateColorScale(speciesCount),
            "isPalmZone": true
          },
          "geometry": polygonFeature.geometry
        };
        
        const filename = `${code.toLowerCase()}.json`;
        const filepath = path.join(LOCATIONS_DIR, filename);
        
        try {
          fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
          console.log(`   ✅ ${code}: Created with real OSM coordinates`);
        } catch (error) {
          console.log(`   ❌ ${code}: Error - ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to fetch ${island.name}: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Real island coordinates downloaded!`);
}

getRealIslandCoordinates().catch(console.error);