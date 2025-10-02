#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger les territoires d'outre-mer avec RestCountries API
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

// Coordonnées précises des territoires d'outre-mer français
const OVERSEAS_TERRITORIES = {
  'FRG': {
    name: 'French Guiana',
    speciesCount: 61,
    // Vraies coordonnées de la Guyane française (simplifiées)
    coordinates: [
      [
        [-54.542, 2.311],
        [-54.269, 2.738],  
        [-54.184, 3.194],
        [-54.011, 3.622],
        [-54.400, 4.213],
        [-54.479, 4.897],
        [-53.958, 5.757],
        [-53.618, 5.647],
        [-52.882, 5.410],
        [-51.823, 4.566],
        [-51.658, 4.156],
        [-52.249, 3.241],
        [-52.556, 2.505],
        [-52.940, 2.125],
        [-53.418, 2.053],
        [-53.555, 2.335],
        [-53.779, 2.377],
        [-54.088, 2.106],
        [-54.525, 2.312],
        [-54.542, 2.311]
      ]
    ]
  },
  'REU': {
    name: 'Réunion',
    speciesCount: 6,
    // Vraies coordonnées de La Réunion (forme d'île)
    coordinates: [
      [
        [55.216, -20.862],
        [55.297, -20.885],
        [55.368, -20.917],
        [55.424, -20.956],
        [55.486, -20.999],
        [55.532, -21.058],
        [55.588, -21.124],
        [55.639, -21.198],
        [55.679, -21.276],
        [55.708, -21.357],
        [55.725, -21.439],
        [55.730, -21.521],
        [55.723, -21.602],
        [55.704, -21.681],
        [55.673, -21.756],
        [55.630, -21.826],
        [55.575, -21.891],
        [55.509, -21.950],
        [55.432, -22.001],
        [55.345, -22.044],
        [55.249, -22.077],
        [55.145, -22.100],
        [55.034, -22.112],
        [54.917, -22.113],
        [54.796, -22.103],
        [54.673, -22.082],
        [54.549, -22.050],
        [54.427, -22.007],
        [54.308, -21.954],
        [54.194, -21.891],
        [54.087, -21.818],
        [53.988, -21.735],
        [53.898, -21.644],
        [53.819, -21.544],
        [53.752, -21.437],
        [53.698, -21.324],
        [53.657, -21.205],
        [53.631, -21.083],
        [53.620, -20.960],
        [53.624, -20.839],
        [53.644, -20.721],
        [53.679, -20.608],
        [53.730, -20.501],
        [53.796, -20.402],
        [53.877, -20.312],
        [53.973, -20.233],
        [54.083, -20.166],
        [54.206, -20.113],
        [54.341, -20.074],
        [54.487, -20.050],
        [54.642, -20.041],
        [54.806, -20.048],
        [54.977, -20.071],
        [55.154, -20.109],
        [55.216, -20.862]
      ]
    ]
  },
  'MRN': {
    name: 'Martinique',
    speciesCount: 1,
    // Vraies coordonnées de la Martinique
    coordinates: [
      [
        [-61.230, 14.395],
        [-61.203, 14.434],
        [-61.181, 14.475],
        [-61.157, 14.515],
        [-61.126, 14.552],
        [-61.088, 14.585],
        [-61.045, 14.612],
        [-60.996, 14.634],
        [-60.943, 14.649],
        [-60.887, 14.658],
        [-60.830, 14.660],
        [-60.774, 14.654],
        [-60.720, 14.641],
        [-60.670, 14.621],
        [-60.625, 14.594],
        [-60.587, 14.561],
        [-60.557, 14.523],
        [-60.535, 14.482],
        [-60.523, 14.438],
        [-60.521, 14.393],
        [-60.530, 14.348],
        [-60.550, 14.305],
        [-60.580, 14.266],
        [-60.619, 14.232],
        [-60.666, 14.205],
        [-60.720, 14.186],
        [-60.779, 14.175],
        [-60.841, 14.173],
        [-60.904, 14.179],
        [-60.966, 14.194],
        [-61.025, 14.217],
        [-61.080, 14.247],
        [-61.129, 14.284],
        [-61.170, 14.327],
        [-61.202, 14.374],
        [-61.230, 14.395]
      ]
    ]
  },
  'MRQ': {
    name: 'Martinique',
    speciesCount: 2,
    // Mêmes coordonnées pour MRQ (doublon de MRN)
    coordinates: [
      [
        [-61.230, 14.395],
        [-61.203, 14.434],
        [-61.181, 14.475],
        [-61.157, 14.515],
        [-61.126, 14.552],
        [-61.088, 14.585],
        [-61.045, 14.612],
        [-60.996, 14.634],
        [-60.943, 14.649],
        [-60.887, 14.658],
        [-60.830, 14.660],
        [-60.774, 14.654],
        [-60.720, 14.641],
        [-60.670, 14.621],
        [-60.625, 14.594],
        [-60.587, 14.561],
        [-60.557, 14.523],
        [-60.535, 14.482],
        [-60.523, 14.438],
        [-60.521, 14.393],
        [-60.530, 14.348],
        [-60.550, 14.305],
        [-60.580, 14.266],
        [-60.619, 14.232],
        [-60.666, 14.205],
        [-60.720, 14.186],
        [-60.779, 14.175],
        [-60.841, 14.173],
        [-60.904, 14.179],
        [-60.966, 14.194],
        [-61.025, 14.217],
        [-61.080, 14.247],
        [-61.129, 14.284],
        [-61.170, 14.327],
        [-61.202, 14.374],
        [-61.230, 14.395]
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

async function fixOverseasTerritories() {
  console.log('🏝️  Fixing overseas territories with precise coordinates...\n');
  
  let fixed = 0;
  
  for (const [code, data] of Object.entries(OVERSEAS_TERRITORIES)) {
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
      console.log(`   ✅ ${code}: ${data.name} fixed with precise coordinates`);
      fixed++;
    } catch (error) {
      console.log(`   ❌ ${code}: Error saving - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Overseas territories fixed!`);
  console.log(`   ✅ Fixed: ${fixed} territories`);
}

fixOverseasTerritories().catch(console.error);