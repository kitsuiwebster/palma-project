#!/usr/bin/env node
/**
 * Generate a complete sitemap.xml with all palm species URLs.
 * Run: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://palma-encyclopedia.com';
const DATASET_PATH = path.join(__dirname, '..', 'src', 'assets', 'data', 'dataset.txt');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'sitemap.xml');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function parseDataset() {
  const data = fs.readFileSync(DATASET_PATH, 'utf-8');
  const lines = data.split('\n');
  const headers = lines[0].split('\t').map(h => h.trim());
  const specNameIndex = headers.indexOf('SpecName');
  const genusIndex = headers.indexOf('accGenus');

  if (specNameIndex === -1) {
    console.error('SpecName column not found in dataset');
    process.exit(1);
  }

  const species = [];
  const genera = new Set();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split('\t');
    const name = cols[specNameIndex]?.trim();
    const genus = genusIndex !== -1 ? cols[genusIndex]?.trim() : null;
    if (name) {
      species.push(name);
    }
    if (genus) {
      genera.add(genus);
    }
  }
  return { species, genera: Array.from(genera).sort() };
}

function generateSitemap(speciesList, generaList) {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/palms', changefreq: 'daily', priority: '0.9' },
    { loc: '/palms/search', changefreq: 'weekly', priority: '0.8' },
    { loc: '/data', changefreq: 'monthly', priority: '0.8' },
    { loc: '/data/overview', changefreq: 'monthly', priority: '0.7' },
    { loc: '/data/dataset', changefreq: 'monthly', priority: '0.7' },
    { loc: '/data/methodology', changefreq: 'monthly', priority: '0.6' },
    { loc: '/data/references', changefreq: 'monthly', priority: '0.6' },
    { loc: '/data/photo-credits', changefreq: 'monthly', priority: '0.5' },
    { loc: '/about', changefreq: 'monthly', priority: '0.6' },
    { loc: '/quiz', changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>

`;
  }

  // Genus pages
  for (const genus of generaList) {
    const slug = slugify(genus);
    xml += `  <url>
    <loc>${BASE_URL}/palms/genus/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

`;
  }

  // Species pages
  for (const species of speciesList) {
    const slug = slugify(species);
    xml += `  <url>
    <loc>${BASE_URL}/palms/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

`;
  }

  xml += '</urlset>\n';
  return xml;
}

// Main
const { species: speciesList, genera: generaList } = parseDataset();
console.log(`Found ${speciesList.length} species and ${generaList.length} genera in dataset`);

const totalUrls = 12 + generaList.length + speciesList.length;
const sitemap = generateSitemap(speciesList, generaList);
fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf-8');
console.log(`Sitemap generated at ${OUTPUT_PATH} with ${totalUrls} URLs`);
