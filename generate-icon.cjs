// Generate a minimal 32x32 RGBA PNG icon using raw Node.js
// This creates a simple blue-purple glowing dot on dark background
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixels) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    function makeChunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const typeB = Buffer.from(type);
        const crc = crc32(Buffer.concat([typeB, data]));
        const crcB = Buffer.alloc(4);
        crcB.writeUInt32BE(crc);
        return Buffer.concat([len, typeB, data, crcB]);
    }

    // CRC32
    function crc32(buf) {
        let c = 0xffffffff;
        for (let i = 0; i < buf.length; i++) {
            c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
        }
        return (c ^ 0xffffffff) >>> 0;
    }

    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[n] = c;
    }

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    // IDAT
    const raw = Buffer.alloc(height * (1 + width * 4));
    for (let y = 0; y < height; y++) {
        raw[y * (1 + width * 4)] = 0; // filter byte
        for (let x = 0; x < width; x++) {
            const pi = (y * width + x) * 4;
            const ri = y * (1 + width * 4) + 1 + x * 4;
            raw[ri] = pixels[pi];
            raw[ri + 1] = pixels[pi + 1];
            raw[ri + 2] = pixels[pi + 2];
            raw[ri + 3] = pixels[pi + 3];
        }
    }
    const compressed = zlib.deflateSync(raw);

    // IEND
    const iend = Buffer.alloc(0);

    return Buffer.concat([
        signature,
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', iend),
    ]);
}


const outDir = path.join(__dirname, 'src-tauri', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
    [32, '32x32.png'],
    [128, '128x128.png'],
    [256, '128x128@2x.png'],
    [256, 'icon.png'],
];

for (const [size, name] of sizes) {
    const pixels = new Uint8Array(size * size * 4);
    const cx = size / 2, cy = size / 2;
    const maxR = size / 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const norm = dist / maxR;

            let r = 10, g = 10, b = 26;

            if (norm < 1.0) {
                const glow = Math.pow(Math.max(0, 1 - norm), 1.5);
                const innerGlow = Math.pow(Math.max(0, 1 - norm * 3), 2);

                r = Math.min(255, r + Math.floor(91 * glow * 0.5 + 220 * innerGlow));
                g = Math.min(255, g + Math.floor(80 * glow * 0.3 + 200 * innerGlow));
                b = Math.min(255, b + Math.floor(239 * glow * 0.7 + 255 * innerGlow));
            }

            pixels[i] = r;
            pixels[i + 1] = g;
            pixels[i + 2] = b;
            pixels[i + 3] = 255;
        }
    }

    const png = createPNG(size, size, pixels);
    fs.writeFileSync(path.join(outDir, name), png);
    console.log(`Created ${name} (${size}x${size})`);
}

// For icon.ico, create a minimal ICO file wrapping the 32x32 PNG
const png32 = fs.readFileSync(path.join(outDir, '32x32.png'));
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // ICO type
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoEntry = Buffer.alloc(16);
icoEntry[0] = 32; // width
icoEntry[1] = 32; // height
icoEntry[2] = 0;  // no palette
icoEntry[3] = 0;  // reserved
icoEntry.writeUInt16LE(1, 4);  // color planes
icoEntry.writeUInt16LE(32, 6); // bits per pixel
icoEntry.writeUInt32LE(png32.length, 8);  // size
icoEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

const ico = Buffer.concat([icoHeader, icoEntry, png32]);
fs.writeFileSync(path.join(outDir, 'icon.ico'), ico);
console.log('Created icon.ico');

// Clean up
console.log('All icons generated!');
