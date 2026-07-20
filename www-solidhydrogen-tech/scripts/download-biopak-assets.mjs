import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const assets = {
  images: [
    { url: 'https://www.biopak.com/media/logo/stores/1/biopak-logo-v2.png', name: 'logo.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/packaging_made_from_plants_60x60.png', name: 'value-props/packaging-made-from-plants.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/certified_compostable_60x60.png', name: 'value-props/certified-compostable.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/b_corp_certified_60x60.png', name: 'value-props/b-corp-certified.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/emissions_reduction_60x60.png', name: 'value-props/emissions-reduction.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/home-Drinks_1_.png', name: 'categories/drinks.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/home-Food-Packaging_1_.png', name: 'categories/food-packaging.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/home-Service-Accessories-1.jpg', name: 'categories/service-accessories.jpg' },
    { url: 'https://www.biopak.com/media/wysiwyg/home-Bags-Carry-1.jpg', name: 'categories/bags-carry.jpg' },
    { url: 'https://www.biopak.com/media/wysiwyg/home-Kits_1_.png', name: 'categories/kits.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/home-Plates-Trays_1_.jpg', name: 'categories/plates-trays.jpg' },
    { url: 'https://www.biopak.com/media/wysiwyg/Custom_BioPak_Cup.jpg', name: 'custom/custom-biopak-cup.jpg' },
    { url: 'https://www.biopak.com/media/wysiwyg/footer-logo.png', name: 'footer-logo.png' },
    { url: 'https://www.biopak.com/media/wysiwyg/1a7e714446b6b0b0bdc71e78a42b0a9d71eab9ac.jpg', name: 'hero-bg.jpg' }
  ],
  seo: [
    { url: 'https://www.biopak.com/media/favicon/websites/1/favicon.png', name: 'favicon.png' }
  ]
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function downloadAll() {
  console.log('Downloading BioPak assets...');
  
  for (const asset of [...assets.images, ...assets.seo]) {
    const dir = path.dirname(asset.name);
    const fullPath = asset.name.startsWith('value-props/') || asset.name.startsWith('categories/') || asset.name.startsWith('custom/') 
      ? path.join('public/images', asset.name)
      : path.join('public', asset.name);
    
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    try {
      console.log(`Downloading ${asset.name}...`);
      await downloadFile(asset.url, fullPath);
      console.log(`  ✓ ${asset.name}`);
    } catch (err) {
      console.error(`  ✗ ${asset.name}: ${err.message}`);
    }
  }
  
  console.log('Asset download complete!');
}

downloadAll();
