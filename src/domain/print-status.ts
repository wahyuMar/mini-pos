export function printStatusAfter(attempted: boolean, ok: boolean): 'pending' | 'success' | 'failed' {
  if (!attempted) return 'pending'
  return ok ? 'success' : 'failed'
}

export function createsTransaction(action: 'checkout' | 'retry'): boolean {
  return action === 'checkout'
}
