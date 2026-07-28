const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\baf8032d-90d0-4a71-8049-6c453fd7e6c9\\media__1779368798474.jpg';
const outputDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    // Generate 192x192
    await sharp(inputImagePath)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toFile(path.join(outputDir, 'icon-192x192.png'));
    console.log('Created icon-192x192.png');

    // Generate 512x512
    await sharp(inputImagePath)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toFile(path.join(outputDir, 'icon-512x512.png'));
    console.log('Created icon-512x512.png');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
