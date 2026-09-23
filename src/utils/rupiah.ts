export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}
