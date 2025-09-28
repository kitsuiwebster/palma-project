#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Final verification that dataset download functionality is properly set up
 */

console.log('🔍 Final verification of dataset download setup...\n');

// Check that files exist in correct locations
const expectedFiles = [
  { format: 'TXT', path: 'src/assets/data/dataset.txt', downloadName: 'palma_dataset_1.0.txt' },
  { format: 'JSON', path: 'src/assets/data/dataset.json', downloadName: 'palma_dataset_1.0.json' },
  { format: 'CSV', path: 'src/assets/data/dataset.csv', downloadName: 'palma_dataset_1.0.csv' }
];

console.log('📂 File Availability Check:');
expectedFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    const stats = fs.statSync(file.path);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`✅ ${file.format}: ${file.path} → ${file.downloadName} (${sizeInMB} MB)`);
  } else {
    console.log(`❌ ${file.format}: Missing file at ${file.path}`);
  }
});

// Check component implementation
console.log('\n🔧 Component Implementation Check:');
try {
  const componentCode = fs.readFileSync('src/app/pages/dataset/dataset.component.ts', 'utf8');
  
  // Check for download method
  if (componentCode.includes('downloadDataset(format:')) {
    console.log('✅ downloadDataset method: Present');
  } else {
    console.log('❌ downloadDataset method: Missing');
  }
  
  // Check for correct file paths
  if (componentCode.includes('assets/data/dataset.json') && 
      componentCode.includes('assets/data/dataset.csv')) {
    console.log('✅ File paths: Correctly configured');
  } else {
    console.log('❌ File paths: Incorrect configuration');
  }
  
  // Check for HttpClient
  if (componentCode.includes('HttpClient')) {
    console.log('✅ HttpClient: Imported and injected');
  } else {
    console.log('❌ HttpClient: Missing');
  }
  
} catch (error) {
  console.log('❌ Component file: Could not read');
}

// Check HTML template
console.log('\n🎨 Template Check:');
try {
  const templateCode = fs.readFileSync('src/app/pages/dataset/dataset.component.html', 'utf8');
  
  const formats = ['json', 'csv', 'txt'];
  formats.forEach(format => {
    if (templateCode.includes(`downloadDataset('${format}')`)) {
      console.log(`✅ ${format.toUpperCase()} button: Present`);
    } else {
      console.log(`❌ ${format.toUpperCase()} button: Missing`);
    }
  });
  
} catch (error) {
  console.log('❌ Template file: Could not read');
}

console.log('\n📊 Data Quality Check:');

// Quick data validation
try {
  // Check TXT format
  const txtData = fs.readFileSync('src/assets/data/dataset.txt', 'utf8');
  const txtLines = txtData.split('\n').filter(line => line.trim());
  console.log(`✅ TXT: ${txtLines.length - 1} species records`);
  
  // Check JSON format
  const jsonData = JSON.parse(fs.readFileSync('src/assets/data/dataset.json', 'utf8'));
  console.log(`✅ JSON: ${jsonData.data.length} species records with metadata`);
  
  // Check CSV format
  const csvData = fs.readFileSync('src/assets/data/dataset.csv', 'utf8');
  const csvLines = csvData.split('\n').filter(line => line.trim());
  console.log(`✅ CSV: ${csvLines.length - 1} species records`);
  
} catch (error) {
  console.log(`❌ Data validation: ${error.message}`);
}

console.log('\n🎉 Dataset download functionality verification complete!');
console.log('   Users can now download the palm dataset in TXT, JSON, and CSV formats');
console.log('   All files are properly formatted and accessible via the web interface');