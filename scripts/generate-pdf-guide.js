#!/usr/bin/env node

/**
 * Script to generate PDF from Better Planner Guide Markdown
 * 
 * Requirements:
 * - Install markdown-pdf: npm install -g markdown-pdf
 * - Or use pandoc: brew install pandoc (macOS) / apt-get install pandoc (Linux)
 * 
 * Usage:
 *   node scripts/generate-pdf-guide.js
 *   OR
 *   npm run generate:pdf
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const markdownFile = path.join(__dirname, '../docs/PANDUAN-SINGKAT-BETTER-PLANNER.md');
const outputFile = path.join(__dirname, '../docs/PANDUAN-SINGKAT-BETTER-PLANNER.pdf');

console.log('📄 Generating PDF from Markdown...\n');

// Check if markdown file exists
if (!fs.existsSync(markdownFile)) {
  console.error('❌ Error: Markdown file not found:', markdownFile);
  process.exit(1);
}

try {
  // Method 1: Try using pandoc (recommended for better formatting)
  try {
    console.log('🔄 Trying pandoc...');
    execSync(`pandoc "${markdownFile}" -o "${outputFile}" --pdf-engine=xelatex -V geometry:margin=2cm -V fontsize=11pt -V documentclass=article`, {
      stdio: 'inherit'
    });
    console.log('\n✅ PDF generated successfully using pandoc!');
    console.log('📁 Output:', outputFile);
    process.exit(0);
  } catch (pandocError) {
    console.log('⚠️  pandoc not available, trying markdown-pdf...\n');
    
    // Method 2: Try using markdown-pdf
    try {
      execSync(`markdown-pdf "${markdownFile}" -o "${outputFile}"`, {
        stdio: 'inherit'
      });
      console.log('\n✅ PDF generated successfully using markdown-pdf!');
      console.log('📁 Output:', outputFile);
      process.exit(0);
    } catch (mdPdfError) {
      console.error('❌ Error: Both pandoc and markdown-pdf are not available.\n');
      console.error('Please install one of the following:');
      console.error('  1. pandoc: brew install pandoc (macOS) or apt-get install pandoc (Linux)');
      console.error('  2. markdown-pdf: npm install -g markdown-pdf');
      console.error('\nAlternatively, you can use online tools:');
      console.error('  - https://www.markdowntopdf.com/');
      console.error('  - https://dillinger.io/ (Export as PDF)');
      console.error('  - https://stackedit.io/ (Export as PDF)');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
}

