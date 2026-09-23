export function fittedSize(width: number, height: number, max = 480): { width: number; height: number } {
  const longest = Math.max(width, height)
  const scale = longest > 0 ? Math.min(1, max / longest) : 1
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function readProductPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Foto tidak bisa dibaca'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Foto tidak bisa dibaca'))
      image.onload = () => {
        const size = fittedSize(image.width, image.height)
        const canvas = document.createElement('canvas')
        canvas.width = size.width
        canvas.height = size.height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Foto gagal diproses'))
          return
        }
        context.drawImage(image, 0, 0, size.width, size.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
