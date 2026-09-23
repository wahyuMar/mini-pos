export type SaleLine = {
  quantity: number
  unitPrice: number
}

export function lineSubtotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

export function cartSubtotal(lines: SaleLine[]): number {
  return lines.reduce((sum, line) => sum + lineSubtotal(line.quantity, line.unitPrice), 0)
}

export function checkoutTotal(subtotal: number, discount: number): number {
  if (!Number.isInteger(discount) || discount < 0) throw new Error('Diskon tidak valid')
  if (discount > subtotal) throw new Error('Diskon melebihi subtotal')
  return subtotal - discount
}

export function cashChange(payment: number, total: number): number {
  if (!Number.isInteger(payment) || payment < 0) throw new Error('Pembayaran tidak valid')
  if (payment < total) throw new Error('Pembayaran kurang dari total')
  return payment - total
}

export function transactionNumber(date: Date, sequence: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `TRX-${year}${month}${day}-${String(sequence).padStart(3, '0')}`
}
