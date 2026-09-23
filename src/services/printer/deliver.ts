import { getTransaction, setPrintStatus } from '../database/transactions'
import { printStatusAfter } from '../../domain/print-status'
import { encodeTransaction } from './receipt'
import { loadPrinterSettings } from './printer-settings'
import { printRaw } from './transport'

export type Delivery = {
  status: 'pending' | 'success' | 'failed'
  message: string
}

export async function deliverReceipt(id: number, force = false): Promise<Delivery> {
  const settings = await loadPrinterSettings()
  if (!force && !settings.autoPrint) {
    return { status: printStatusAfter(false, false), message: 'Struk belum dicetak' }
  }
  try {
    const detail = await getTransaction(id)
    await printRaw(settings.printerAddress, await encodeTransaction(detail))
  } catch (err) {
    await setPrintStatus(id, 'failed')
    return {
      status: printStatusAfter(true, false),
      message: err instanceof Error ? err.message : 'Struk gagal dicetak',
    }
  }
  await setPrintStatus(id, 'success')
  return { status: printStatusAfter(true, true), message: 'Struk tercetak' }
}
