/**
 * Figma exports "SVGs" that are really wrappers around base64-embedded PNGs —
 * often at 4096px for a card rendered at 345px. Next.js never optimizes SVG,
 * so every one of those bytes ships to the browser untouched.
 *
 * This script rasterizes those files to PNG at 2x their viewBox (retina), so
 * next/image can serve responsive AVIF/WebP instead. Pure-vector SVGs (icons,
 * logos) are left alone — they are already small and should stay vector.
 *
 * Usage: node scripts/rasterize-figma-svgs.mjs [--dry]
 */
import { readdirSync, readFileSync, statSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

const IMAGES_DIR = "src/assets/images";
const ORIGINALS_DIR = join(IMAGES_DIR, "_originals");
const SCALE = 2;
const dryRun = process.argv.includes("--dry");

function viewBoxSize(svg) {
	const match = svg.match(/viewBox="([\d.\-eE\s]+)"/);
	if (match) {
		const [, , w, h] = match[1].trim().split(/\s+/).map(Number);
		if (w > 0 && h > 0) return { width: w, height: h };
	}
	const w = Number(svg.match(/<svg[^>]*\swidth="(\d+(?:\.\d+)?)"/)?.[1]);
	const h = Number(svg.match(/<svg[^>]*\sheight="(\d+(?:\.\d+)?)"/)?.[1]);
	if (w > 0 && h > 0) return { width: w, height: h };
	return null;
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(2)}MB`;

const candidates = readdirSync(IMAGES_DIR)
	.filter((file) => file.endsWith(".svg"))
	.filter((file) => readFileSync(join(IMAGES_DIR, file), "utf8").includes("data:image/"));

if (candidates.length === 0) {
	console.log("No raster-embedded SVGs left to convert.");
	process.exit(0);
}

let before = 0;
let after = 0;

for (const file of candidates) {
	const source = join(IMAGES_DIR, file);
	const svg = readFileSync(source);
	const size = viewBoxSize(svg.toString("utf8"));

	if (!size) {
		console.warn(`skip ${file} — no usable viewBox/width`);
		continue;
	}

	const target = join(IMAGES_DIR, file.replace(/\.svg$/, ".png"));
	const png = await sharp(svg, { density: 72 * SCALE, unlimited: true })
		.resize({ width: Math.round(size.width * SCALE) })
		.png({ compressionLevel: 9 })
		.toBuffer();

	const sourceBytes = statSync(source).size;
	before += sourceBytes;
	after += png.length;

	console.log(
		`${file.padEnd(24)} ${mb(sourceBytes).padStart(8)} -> ${mb(png.length).padStart(8)}  ` +
			`(${Math.round(size.width * SCALE)}px wide)`,
	);

	if (dryRun) continue;

	writeFileSync(target, png);
	mkdirSync(ORIGINALS_DIR, { recursive: true });
	renameSync(source, join(ORIGINALS_DIR, file));
}

console.log(`\nTotal: ${mb(before)} -> ${mb(after)} (${(100 - (after / before) * 100).toFixed(1)}% smaller)`);
if (dryRun) console.log("Dry run — nothing written.");
else console.log(`Originals moved to ${ORIGINALS_DIR} (git-ignored).`);
