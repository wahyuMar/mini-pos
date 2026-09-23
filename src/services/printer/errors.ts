export type PrintErrorCode =
  | 'bluetooth_off'
  | 'not_paired'
  | 'disconnected'
  | 'not_found'
  | 'busy'
  | 'timeout'
  | 'invalid_data'
  | 'no_response'
  | 'unavailable'
  | 'permission_denied'

const messages: Record<PrintErrorCode, string> = {
  bluetooth_off: 'Bluetooth belum aktif',
  not_paired: 'Printer belum paired',
  disconnected: 'Printer terputus',
  not_found: 'Printer tidak ditemukan',
  busy: 'Printer sedang sibuk',
  timeout: 'Waktu koneksi habis',
  invalid_data: 'Data cetak tidak valid',
  no_response: 'Printer tidak merespons',
  unavailable: 'Bluetooth tidak tersedia',
  permission_denied: 'Izin Bluetooth ditolak',
}

export class PrintError extends Error {
  readonly code: PrintErrorCode

  constructor(code: PrintErrorCode, message = messages[code]) {
    super(message)
    this.name = 'PrintError'
    this.code = code
  }
}

export function describePrintFailure(code: string, message: string): PrintError {
  const text = `${code} ${message}`.toLowerCase()
  if (text.includes('solo android') || text.includes('tidak tersedia di browser')) return new PrintError('unavailable')
  if (text.includes('busy') || text.includes('sibuk')) return new PrintError('busy')
  if (text.includes('timeout') || text.includes('timed out')) return new PrintError('timeout')
  if (code === 'invalid_data' || code === 'invalid_transport') return new PrintError('invalid_data')
  if (code === 'permission_denied') return new PrintError('permission_denied')
  if (code === 'not_found') return new PrintError('not_found')
  if (code === 'unavailable') return new PrintError('bluetooth_off')
  if (code === 'write_failed') return new PrintError('no_response')
  if (code === 'connect_failed') return new PrintError('disconnected')
  return new PrintError('disconnected', message || messages.disconnected)
}
