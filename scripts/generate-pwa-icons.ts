import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const SOURCE = path.join(process.cwd(), 'public/brand/gh_push_money_logo.png')
const OUTPUT_DIR = path.join(process.cwd(), 'public/icons')
const SIZES = [96, 144, 180, 192, 512]

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Logo ocupa el 65% del canvas — el resto es padding con fondo oscuro
  const LOGO_RATIO = 0.65
  const BG = { r: 15, g: 15, b: 19, alpha: 1 }

  for (const size of SIZES) {
    const logoSize = Math.round(size * LOGO_RATIO)
    const totalPad = size - logoSize
    const padA = Math.floor(totalPad / 2)
    const padB = totalPad - padA
    await sharp(SOURCE)
      .resize(logoSize, logoSize, { fit: 'contain', background: BG })
      .extend({ top: padA, bottom: padB, left: padA, right: padB, background: BG })
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-${size}x${size}.png`))
    console.log(`✓ icon-${size}x${size}.png  (logo ${logoSize}px en canvas ${size}px)`)
  }

  // Maskable icon (Android 12+): logo al 55% — safe zone indigo para Android 12+
  const maskableLogoSize = Math.round(512 * 0.55)
  const maskablePad = Math.floor((512 - maskableLogoSize) / 2)
  const INDIGO = { r: 79, g: 70, b: 229, alpha: 1 }
  await sharp(SOURCE)
    .resize(maskableLogoSize, maskableLogoSize, { fit: 'contain', background: INDIGO })
    .extend({ top: maskablePad, bottom: maskablePad, left: maskablePad, right: maskablePad, background: INDIGO })
    .resize(512, 512)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon-512x512-maskable.png'))
  console.log('✓ icon-512x512-maskable.png')

  console.log(`\nÍconos generados en: ${OUTPUT_DIR}`)
}

main().catch(console.error)
