import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Generate SVG icons at different sizes
const sizes = [192, 512];

for (const size of sizes) {
  const fontSize = Math.round(size * 0.55);
  const radius = Math.round(size * 0.18);
  const yOffset = Math.round(size * 0.03);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#FF6B9D"/>
  <text x="${size / 2}" y="${size / 2 + yOffset}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">\u{1F4CB}</text>
</svg>`;

  const path = join(outDir, `icon-${size}.svg`);
  writeFileSync(path, svg);
  console.log(`Generated ${path}`);
}
