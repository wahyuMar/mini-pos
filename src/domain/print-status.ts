export function printStatusAfter(attempted: boolean, ok: boolean): 'pending' | 'success' | 'failed' {
  if (!attempted) return 'pending'
  return ok ? 'success' : 'failed'
}

export function createsTransaction(action: 'checkout' | 'retry' | 'reprint'): boolean {
  return action === 'checkout'
}
