#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 PWA Icon Generator Script');
console.log('============================');

// Create PNG icon placeholders (since we can't convert SVG to PNG with Node.js alone)
const createIconPlaceholder = (size, filename) => {
  console.log(`📁 Creating placeholder for ${filename} (${size}x${size})`);
  
  // For now, we'll copy the SVG and update the manifest
  // In a real scenario, you'd use a tool like sharp or canvas to convert
  const svgPath = 'public/images/logo/logo-icon.svg';
  const targetPath = `public/images/logo/${filename}`;
  
  if (fs.existsSync(svgPath)) {
    // Copy SVG as fallback (you should convert to PNG manually or use imagemagick)
    fs.copyFileSync(svgPath, targetPath);
    console.log(`✅ Created ${targetPath}`);
  } else {
    console.log(`❌ Source SVG not found: ${svgPath}`);
  }
};

// Generate fallback manifest with mixed icons
const updateManifest = () => {
  console.log('\n📄 Updating manifest.json with mixed icon types...');
  
  try {
    const manifestPath = 'public/manifest.json';
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Add PNG icons alongside SVG icons
    manifest.icons = [
      // PNG icons for better PWA compatibility
      {
        "src": "/images/logo/icon-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/images/logo/icon-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      },
      // Keep SVG as fallback
      {
        "src": "/images/logo/logo-icon.svg",
        "sizes": "192x192",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": "/images/logo/logo-icon.svg",
        "sizes": "512x512",
        "type": "image/svg+xml",
        "purpose": "any"
      }
    ];
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Manifest updated with PNG icon references');
    
  } catch (error) {
    console.log('❌ Error updating manifest:', error.message);
  }
};

// Create temporary solution with better icon setup
const createBetterIconSetup = () => {
  console.log('\n🔧 Creating better icon setup...');
  
  // Create a simple base64 PNG icon as fallback
  const createBase64Icon = (size) => {
    // This is a minimal 1x1 blue PNG in base64
    const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return `data:image/png;base64,${minimalPng}`;
  };
  
  // For now, let's use the SVG icons but improve the manifest structure
  const manifestPath = 'public/manifest.json';
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update manifest with better icon configuration
  manifest.icons = [
    {
      "src": "/images/logo/logo-icon.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "/images/logo/logo-icon.svg", 
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "/images/logo/logo-icon.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "maskable"
    },
    {
      "src": "/images/logo/logo-icon.svg",
      "sizes": "512x512", 
      "type": "image/svg+xml",
      "purpose": "maskable"
    }
  ];
  
  // Ensure display is standalone
  manifest.display = "standalone";
  
  // Add prefer_related_applications
  manifest.prefer_related_applications = false;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Improved manifest configuration');
};

// Instructions for manual PNG conversion
const showManualInstructions = () => {
  console.log('\n📋 Manual PNG Conversion Instructions:');
  console.log('=====================================');
  console.log('Since automatic SVG->PNG conversion requires additional tools,');
  console.log('please create PNG icons manually:');
  console.log('');
  console.log('1. 📱 Method 1 - Online Converter:');
  console.log('   - Go to: https://convertio.co/svg-png/');
  console.log('   - Upload: public/images/logo/logo-icon.svg');
  console.log('   - Convert to PNG');
  console.log('   - Resize to 192x192 and 512x512');
  console.log('   - Save as: public/images/logo/icon-192.png');
  console.log('   - Save as: public/images/logo/icon-512.png');
  console.log('');
  console.log('2. 🖥️  Method 2 - Using ImageMagick (if installed):');
  console.log('   convert public/images/logo/logo-icon.svg -resize 192x192 public/images/logo/icon-192.png');
  console.log('   convert public/images/logo/logo-icon.svg -resize 512x512 public/images/logo/icon-512.png');
  console.log('');
  console.log('3. 🎨 Method 3 - Using GIMP/Photoshop:');
  console.log('   - Open SVG file');
  console.log('   - Export as PNG');
  console.log('   - Create 192x192 and 512x512 versions');
  console.log('');
  console.log('After creating PNG files, run:');
  console.log('   node scripts/debug-pwa-mobile.js');
};

// Main execution
const main = () => {
  createBetterIconSetup();
  showManualInstructions();
  
  console.log('\n✨ PWA Icon Setup Improved!');
  console.log('📱 Next Steps:');
  console.log('1. Create PNG icons manually (see instructions above)');
  console.log('2. Test with: npm run pwa:build');
  console.log('3. Run production: npm run pwa:prod');
  console.log('4. Test PWA install on mobile');
};

main();
