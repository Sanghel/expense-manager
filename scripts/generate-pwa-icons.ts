import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const SOURCE = path.join(process.cwd(), 'public/brand/gh_push_money_logo.png')
const OUTPUT_DIR = path.join(process.cwd(), 'public/icons')
const SIZES = [96, 144, 180, 192, 512]

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const size of SIZES) {
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 15, g: 15, b: 19, alpha: 1 } })
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-${size}x${size}.png`))
    console.log(`✓ icon-${size}x${size}.png`)
  }

  // Maskable icon (Android 12+): logo centrado con padding ~10% — fondo indigo
  await sharp(SOURCE)
    .resize(432, 432, { fit: 'contain', background: { r: 79, g: 70, b: 229, alpha: 1 } })
    .extend({ top: 40, bottom: 40, left: 40, right: 40, background: { r: 79, g: 70, b: 229, alpha: 1 } })
    .resize(512, 512)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon-512x512-maskable.png'))
  console.log('✓ icon-512x512-maskable.png')

  console.log(`\nÍconos generados en: ${OUTPUT_DIR}`)
}

main().catch(console.error)
