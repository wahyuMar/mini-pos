import assert from 'node:assert/strict'
import { cartSubtotal, cashChange, checkoutTotal, transactionNumber } from '../src/domain/checkout.ts'
import { receiptPreview, wrapText, type ReceiptData } from '../src/services/printer/layout.ts'

const lines = [
  { quantity: 2, unitPrice: 10000 },
  { quantity: 1, unitPrice: 12000 },
]
assert.equal(cartSubtotal(lines), 32000)
assert.equal(checkoutTotal(32000, 2000), 30000)
assert.equal(cashChange(50000, 30000), 20000)
assert.throws(() => checkoutTotal(32000, 33000), /melebihi subtotal/)
assert.throws(() => cashChange(1000, 30000), /kurang dari total/)
assert.equal(transactionNumber(new Date(2026, 8, 23), 1), 'TRX-20260923-001')
assert.notEqual(transactionNumber(new Date(2026, 8, 23), 1), transactionNumber(new Date(2026, 8, 23), 2))

const sample: ReceiptData = {
  storeName: 'TOKO ABC',
  address: 'Jl. Contoh No. 123',
  phone: '',
  footer: 'TERIMA KASIH',
  cashierName: 'Wahyu',
  number: 'TRX-20260923-001',
  date: new Date(2026, 8, 23, 7, 30),
  items: [
    { name: 'Kopi susu gula aren yang sangat panas', quantity: 2, total: 20000 },
    { name: 'Roti', quantity: 1, total: 12000 },
  ],
  subtotal: 32000,
  discount: 2000,
  total: 30000,
  payment: 50000,
  change: 20000,
}
const preview = receiptPreview(sample)
assert.ok(preview.split('\n').every((line) => line.length <= 32))
assert.match(preview, /20\.000/)
assert.match(preview, /TRX-20260923-001/)
assert.ok(wrapText('Kopi susu gula aren yang sangat panas', 32).every((line) => line.length <= 32))

console.log('checkout checks ok')
