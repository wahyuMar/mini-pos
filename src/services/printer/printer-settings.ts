import { databaseReady, getDb, persist } from '../database/db'

export type PrinterSettings = {
  printerName: string
  printerAddress: string
  autoPrint: boolean
}

export async function loadPrinterSettings(): Promise<PrinterSettings> {
  await databaseReady()
  const result = await getDb().query(
    'SELECT printer_name, printer_address, auto_print FROM printer_settings WHERE id = 1',
  )
  const row = result.values?.[0]
  if (!row) throw new Error('Pengaturan printer belum ada')
  return {
    printerName: String(row.printer_name ?? ''),
    printerAddress: String(row.printer_address ?? ''),
    autoPrint: Number(row.auto_print) === 1,
  }
}

export async function savePrinterSettings(input: PrinterSettings): Promise<void> {
  await databaseReady()
  await getDb().run(
    'UPDATE printer_settings SET printer_name = ?, printer_address = ?, auto_print = ? WHERE id = 1',
    [input.printerName || null, input.printerAddress || null, input.autoPrint ? 1 : 0],
  )
  await persist()
}
