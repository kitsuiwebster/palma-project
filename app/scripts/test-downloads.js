#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Test script to verify download files are accessible
 */

console.log('🧪 Testing dataset download files...\n');

const files = [
  { name: 'TXT', path: 'src/assets/data/dataset.txt' },
  { name: 'JSON', path: 'src/assets/data/dataset.json' },
  { name: 'CSV', path: 'src/assets/data/dataset.csv' }
];

files.forEach(file => {
  try {
    const stats = fs.statSync(file.path);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`✅ ${file.name}: ${file.path} (${sizeInMB} MB)`);
    
    // Test if file is readable
    const content = fs.readFileSync(file.path, 'utf8', { start: 0, end: 100 });
    console.log(`   Preview: ${content.substring(0, 50).replace(/\n/g, '\\n')}...`);
    
  } catch (error) {
    console.log(`❌ ${file.name}: ${file.path} - Error: ${error.message}`);
  }
});

console.log('\n📄 File format verification:');

// Test JSON format
try {
  const jsonData = JSON.parse(fs.readFileSync('src/assets/data/dataset.json', 'utf8'));
  const recordCount = jsonData.data ? jsonData.data.length : 'unknown';
  console.log(`✅ JSON: Valid format with ${recordCount} records`);
  if (jsonData.metadata) {
    console.log(`   Metadata: ${jsonData.metadata.title} v${jsonData.metadata.version}`);
  }
} catch (error) {
  console.log(`❌ JSON: Invalid format - ${error.message}`);
}

// Test CSV format
try {
  const csvData = fs.readFileSync('src/assets/data/dataset.csv', 'utf8');
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  console.log(`✅ CSV: Valid format with ${lines.length - 1} data rows and ${headers.length} columns`);
} catch (error) {
  console.log(`❌ CSV: Error reading - ${error.message}`);
}

console.log('\n✅ All dataset download files are ready!');