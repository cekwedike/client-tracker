import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "..", "app");
const svg = readFileSync(join(appDir, "icon.svg"));

async function renderPng(size) {
  return sharp(svg).resize(size, size).png().toBuffer();
}

function toIco(entries) {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const images = [];

  for (const { size, png } of entries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    images.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images]);
}

const icon32 = await renderPng(32);
const icon16 = await renderPng(16);
const apple180 = await renderPng(180);

writeFileSync(join(appDir, "icon.png"), icon32);
writeFileSync(join(appDir, "apple-icon.png"), apple180);
writeFileSync(
  join(appDir, "favicon.ico"),
  toIco([
    { size: 16, png: icon16 },
    { size: 32, png: icon32 },
  ]),
);

console.log("Generated app/icon.png, app/apple-icon.png, app/favicon.ico");
