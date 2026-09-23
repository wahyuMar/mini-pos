export const RECEIPT_COLUMNS = 32

export function formatReceiptMoney(amount: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount)
}

export function wrapText(text: string, width = RECEIPT_COLUMNS): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (word.length > width) {
      if (current) lines.push(current)
      for (let index = 0; index < word.length; index += width) lines.push(word.slice(index, index + width))
      current = ''
      continue
    }
    const next = current ? `${current} ${word}` : word
    if (next.length > width) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

export function pairLine(left: string, right: string, width = RECEIPT_COLUMNS): string {
  if (left.length + right.length + 1 <= width) return left + ' '.repeat(width - left.length - right.length) + right
  return `${left.slice(0, Math.max(0, width - right.length - 1))} ${right}`.slice(0, width)
}

export function itemLine(name: string, quantity: number, total: number, width = RECEIPT_COLUMNS): string[] {
  const tail = `${quantity} ${formatReceiptMoney(total)}`
  const nameWidth = Math.max(1, width - tail.length - 1)
  const [first = '', ...rest] = wrapText(name, nameWidth)
  return [pairLine(first, tail, width), ...rest]
}

export type ReceiptData = {
  storeName: string
  address: string
  phone: string
  footer: string
  cashierName: string
  number: string
  date: Date
  items: { name: string; quantity: number; total: number }[]
  subtotal: number
  discount: number
  total: number
  payment: number
  change: number
}

export function receiptLines(receipt: ReceiptData): string[] {
  const lines: string[] = []
  const center = (value: string) => {
    for (const row of wrapText(value)) {
      const pad = Math.max(0, Math.floor((RECEIPT_COLUMNS - row.length) / 2))
      lines.push(`${' '.repeat(pad)}${row}`)
    }
  }
  center(receipt.storeName)
  for (const row of receipt.address.split(/\r?\n/).filter(Boolean)) center(row)
  if (receipt.phone) center(receipt.phone)
  lines.push('-'.repeat(RECEIPT_COLUMNS))
  lines.push(`No : ${receipt.number}`.slice(0, RECEIPT_COLUMNS))
  lines.push(`Tgl: ${formatReceiptDate(receipt.date)}`)
  lines.push(`Kasir: ${receipt.cashierName}`.slice(0, RECEIPT_COLUMNS))
  lines.push('-'.repeat(RECEIPT_COLUMNS))
  lines.push(pairLine('Barang', 'Qty  Total'))
  lines.push('-'.repeat(RECEIPT_COLUMNS))
  for (const item of receipt.items) lines.push(...itemLine(item.name, item.quantity, item.total))
  lines.push('-'.repeat(RECEIPT_COLUMNS))
  lines.push(pairLine('Subtotal', formatReceiptMoney(receipt.subtotal)))
  lines.push(pairLine('Diskon', formatReceiptMoney(receipt.discount)))
  lines.push('-'.repeat(RECEIPT_COLUMNS))
  lines.push(pairLine('TOTAL', formatReceiptMoney(receipt.total)))
  lines.push('')
  lines.push(pairLine('Tunai', formatReceiptMoney(receipt.payment)))
  lines.push(pairLine('Kembalian', formatReceiptMoney(receipt.change)))
  lines.push('')
  center(receipt.footer)
  return lines.map((line) => line.length > RECEIPT_COLUMNS ? line.slice(0, RECEIPT_COLUMNS) : line)
}

export function receiptPreview(receipt: ReceiptData): string {
  return receiptLines(receipt).join('\n')
}

function formatReceiptDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`
}
