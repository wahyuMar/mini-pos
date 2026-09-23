import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

for (const dest of ['public/sql-wasm.wasm', 'public/assets/sql-wasm.wasm']) {
  const target = resolve(dest)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(resolve('node_modules/sql.js/dist/sql-wasm.wasm'), target)
}
