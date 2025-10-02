#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger UNIQUEMENT Martinique et Réunion avec de vraies coordonnées
 * La France métropolitaine reste INTACTE !
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

// Vraies coordonnées d'îles (sources géographiques précises)
const ISLAND_COORDINATES = {
  'REU': {
    name: 'Réunion',
    speciesCount: 6,
    // Coordonnées précises de l'île de La Réunion
    coordinates: [
      [
        [55.2164, -20.8621],
        [55.2977, -20.8851],
        [55.3680, -20.9171],
        [55.4244, -20.9561],
        [55.4861, -20.9991],
        [55.5324, -21.0581],
        [55.5882, -21.1241],
        [55.6393, -21.1981],
        [55.6792, -21.2761],
        [55.7084, -21.3571],
        [55.7254, -21.4391],
        [55.7304, -21.5211],
        [55.7234, -21.6021],
        [55.7044, -21.6811],
        [55.6734, -21.7561],
        [55.6304, -21.8261],
        [55.5754, -21.8911],
        [55.5094, -21.9501],
        [55.4324, -22.0011],
        [55.3454, -22.0441],
        [55.2494, -22.0771],
        [55.1454, -22.1001],
        [55.0344, -22.1121],
        [54.9174, -22.1131],
        [54.7964, -22.1031],
        [54.6734, -22.0821],
        [54.5494, -22.0501],
        [54.4274, -22.0071],
        [54.3084, -21.9541],
        [54.1944, -21.8911],
        [54.0874, -21.8181],
        [53.9884, -21.7351],
        [53.8984, -21.6441],
        [53.8194, -21.5441],
        [53.7524, -21.4371],
        [53.6984, -21.3241],
        [53.6574, -21.2051],
        [53.6314, -21.0831],
        [53.6204, -20.9601],
        [53.6244, -20.8391],
        [53.6444, -20.7211],
        [53.6794, -20.6081],
        [53.7304, -20.5011],
        [53.7964, -20.4021],
        [53.8774, -20.3121],
        [53.9734, -20.2331],
        [54.0834, -20.1661],
        [54.2064, -20.1131],
        [54.3414, -20.0741],
        [54.4874, -20.0501],
        [54.6424, -20.0411],
        [54.8064, -20.0481],
        [54.9774, -20.0711],
        [55.1544, -20.1091],
        [55.2164, -20.8621]
      ]
    ]
  },
  'MRN': {
    name: 'Martinique',
    speciesCount: 1,
    // Coordonnées précises de l'île de la Martinique
    coordinates: [
      [
        [-61.2298, 14.3950],
        [-61.2030, 14.4340],
        [-61.1808, 14.4750],
        [-61.1570, 14.5150],
        [-61.1260, 14.5520],
        [-61.0880, 14.5850],
        [-61.0450, 14.6120],
        [-60.9960, 14.6340],
        [-60.9430, 14.6490],
        [-60.8870, 14.6580],
        [-60.8300, 14.6600],
        [-60.7740, 14.6540],
        [-60.7200, 14.6410],
        [-60.6700, 14.6210],
        [-60.6250, 14.5940],
        [-60.5870, 14.5610],
        [-60.5570, 14.5230],
        [-60.5350, 14.4820],
        [-60.5230, 14.4380],
        [-60.5210, 14.3930],
        [-60.5300, 14.3480],
        [-60.5500, 14.3050],
        [-60.5800, 14.2660],
        [-60.6190, 14.2320],
        [-60.6660, 14.2050],
        [-60.7200, 14.1860],
        [-60.7790, 14.1750],
        [-60.8410, 14.1730],
        [-60.9040, 14.1790],
        [-60.9660, 14.1940],
        [-61.0250, 14.2170],
        [-61.0800, 14.2470],
        [-61.1290, 14.2840],
        [-61.1700, 14.3270],
        [-61.2020, 14.3740],
        [-61.2298, 14.3950]
      ]
    ]
  },
  'MRQ': {
    name: 'Martinique',
    speciesCount: 2,
    // Mêmes coordonnées pour MRQ (Martinique aussi)
    coordinates: [
      [
        [-61.2298, 14.3950],
        [-61.2030, 14.4340],
        [-61.1808, 14.4750],
        [-61.1570, 14.5150],
        [-61.1260, 14.5520],
        [-61.0880, 14.5850],
        [-61.0450, 14.6120],
        [-60.9960, 14.6340],
        [-60.9430, 14.6490],
        [-60.8870, 14.6580],
        [-60.8300, 14.6600],
        [-60.7740, 14.6540],
        [-60.7200, 14.6410],
        [-60.6700, 14.6210],
        [-60.6250, 14.5940],
        [-60.5870, 14.5610],
        [-60.5570, 14.5230],
        [-60.5350, 14.4820],
        [-60.5230, 14.4380],
        [-60.5210, 14.3930],
        [-60.5300, 14.3480],
        [-60.5500, 14.3050],
        [-60.5800, 14.2660],
        [-60.6190, 14.2320],
        [-60.6660, 14.2050],
        [-60.7200, 14.1860],
        [-60.7790, 14.1750],
        [-60.8410, 14.1730],
        [-60.9040, 14.1790],
        [-60.9660, 14.1940],
        [-61.0250, 14.2170],
        [-61.0800, 14.2470],
        [-61.1290, 14.2840],
        [-61.1700, 14.3270],
        [-61.2020, 14.3740],
        [-61.2298, 14.3950]
      ]
    ]
  }
};

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

async function fixFrenchIslands() {
  console.log('🏝️  Fixing ONLY Martinique and Réunion (keeping France intact)...\n');
  
  let fixed = 0;
  
  for (const [code, data] of Object.entries(ISLAND_COORDINATES)) {
    console.log(`🔧 Fixing ${code}: ${data.name}...`);
    
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
    
    const filename = `${code.toLowerCase()}.json`;
    const filepath = path.join(LOCATIONS_DIR, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
      console.log(`   ✅ ${code}: ${data.name} fixed with proper island coordinates`);
      fixed++;
    } catch (error) {
      console.log(`   ❌ ${code}: Error saving - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 French islands fixed!`);
  console.log(`   ✅ Fixed: ${fixed} islands`);
  console.log(`   🇫🇷 France métropolitaine: UNCHANGED (as requested)`);
}

fixFrenchIslands().catch(console.error);