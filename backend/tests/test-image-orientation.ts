/**
 * Regression check: uploads that carry an EXIF orientation tag must be stored
 * upright. Generates synthetic JPEGs locally; touches no network or database.
 *
 * Usage: npm run test:orientation
 */
import sharp from "sharp";
import { compressImage, generateThumbnail } from "../src/utils/image-compression";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}

/**
 * Builds a landscape "sensor" image whose top-left quadrant is red and the rest
 * blue, then tags it with the given EXIF orientation, like a phone would.
 */
async function taggedJpeg(width: number, height: number, orientation: number): Promise<Buffer> {
  const red = await sharp({
    create: { width: Math.round(width / 2), height: Math.round(height / 2), channels: 3, background: { r: 255, g: 0, b: 0 } },
  }).png().toBuffer();
  return sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 255 } } })
    .composite([{ input: red, top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .withMetadata({ orientation })
    .toBuffer();
}

/** Returns true when the pixel near the given corner is mostly red. */
async function isRedAt(buf: Buffer, corner: "tl" | "tr" | "bl" | "br"): Promise<boolean> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const x = corner.endsWith("l") ? 2 : info.width - 3;
  const y = corner.startsWith("t") ? 2 : info.height - 3;
  const i = (y * info.width + x) * info.channels;
  return data[i] > 200 && data[i + 2] < 60;
}

async function main() {
  // Orientation 6 = the usual iPhone portrait shot: rotate 90° clockwise to display.
  // Sensor top-left (red) ends up top-right once upright.
  const portrait = await taggedJpeg(4032, 3024, 6);
  const out = await compressImage(portrait, 1920, 1920, 85);
  const meta = await sharp(out).metadata();
  check("portrait photo is stored portrait", meta.width! < meta.height!, `${meta.width}x${meta.height}`);
  check("portrait photo keeps full size (1440x1920)", meta.width === 1440 && meta.height === 1920, `${meta.width}x${meta.height}`);
  check("pixels rotated clockwise (red at top-right)", await isRedAt(out, "tr"));
  check("no orientation tag left behind", !meta.orientation || meta.orientation === 1, String(meta.orientation));

  // Orientation 3 = upside down.
  const flipped = await compressImage(await taggedJpeg(1600, 1200, 3), 1920, 1920, 85);
  check("upside-down photo is turned 180° (red at bottom-right)", await isRedAt(flipped, "br"));

  // Orientation 8 = rotate 90° counter-clockwise; red ends up bottom-left.
  const ccw = await compressImage(await taggedJpeg(1600, 1200, 8), 1920, 1920, 85);
  const ccwMeta = await sharp(ccw).metadata();
  check("orientation 8 is stored portrait, red at bottom-left", ccwMeta.width! < ccwMeta.height! && (await isRedAt(ccw, "bl")));

  // Untagged landscape photos must be unchanged (no regression for normal uploads).
  const landscape = await compressImage(await taggedJpeg(3000, 2000, 1), 1920, 1920, 85);
  const lMeta = await sharp(landscape).metadata();
  check("untagged landscape stays landscape at 1920x1280", lMeta.width === 1920 && lMeta.height === 1280, `${lMeta.width}x${lMeta.height}`);
  check("untagged landscape not rotated (red at top-left)", await isRedAt(landscape, "tl"));

  // Small images are not enlarged.
  const small = await compressImage(await taggedJpeg(800, 600, 6), 1920, 1920, 85);
  const sMeta = await sharp(small).metadata();
  check("small tagged photo rotated, not enlarged (600x800)", sMeta.width === 600 && sMeta.height === 800, `${sMeta.width}x${sMeta.height}`);

  // Thumbnails generated straight from a tagged original are upright too.
  const thumb = await generateThumbnail(portrait, 300, 75);
  const tMeta = await sharp(thumb).metadata();
  check("thumbnail is 300x300", tMeta.width === 300 && tMeta.height === 300);

  // The migration's manual rotation (sharp.rotate(90)) turns a sideways stored file upright.
  const sideways = await sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 0, g: 0, b: 255 } } })
    .composite([{ input: await sharp({ create: { width: 200, height: 150, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer(), top: 0, left: 0 }])
    .jpeg().toBuffer();
  const fixed = await sharp(sideways).rotate(90).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  const fMeta = await sharp(fixed).metadata();
  check("migration rotate(90) gives portrait with red at top-right", fMeta.width === 300 && fMeta.height === 400 && (await isRedAt(fixed, "tr")));

  console.log(failures ? `\n${failures} check(s) failed` : "\nAll orientation checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
