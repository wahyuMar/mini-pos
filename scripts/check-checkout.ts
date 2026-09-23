import assert from 'node:assert/strict'
import { cartSubtotal, cashChange, checkoutTotal, transactionNumber } from '../src/domain/checkout.ts'

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

console.log('checkout checks ok')
