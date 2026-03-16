import { nativeImage } from 'electron'
import type { NativeImage } from 'electron'
import zlib from 'zlib'
import type { IconStateConfig, IconColor, IconFill } from './store'

const COLOR_MAP: Record<IconColor, [number, number, number]> = {
  red:    [239, 68, 68],
  orange: [249, 115, 22],
  amber:  [245, 158, 11],
  yellow: [234, 179, 8],
  lime:   [132, 204, 22],
  green:  [34, 197, 94],
  teal:   [20, 184, 166],
  cyan:   [6, 182, 212],
  blue:   [59, 130, 246],
  indigo: [99, 102, 241],
  purple: [168, 85, 247],
  pink:   [236, 72, 153],
  black:  [0, 0, 0],
  white:  [255, 255, 255],
  gray:   [107, 114, 128],
}

// 32×32 rendered at @2x → 16×16 in the menu bar
const SIZE = 32
const CX = (SIZE - 1) / 2
const CY = (SIZE - 1) / 2
const R = SIZE / 2 - 1.5

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xedb88320) : (crc >>> 1)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const name = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([len, name, data, crcBuf])
}

function encodePNG(rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  // compression=0, filter=0, interlace=0 already set by alloc

  // Build scanlines: filter byte (None=0) + row RGBA data
  const rows = Buffer.alloc(SIZE * (SIZE * 4 + 1))
  for (let y = 0; y < SIZE; y++) {
    rows[y * (SIZE * 4 + 1)] = 0
    rgba.copy(rows, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

export function generateTrayIcon(config: IconStateConfig): NativeImage {
  const [cr, cg, cb] = COLOR_MAP[config.color]
  const rgba = Buffer.alloc(SIZE * SIZE * 4, 0)  // all transparent
  const STROKE = 2.5

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - CX
      const dy = y - CY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > R + 0.5) continue

      // Anti-alias at outer edge
      const outerAlpha = dist > R - 0.5 ? Math.round((R + 0.5 - dist) * 255) : 255

      let alpha = 0
      const fill = config.fill as IconFill

      if (fill === 'solid') {
        alpha = outerAlpha
      } else if (fill === 'outline') {
        const innerR = R - STROKE
        if (dist >= innerR - 0.5) {
          const innerAlpha = dist < innerR + 0.5
            ? Math.round((dist - (innerR - 0.5)) * 255)
            : 255
          alpha = Math.min(outerAlpha, innerAlpha)
        }
      } else if (fill === 'stripes') {
        if (((x + y) % 8) < 4) alpha = outerAlpha
      } else if (fill === 'dots') {
        const gx = ((x % 6) + 6) % 6
        const gy = ((y % 6) + 6) % 6
        const d = Math.sqrt((gx - 2.5) * (gx - 2.5) + (gy - 2.5) * (gy - 2.5))
        if (d < 2) alpha = outerAlpha
      } else if (fill === 'crosshatch') {
        const d1 = ((x + y) % 6) < 2
        const d2 = (((x - y) % 6) + 6) % 6 < 2
        if (d1 || d2) alpha = outerAlpha
      }

      if (alpha > 0) {
        const idx = (y * SIZE + x) * 4
        rgba[idx] = cr
        rgba[idx + 1] = cg
        rgba[idx + 2] = cb
        rgba[idx + 3] = alpha
      }
    }
  }

  return nativeImage.createFromBuffer(encodePNG(rgba), { scaleFactor: 2 })
}
