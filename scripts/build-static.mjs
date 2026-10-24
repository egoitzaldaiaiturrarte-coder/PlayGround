import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'web')
const out = join(root, 'dist')

const started = performance.now()
await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })
await cp(source, out, { recursive: true })

const index = await readFile(join(out, 'index.html'), 'utf8')
if (!index.includes('data-ready')) {
  throw new Error('dist/index.html is missing the render readiness marker')
}

const files = ['index.html', 'styles.css', 'app.js']
const hashes = {}
for (const file of files) {
  hashes[file] = createHash('sha256')
    .update(await readFile(join(out, file)))
    .digest('hex')
    .slice(0, 12)
}

const meta = {
  name: 'limbo-core',
  version: '0.1.0',
  builtAt: new Date().toISOString(),
  assets: hashes
}
await writeFile(join(out, 'build.json'), `${JSON.stringify(meta, null, 2)}\n`)

console.log(`[build] dist ready in ${(performance.now() - started).toFixed(0)}ms -> ${out}`)
console.log(`[build] assets ${Object.entries(hashes).map(([name, hash]) => `${name}:${hash}`).join(' ')}`)
