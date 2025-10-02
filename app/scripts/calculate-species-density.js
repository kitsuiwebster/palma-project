#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour calculer la densité d'espèces par location
 * et générer des couleurs d'intensité variable
 */

const LOCATION_CSV = path.join(__dirname, '../src/assets/data/location.csv');
const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

function calculateSpeciesCount() {
  console.log('🔢 Calculating species count per location...\n');
  
  // Lire le CSV
  const csvContent = fs.readFileSync(LOCATION_CSV, 'utf8');
  const lines = csvContent.split('\n');
  
  // Compter les espèces par location
  const speciesCount = {};
  const locationSpecies = {}; // Pour garder les noms des espèces
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const [locationCode, speciesName] = line.split(',');
      if (locationCode && locationCode !== 'Area_code_L3' && speciesName) {
        if (!speciesCount[locationCode]) {
          speciesCount[locationCode] = 0;
          locationSpecies[locationCode] = new Set();
        }
        
        // Éviter les doublons d'espèces
        if (!locationSpecies[locationCode].has(speciesName)) {
          locationSpecies[locationCode].add(speciesName);
          speciesCount[locationCode]++;
        }
      }
    }
  }
  
  console.log(`📊 Found species counts for ${Object.keys(speciesCount).length} locations`);
  
  return speciesCount;
}

function generateColorScale(count, minCount, maxCount) {
  // Couleur de base verte, variation d'intensité
  const baseColor = [45, 90, 45]; // RGB pour #2d5a2d
  
  // Calculer l'intensité (0 = clair, 1 = foncé)
  const intensity = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
  
  // Générer les variations
  const lightColor = [140, 200, 140]; // Vert clair
  const darkColor = [20, 60, 20];    // Vert très foncé
  
  // Interpolation linéaire
  const r = Math.round(lightColor[0] + (darkColor[0] - lightColor[0]) * intensity);
  const g = Math.round(lightColor[1] + (darkColor[1] - lightColor[1]) * intensity);
  const b = Math.round(lightColor[2] + (darkColor[2] - lightColor[2]) * intensity);
  
  // Convertir en hex
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  
  return hex;
}

function getDensityLabel(count, minCount, maxCount) {
  const total = maxCount - minCount;
  const position = count - minCount;
  
  if (total === 0) return 'Medium Density';
  
  const percentile = position / total;
  
  if (percentile <= 0.2) return 'Very Low Density';
  if (percentile <= 0.4) return 'Low Density';
  if (percentile <= 0.6) return 'Medium Density';
  if (percentile <= 0.8) return 'High Density';
  return 'Very High Density';
}

async function updateLocationGeoJSONs() {
  console.log('🎨 Updating location GeoJSONs with species density...\n');
  
  // Calculer les comptes d'espèces
  const speciesCount = calculateSpeciesCount();
  
  // Trouver min et max pour l'échelle de couleurs
  const counts = Object.values(speciesCount);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  
  console.log(`📈 Species count range: ${minCount} - ${maxCount}`);
  console.log(`🎯 Color scale: Light green (${minCount} species) → Dark green (${maxCount} species)\n`);
  
  // Statistiques
  const stats = {
    updated: 0,
    notFound: 0,
    noSpecies: 0
  };
  
  // Parcourir tous les fichiers GeoJSON
  const locationFiles = fs.readdirSync(LOCATIONS_DIR).filter(f => f.endsWith('.json'));
  
  for (const filename of locationFiles) {
    const locationCode = filename.replace('.json', '').toUpperCase();
    const filepath = path.join(LOCATIONS_DIR, filename);
    
    try {
      const geoJSON = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      const count = speciesCount[locationCode] || 0;
      
      if (count > 0) {
        // Mettre à jour les propriétés
        geoJSON.properties.speciesCount = count;
        geoJSON.properties.color = generateColorScale(count, minCount, maxCount);
        geoJSON.properties.densityZone = getDensityLabel(count, minCount, maxCount);
        
        // Sauvegarder
        fs.writeFileSync(filepath, JSON.stringify(geoJSON, null, 2), 'utf8');
        
        console.log(`✅ ${locationCode}: ${count} species → ${geoJSON.properties.color} (${geoJSON.properties.densityZone})`);
        stats.updated++;
      } else {
        console.log(`⚠️  ${locationCode}: No species data found`);
        stats.noSpecies++;
      }
      
    } catch (error) {
      console.log(`❌ ${locationCode}: Error updating - ${error.message}`);
      stats.notFound++;
    }
  }
  
  console.log(`\n🎉 Species density update complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   ✅ Updated: ${stats.updated}`);
  console.log(`   ⚠️  No species: ${stats.noSpecies}`);
  console.log(`   ❌ Errors: ${stats.notFound}`);
  console.log(`\n🎨 Color Legend:`);
  console.log(`   🟢 ${minCount} species: ${generateColorScale(minCount, minCount, maxCount)}`);
  console.log(`   🟢 ${Math.round((minCount + maxCount) / 2)} species: ${generateColorScale(Math.round((minCount + maxCount) / 2), minCount, maxCount)}`);
  console.log(`   🟢 ${maxCount} species: ${generateColorScale(maxCount, minCount, maxCount)}`);
  
  return { speciesCount, minCount, maxCount, stats };
}

updateLocationGeoJSONs().catch(console.error);