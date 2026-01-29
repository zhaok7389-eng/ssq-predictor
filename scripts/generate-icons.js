#!/usr/bin/env node

/**
 * Generate PWA icons for the SSQ Predictor app.
 *
 * Creates valid PNG files using only Node.js built-in modules (zlib, fs, path).
 * The icons feature:
 *   - A purple-to-indigo gradient background (#667eea -> #764ba2)
 *   - A red circle (representing the red balls of SSQ)
 *   - A blue circle (representing the blue ball of SSQ)
 *   - A white "SSQ" text-like element
 *
 * Output:
 *   public/icons/icon-192.png  (192x192)
 *   public/icons/icon-512.png  (512x512)
 */

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "public", "icons");

// ── Color helpers ──────────────────────────────────────────────────────────

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

// ── Pixel drawing ──────────────────────────────────────────────────────────

function createPixelData(size) {
  // Each row: 1 filter byte + size * 3 (RGB) bytes
  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(rowBytes * size);

  const topColor = hexToRgb("#667eea");
  const bottomColor = hexToRgb("#764ba2");
  const cx = size / 2;
  const cy = size / 2;

  // Circle parameters scaled to icon size
  const redBallCx = size * 0.32;
  const redBallCy = size * 0.42;
  const redBallR = size * 0.18;

  const blueBallCx = size * 0.68;
  const blueBallCy = size * 0.42;
  const blueBallR = size * 0.18;

  // Small decorative dots at the bottom to suggest lottery numbers
  const dotR = size * 0.04;
  const dotY = size * 0.75;
  const dotPositions = [0.25, 0.37, 0.49, 0.61, 0.73];

  // "Swoosh" arc parameters (a subtle curved line connecting the balls)

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0; // filter type: None

    const gradientT = y / size;

    for (let x = 0; x < size; x++) {
      const pixOffset = rowOffset + 1 + x * 3;

      // Background gradient
      let r = lerp(topColor[0], bottomColor[0], gradientT);
      let g = lerp(topColor[1], bottomColor[1], gradientT);
      let b = lerp(topColor[2], bottomColor[2], gradientT);

      // Slight radial vignette for depth
      const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = Math.sqrt(cx ** 2 + cy ** 2);
      const vignette = 1 - 0.15 * (distFromCenter / maxDist);
      r = Math.round(r * vignette);
      g = Math.round(g * vignette);
      b = Math.round(b * vignette);

      // Rounded rectangle mask for app-icon shape (with rounded corners)
      const cornerRadius = size * 0.18;
      let insideRoundedRect = true;
      const margin = 0;
      if (
        x < margin + cornerRadius &&
        y < margin + cornerRadius
      ) {
        // top-left corner
        const dx = x - (margin + cornerRadius);
        const dy = y - (margin + cornerRadius);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius)
          insideRoundedRect = false;
      } else if (
        x > size - margin - cornerRadius - 1 &&
        y < margin + cornerRadius
      ) {
        // top-right corner
        const dx = x - (size - margin - cornerRadius - 1);
        const dy = y - (margin + cornerRadius);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius)
          insideRoundedRect = false;
      } else if (
        x < margin + cornerRadius &&
        y > size - margin - cornerRadius - 1
      ) {
        // bottom-left corner
        const dx = x - (margin + cornerRadius);
        const dy = y - (size - margin - cornerRadius - 1);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius)
          insideRoundedRect = false;
      } else if (
        x > size - margin - cornerRadius - 1 &&
        y > size - margin - cornerRadius - 1
      ) {
        // bottom-right corner
        const dx = x - (size - margin - cornerRadius - 1);
        const dy = y - (size - margin - cornerRadius - 1);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius)
          insideRoundedRect = false;
      }

      if (!insideRoundedRect) {
        // Transparent-ish white outside corners (for maskable icon area)
        r = 255;
        g = 255;
        b = 255;
        raw[pixOffset] = r;
        raw[pixOffset + 1] = g;
        raw[pixOffset + 2] = b;
        continue;
      }

      // ── Red ball ──
      const dxRed = x - redBallCx;
      const dyRed = y - redBallCy;
      const distRed = Math.sqrt(dxRed * dxRed + dyRed * dyRed);
      if (distRed < redBallR) {
        // 3D sphere shading
        const normalizedDist = distRed / redBallR;
        const lightAngle = Math.atan2(dyRed, dxRed);
        const highlight =
          Math.max(0, 1 - normalizedDist * 1.5) *
          Math.max(0, Math.cos(lightAngle + 0.8));

        r = Math.min(255, Math.round(220 * (1 - normalizedDist * 0.3) + highlight * 80));
        g = Math.min(255, Math.round(38 * (1 - normalizedDist * 0.5) + highlight * 60));
        b = Math.min(255, Math.round(38 * (1 - normalizedDist * 0.5) + highlight * 60));

        // White specular highlight
        const specX = redBallCx - redBallR * 0.3;
        const specY = redBallCy - redBallR * 0.3;
        const specDist = Math.sqrt((x - specX) ** 2 + (y - specY) ** 2);
        if (specDist < redBallR * 0.25) {
          const specIntensity = 1 - specDist / (redBallR * 0.25);
          r = Math.min(255, r + Math.round(specIntensity * 120));
          g = Math.min(255, g + Math.round(specIntensity * 120));
          b = Math.min(255, b + Math.round(specIntensity * 120));
        }
      }

      // ── Blue ball ──
      const dxBlue = x - blueBallCx;
      const dyBlue = y - blueBallCy;
      const distBlue = Math.sqrt(dxBlue * dxBlue + dyBlue * dyBlue);
      if (distBlue < blueBallR) {
        const normalizedDist = distBlue / blueBallR;
        const lightAngle = Math.atan2(dyBlue, dxBlue);
        const highlight =
          Math.max(0, 1 - normalizedDist * 1.5) *
          Math.max(0, Math.cos(lightAngle + 0.8));

        r = Math.min(255, Math.round(30 * (1 - normalizedDist * 0.3) + highlight * 60));
        g = Math.min(255, Math.round(100 * (1 - normalizedDist * 0.3) + highlight * 60));
        b = Math.min(255, Math.round(220 * (1 - normalizedDist * 0.3) + highlight * 80));

        const specX = blueBallCx - blueBallR * 0.3;
        const specY = blueBallCy - blueBallR * 0.3;
        const specDist = Math.sqrt((x - specX) ** 2 + (y - specY) ** 2);
        if (specDist < blueBallR * 0.25) {
          const specIntensity = 1 - specDist / (blueBallR * 0.25);
          r = Math.min(255, r + Math.round(specIntensity * 120));
          g = Math.min(255, g + Math.round(specIntensity * 120));
          b = Math.min(255, b + Math.round(specIntensity * 120));
        }
      }

      // ── Red ball border (subtle dark ring) ──
      if (Math.abs(distRed - redBallR) < size * 0.005) {
        r = Math.round(r * 0.6);
        g = Math.round(g * 0.6);
        b = Math.round(b * 0.6);
      }
      // ── Blue ball border ──
      if (Math.abs(distBlue - blueBallR) < size * 0.005) {
        r = Math.round(r * 0.6);
        g = Math.round(g * 0.6);
        b = Math.round(b * 0.6);
      }

      // ── Small decorative dots at bottom ──
      for (let di = 0; di < dotPositions.length; di++) {
        const dotCx = size * dotPositions[di];
        const dx2 = x - dotCx;
        const dy2 = y - dotY;
        const dotDist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dotDist < dotR) {
          // Alternate red and white dots, last one blue
          if (di < 4) {
            // White dot with slight transparency effect
            const dotShade = 1 - dotDist / dotR * 0.3;
            r = Math.min(255, Math.round(255 * dotShade));
            g = Math.min(255, Math.round(255 * dotShade));
            b = Math.min(255, Math.round(255 * dotShade));
          } else {
            // Slightly yellow/gold dot
            const dotShade = 1 - dotDist / dotR * 0.3;
            r = Math.min(255, Math.round(255 * dotShade));
            g = Math.min(255, Math.round(220 * dotShade));
            b = Math.min(255, Math.round(100 * dotShade));
          }
        }
      }

      // ── "SSQ" text approximation using pixel art ──
      // We'll draw a simple blocky text below the balls
      const textY = size * 0.58;
      const textHeight = size * 0.1;
      const textWidth = size * 0.5;
      const textStartX = size * 0.25;
      const charWidth = textWidth / 3;

      if (y >= textY && y < textY + textHeight && x >= textStartX && x < textStartX + textWidth) {
        const localY = (y - textY) / textHeight; // 0..1
        const localX = x - textStartX;
        const charIndex = Math.floor(localX / charWidth);
        const charLocalX = (localX % charWidth) / charWidth; // 0..1 within char

        let isText = false;

        // Simplified blocky letter rendering
        // S shape
        if (charIndex === 0 || charIndex === 1) {
          // "S" - two S letters
          if (localY < 0.2 && charLocalX > 0.15 && charLocalX < 0.85) isText = true;
          if (localY >= 0.15 && localY < 0.35 && charLocalX > 0.1 && charLocalX < 0.35) isText = true;
          if (localY >= 0.35 && localY < 0.55 && charLocalX > 0.15 && charLocalX < 0.85) isText = true;
          if (localY >= 0.55 && localY < 0.8 && charLocalX > 0.65 && charLocalX < 0.9) isText = true;
          if (localY >= 0.75 && charLocalX > 0.15 && charLocalX < 0.85) isText = true;
        }

        // Q shape
        if (charIndex === 2) {
          // "Q" - circle with tail
          const qCx = 0.5;
          const qCy = 0.5;
          const qR = 0.38;
          const qDist = Math.sqrt((charLocalX - qCx) ** 2 + (localY - qCy) ** 2);
          if (qDist < qR && qDist > qR - 0.18) isText = true;
          // tail
          if (localY > 0.6 && localY < 0.95 && charLocalX > 0.5 && charLocalX < 0.85) {
            if (Math.abs(charLocalX - 0.5 - (localY - 0.6) * 1.0) < 0.12) isText = true;
          }
        }

        if (isText) {
          // White text with slight shadow
          r = 255;
          g = 255;
          b = 255;
        }
      }

      raw[pixOffset] = Math.max(0, Math.min(255, r));
      raw[pixOffset + 1] = Math.max(0, Math.min(255, g));
      raw[pixOffset + 2] = Math.max(0, Math.min(255, b));
    }
  }

  return raw;
}

// ── PNG file construction ──────────────────────────────────────────────────

function crc32(buf) {
  // CRC-32 lookup table
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([length, typeBytes, data, crcBuf]);
}

function createPng(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createPngChunk("IHDR", ihdr);

  // Generate pixel data
  console.log(`  Generating ${size}x${size} pixel data...`);
  const rawPixels = createPixelData(size);

  // Compress with zlib
  console.log(`  Compressing...`);
  const compressed = zlib.deflateSync(rawPixels, { level: 9 });
  const idatChunk = createPngChunk("IDAT", compressed);

  // IEND chunk
  const iendChunk = createPngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const sizes = [192, 512];

  for (const size of sizes) {
    console.log(`Generating icon-${size}.png ...`);
    const png = createPng(size);
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    fs.writeFileSync(outputPath, png);
    console.log(`  Wrote ${outputPath} (${png.length} bytes)`);
  }

  console.log("\nDone! Icons generated successfully.");
}

main();
