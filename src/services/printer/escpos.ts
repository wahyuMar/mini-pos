import { RECEIPT_COLUMNS, receiptLines, type ReceiptData } from './layout'

function latin1(value: string): Uint8Array {
  const out = new Uint8Array(value.length)
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    out[index] = code <= 0xff ? code : 0x3f
  }
  return out
}

export function encodeReceipt(receipt: ReceiptData): Uint8Array {
  const printer = new EscPos()
  printer.init()
  for (const line of receiptLines(receipt)) printer.line(line)
  printer.feed(3).cut()
  return printer.bytes()
}

export class EscPos {
  private chunks: Uint8Array[] = []

  init(): this {
    return this.raw(0x1b, 0x40)
  }

  align(mode: 'left' | 'center' | 'right'): this {
    return this.raw(0x1b, 0x61, mode === 'center' ? 1 : mode === 'right' ? 2 : 0)
  }

  bold(on: boolean): this {
    return this.raw(0x1b, 0x45, on ? 1 : 0)
  }

  size(scale: 1 | 2): this {
    const n = scale === 2 ? 0x11 : 0
    return this.raw(0x1d, 0x21, n)
  }

  text(value: string): this {
    this.chunks.push(latin1(value))
    return this
  }

  line(value = ''): this {
    return this.text(value).raw(0x0a)
  }

  separator(): this {
    return this.align('left').line('-'.repeat(RECEIPT_COLUMNS))
  }

  feed(lines: number): this {
    for (let index = 0; index < lines; index += 1) this.raw(0x0a)
    return this
  }

  cut(): this {
    return this.raw(0x1d, 0x56, 0x00)
  }

  qr(data: string): this {
    const bytes = latin1(data)
    const store = bytes.length + 3
    this.raw(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00)
    this.raw(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x04)
    this.raw(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31)
    this.raw(0x1d, 0x28, 0x6b, store & 0xff, (store >> 8) & 0xff, 0x31, 0x50, 0x30)
    this.chunks.push(bytes)
    return this.raw(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30)
  }

  logo(raster: Uint8Array, widthBytes: number, height: number): this {
    this.raw(0x1d, 0x76, 0x30, 0x00, widthBytes & 0xff, (widthBytes >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff)
    this.chunks.push(raster)
    return this
  }

  raw(...bytes: number[]): this {
    this.chunks.push(Uint8Array.from(bytes))
    return this
  }

  bytes(): Uint8Array {
    const length = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const out = new Uint8Array(length)
    let offset = 0
    for (const chunk of this.chunks) {
      out.set(chunk, offset)
      offset += chunk.length
    }
    return out
  }
}
