#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour mettre à jour le GeoJSON avec les vraies frontières des pays
 * Usage: node scripts/update-country-geojson.js <country> <densityZone> <color>
 */

async function fetchCountryGeoJSON(countryName) {
  console.log(`Fetching GeoJSON for ${countryName}...`);
  
  try {
    // Utiliser une API plus simple et fiable
    const response = await fetch(`https://raw.githubusercontent.com/georgique/world-geojson/develop/countries/${countryName.toLowerCase()}.json`);
    
    if (response.ok) {
      const geoData = await response.json();
      console.log(`✅ Found geometry for ${countryName}`);
      return geoData.geometry || geoData;
    }
    
    // Alternative avec country mapping
    const countryMapping = {
      'indonesia': 'IDN',
      'brazil': 'BRA', 
      'madagascar': 'MDG',
      'colombia': 'COL',
      'venezuela': 'VEN',
      'malaysia': 'MYS',
      'philippines': 'PHL',
      'thailand': 'THA',
      'ecuador': 'ECU',
      'peru': 'PER'
    };
    
    const countryCode = countryMapping[countryName.toLowerCase()];
    if (countryCode) {
      const codeResponse = await fetch(`https://raw.githubusercontent.com/georgique/world-geojson/develop/countries/${countryCode.toLowerCase()}.json`);
      if (codeResponse.ok) {
        const geoData = await codeResponse.json();
        console.log(`✅ Found geometry for ${countryName} using code ${countryCode}`);
        return geoData.geometry || geoData;
      }
    }
    
    throw new Error('Country not found in database');
    
  } catch (error) {
    console.error('Error fetching country data:', error.message);
    console.log('Will use simplified geometry as fallback');
    return null;
  }
}

async function updateMapGeoJSON(countryName, densityZone, color) {
  const mapPath = path.join(__dirname, '../src/assets/data/map.geojson');
  
  // Lire le fichier existant
  let mapData;
  try {
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    mapData = JSON.parse(mapContent);
  } catch (error) {
    console.error('Error reading map.geojson:', error.message);
    return;
  }
  
  // Obtenir la géométrie du pays
  let geometry = await fetchCountryGeoJSON(countryName);
  
  if (!geometry) {
    console.log('Could not fetch geometry, creating simplified polygon...');
    // Coordonnées simplifiées pour l'Indonésie comme fallback
    if (countryName.toLowerCase().includes('indonesia')) {
      geometry = {
        "type": "MultiPolygon",
        "coordinates": [
          [[[95, -11], [141, -11], [141, 6], [95, 6], [95, -11]]]
        ]
      };
    }
  }
  
  // Chercher si le pays existe déjà
  const existingIndex = mapData.features.findIndex(feature => 
    feature.properties.name.toLowerCase().includes(countryName.toLowerCase())
  );
  
  const newFeature = {
    "type": "Feature",
    "properties": {
      "name": countryName,
      "speciesCount": 95, // Valeur par défaut
      "densityZone": densityZone,
      "color": color
    },
    "geometry": geometry
  };
  
  if (existingIndex >= 0) {
    // Remplacer le pays existant
    mapData.features[existingIndex] = newFeature;
    console.log(`Updated existing entry for ${countryName}`);
  } else {
    // Ajouter nouveau pays
    mapData.features.push(newFeature);
    console.log(`Added new entry for ${countryName}`);
  }
  
  // Sauvegarder le fichier
  try {
    fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2), 'utf8');
    console.log(`✅ Successfully updated map.geojson for ${countryName}`);
    console.log(`   Zone: ${densityZone}`);
    console.log(`   Color: ${color}`);
  } catch (error) {
    console.error('Error writing map.geojson:', error.message);
  }
}

// Utilisation du script
const [,, countryName, densityZone, colorValue] = process.argv;

if (!countryName || !densityZone || !colorValue) {
  console.log('Usage: node update-country-geojson.js <country> <densityZone> <color>');
  console.log('Example: node update-country-geojson.js "Indonesia" "High Density Native Zones" "#2d5a2d"');
  process.exit(1);
}

updateMapGeoJSON(countryName, densityZone, colorValue);