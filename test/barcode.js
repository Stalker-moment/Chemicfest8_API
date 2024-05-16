const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const fs = require('fs');

// Create canvas for barcode with larger dimensions
const canvas = createCanvas(1000, 1000); // Ukuran canvas 1000x1000 piksel

// Generate barcode on the canvas with increased scale
JsBarcode(canvas, "013063374911835740", {
  format: "CODE128",
  displayValue: true,
  width: 4,  // Lebar garis barcode
  height: 100, // Tinggi barcode
  //fontSize: 40 // Ukuran font teks (jika ada)
});

// Save barcode image as PNG
const outPNG = fs.createWriteStream(__dirname + '/barcode.png');
const streamPNG = canvas.createPNGStream();
streamPNG.pipe(outPNG);
outPNG.on('finish', function(){
  console.log('Saved PNG');
});

// // Generate barcode as SVG
// bwipjs.toBuffer({
//     bcid: 'code128',
//     text: '013063374911835740',
//     scale: 3,
//     height: 10,
//     includetext: true,
//     textxalign: 'center',
// }, function (err, svg) {
//     if (err) {
//         console.log(err);
//     } else {
//         fs.writeFileSync(__dirname + '/barcode.svg', svg);
//         console.log('Saved SVG');
//     }
// });
