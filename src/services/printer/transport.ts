import { Capacitor } from '@capacitor/core'
import { bytesToBase64, ThermalPrinter } from '@devlas/capacitor-thermal-printer'
import { describePrintFailure, PrintError } from './errors'

export type PairedPrinter = {
  name: string
  address: string
}

export async function listPrinters(): Promise<PairedPrinter[]> {
  if (Capacitor.getPlatform() === 'web') throw new PrintError('unavailable', 'Bluetooth tidak tersedia di browser')
  try {
    const { devices } = await ThermalPrinter.list({ transport: 'bluetooth' })
    return devices.flatMap((device) =>
      device.address ? [{ name: device.name || device.address, address: device.address }] : [],
    )
  } catch (err) {
    throw toPrintError(err)
  }
}

export async function printRaw(address: string, data: Uint8Array): Promise<void> {
  if (!address) throw new PrintError('not_paired')
  if (data.length === 0) throw new PrintError('invalid_data')
  const paired = await listPrinters()
  if (!paired.some((device) => device.address === address)) throw new PrintError('not_paired')
  try {
    await ThermalPrinter.print({ transport: 'bluetooth', address, data: bytesToBase64(data) })
  } catch (err) {
    throw toPrintError(err)
  }
}

function toPrintError(err: unknown): PrintError {
  if (err instanceof PrintError) return err
  const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : ''
  const message = err instanceof Error ? err.message : ''
  return describePrintFailure(code, message)
}
