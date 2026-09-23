/**
 * Servidor estático de dist/ em http://localhost:3076, sem cache.
 * Comprime texto com gzip, como a Vercel faz, pra o Lighthouse local medir
 * o peso que o celular vai baixar de verdade.
 *
 * Responde a Range: o <video> pede o arquivo em pedaços pra buscar um tempo,
 * e sem isso a barra de progresso não deixa pular pra frente.
 *
 * Uso: node scripts/serve.mjs [porta]
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORTA = Number(process.argv[2] || 3076)
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

createServer(async (req, res) => {
  try {
    let rota = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (rota.endsWith('/')) rota += 'index.html'
    let arq = path.join(DIST, rota)
    if (!arq.startsWith(DIST)) throw Object.assign(new Error('fora'), { code: 'ENOENT' })
    let st = await stat(arq).catch(() => null)
    if (st?.isDirectory()) {
      arq = path.join(arq, 'index.html')
      st = await stat(arq)
    }
    if (!st) throw new Error('404')
    const tipo = TIPOS[path.extname(arq).toLowerCase()] || 'application/octet-stream'

    const faixa = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '')
    if (faixa && !tipo.startsWith('text/')) {
      const ini = faixa[1] ? Number(faixa[1]) : st.size - Number(faixa[2])
      const fim = faixa[1] && faixa[2] ? Math.min(Number(faixa[2]), st.size - 1) : st.size - 1
      res.writeHead(206, {
        'Content-Type': tipo,
        'Content-Range': `bytes ${ini}-${fim}/${st.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': fim - ini + 1,
        'Cache-Control': 'no-store',
      })
      return createReadStream(arq, { start: ini, end: fim }).pipe(res)
    }

    let corpo = await readFile(arq)
    const cab = { 'Content-Type': tipo, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' }
    if (/^(text\/|application\/(json|xml|manifest)|image\/svg)/.test(tipo) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      corpo = gzipSync(corpo)
      cab['Content-Encoding'] = 'gzip'
      cab.Vary = 'Accept-Encoding'
    }
    res.writeHead(200, cab)
    res.end(corpo)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('404')
  }
}).listen(PORTA, () => console.log(`servindo dist/ em http://localhost:${PORTA}`))
