#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour changer les couleurs de jaune pâle à rouge foncé
 */

const LOCATIONS_DIR = path.join(__dirname, '../src/assets/data/locations');

// Nouvelle fonction de couleur jaune pâle → rouge foncé
function generateColorScale(count, minCount = 1, maxCount = 307) {
  // Calcul de l'intensité normalisée entre 0 et 1
  const intensity = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0;
  
  // Couleurs jaune pâle → rouge foncé
  const lightColor = [255, 255, 150]; // Jaune pâle
  const darkColor = [139, 0, 0];      // Rouge foncé
  
  // Interpolation linéaire
  const r = Math.round(lightColor[0] + (darkColor[0] - lightColor[0]) * intensity);
  const g = Math.round(lightColor[1] + (darkColor[1] - lightColor[1]) * intensity);
  const b = Math.round(lightColor[2] + (darkColor[2] - lightColor[2]) * intensity);
  
  // Assurer que les valeurs sont dans la plage 0-255 et conversion en hex
  const red = Math.max(0, Math.min(255, r)).toString(16).padStart(2, '0');
  const green = Math.max(0, Math.min(255, g)).toString(16).padStart(2, '0');
  const blue = Math.max(0, Math.min(255, b)).toString(16).padStart(2, '0');
  
  return `#${red}${green}${blue}`;
}

async function fixColorYellowToRed() {
  console.log('🌈 Changing colors from pale yellow to dark red...\n');
  
  const locationFiles = fs.readdirSync(LOCATIONS_DIR).filter(f => f.endsWith('.json'));
  console.log(`📁 Found ${locationFiles.length} location files`);
  
  // Collecter toutes les données pour calculer min/max
  const allData = [];
  for (const filename of locationFiles) {
    try {
      const filepath = path.join(LOCATIONS_DIR, filename);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      allData.push({
        file: filename,
        data: data,
        speciesCount: data.properties.speciesCount
      });
    } catch (error) {
      console.log(`❌ Error reading ${filename}: ${error.message}`);
    }
  }
  
  // Calculer min/max réels
  const speciesCounts = allData.map(d => d.speciesCount);
  const minCount = Math.min(...speciesCounts);
  const maxCount = Math.max(...speciesCounts);
  
  console.log(`📊 Species count range: ${minCount} to ${maxCount}`);
  
  let updated = 0;
  let failed = 0;
  
  // Mettre à jour toutes les couleurs
  for (const item of allData) {
    const newColor = generateColorScale(item.speciesCount, minCount, maxCount);
    
    // Mettre à jour la couleur
    item.data.properties.color = newColor;
    
    try {
      fs.writeFileSync(
        path.join(LOCATIONS_DIR, item.file), 
        JSON.stringify(item.data, null, 2), 
        'utf8'
      );
      updated++;
    } catch (error) {
      console.log(`❌ Error updating ${item.file}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n🎉 Color scheme changed to yellow-red!`);
  console.log(`   ✅ Updated: ${updated} files`);
  console.log(`   ❌ Failed: ${failed} files`);
  
  // Afficher les nouveaux exemples de couleurs
  console.log(`\n🌈 New color scheme:`);
  console.log(`   🟡 1 species (lightest): ${generateColorScale(1, minCount, maxCount)}`);
  console.log(`   🟠 ${Math.floor((minCount + maxCount) / 2)} species (medium): ${generateColorScale(Math.floor((minCount + maxCount) / 2), minCount, maxCount)}`);
  console.log(`   🔴 ${maxCount} species (darkest): ${generateColorScale(maxCount, minCount, maxCount)}`);
}

fixColorYellowToRed().catch(console.error);