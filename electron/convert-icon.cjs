const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico').default;

const pngPath = path.join(__dirname, 'icon.png');
const icoPath = path.join(__dirname, 'icon.ico');

pngToIco(pngPath)
  .then(buf => {
    fs.writeFileSync(icoPath, buf);
    console.log('Icon converted successfully to electron/icon.ico!');
  })
  .catch(err => {
    console.error('Failed to convert icon:', err);
  });
