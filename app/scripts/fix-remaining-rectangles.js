#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger les 3 derniers territoires avec des rectangles
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

async function fixRemainingRectangles() {
  console.log('🏝️  Fixing the 3 remaining rectangular territories with OpenStreetMap...\n');
  
  const territories = [
    {
      code: 'KER',
      name: 'Kerguelen Islands',
      species: 1,
      searchQuery: 'Kerguelen Islands',
      url: 'https://nominatim.openstreetmap.org/search?q=Kerguelen+Islands&format=geojson&polygon_geojson=1&addressdetails=1'
    },
    {
      code: 'TOK',
      name: 'Tokelau',
      species: 1,
      searchQuery: 'Tokelau',
      url: 'https://nominatim.openstreetmap.org/search?q=Tokelau&format=geojson&polygon_geojson=1&addressdetails=1'
    },
    {
      code: 'XMS',
      name: 'Christmas Island',
      species: 1,
      searchQuery: 'Christmas Island',
      url: 'https://nominatim.openstreetmap.org/search?q=Christmas+Island&format=geojson&polygon_geojson=1&addressdetails=1'
    }
  ];
  
  let fixed = 0;
  let failed = 0;
  
  for (const territory of territories) {
    console.log(`🔍 Fetching ${territory.name} (${territory.code}) from OpenStreetMap...`);
    
    try {
      const response = await fetch(territory.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`   📦 Got ${data.features.length} features for ${territory.name}`);
      
      // Trouver la feature avec polygon (pas point)
      const polygonFeature = data.features.find(f => 
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      );
      
      if (!polygonFeature) {
        console.log(`   ❌ No polygon found for ${territory.name}`);
        failed++;
        continue;
      }
      
      console.log(`   ✅ Found ${polygonFeature.geometry.type} for ${territory.name}`);
      
      const geoJSON = {
        "type": "Feature",
        "properties": {
          "name": territory.name,
          "locationCode": territory.code,
          "speciesCount": territory.species,
          "densityZone": "Very Low Density",
          "color": generateColorScale(territory.species),
          "isPalmZone": true
        },
        "geometry": polygonFeature.geometry
      };
      
      const filename = `${territory.code.toLowerCase()}.json`;
      const filepath = path.join(LOCATIONS_DIR, filename);
      
      try {
        fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
        console.log(`   ✅ ${territory.code}: Updated with real OSM coordinates`);
        fixed++;
      } catch (error) {
        console.log(`   ❌ ${territory.code}: Error saving - ${error.message}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to fetch ${territory.name}: ${error.message}`);
      failed++;
    }
    
    // Petite pause entre les requêtes pour être poli avec l'API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Rectangle fixing complete!`);
  console.log(`   ✅ Fixed: ${fixed} territories`);
  console.log(`   ❌ Failed: ${failed} territories`);
  console.log(`\n📊 All 198 locations should now have real geographic boundaries!`);
}

fixRemainingRectangles().catch(console.error);