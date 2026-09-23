/**
 * Tira quadros de um vídeo pelo Edge da máquina, que não tem ffmpeg.
 *
 * Sobe um servidor mínimo com Range (é o que o <video> pede pra buscar um
 * tempo), abre o vídeo no Edge headless, busca cada tempo e copia o quadro
 * num canvas.
 *
 * Como módulo: import { quadros } from './quadros-video.mjs'
 *   await quadros('arquivo.mp4', [1.5, 8])  ->  [Buffer png, Buffer png]
 * Como comando: node scripts/quadros-video.mjs <video.mp4> <pasta> t1 t2 ...
 */
import puppeteer from 'puppeteer-core'
import { createServer } from 'node:http'
import { createReadStream, statSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

export async function quadros(arquivo, tempos) {
  const tam = statSync(arquivo).size
  const srv = createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      return res.end('<video id=v src="/v.mp4" muted preload=auto></video>')
    }
    const r = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '')
    const ini = r ? Number(r[1]) : 0
    const fim = r && r[2] ? Number(r[2]) : tam - 1
    res.writeHead(r ? 206 : 200, {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Content-Length': fim - ini + 1,
      ...(r ? { 'Content-Range': `bytes ${ini}-${fim}/${tam}` } : {}),
    })
    createReadStream(arquivo, { start: ini, end: fim }).pipe(res)
  }).listen(0)

  const nav = await puppeteer.launch({ executablePath: EDGE, headless: 'new', protocolTimeout: 60000 })
  try {
    const pag = await nav.newPage()
    await pag.goto(`http://localhost:${srv.address().port}/`)
    await pag.evaluate(
      () =>
        new Promise((ok, erro) => {
          const v = document.getElementById('v')
          if (v.readyState >= 1) return ok()
          v.addEventListener('loadedmetadata', ok)
          v.addEventListener('error', () => erro(new Error('vídeo não abriu')))
          setTimeout(() => erro(new Error('vídeo não carregou em 20 s')), 20000)
        })
    )
    const saida = []
    for (const t of tempos) {
      const data = await pag.evaluate(
        (t) =>
          new Promise((ok, erro) => {
            const v = document.getElementById('v')
            v.addEventListener(
              'seeked',
              () => {
                const c = document.createElement('canvas')
                c.width = v.videoWidth
                c.height = v.videoHeight
                c.getContext('2d').drawImage(v, 0, 0)
                ok(c.toDataURL('image/png'))
              },
              { once: true }
            )
            setTimeout(() => erro(new Error('não achou o tempo ' + t)), 20000)
            v.currentTime = t
          }),
        Number(t)
      )
      saida.push(Buffer.from(data.split(',')[1], 'base64'))
    }
    return saida
  } finally {
    await nav.close()
    srv.close()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [arq, pasta, ...tempos] = process.argv.slice(2)
  mkdirSync(pasta, { recursive: true })
  const bufs = await quadros(arq, tempos.map(Number))
  bufs.forEach((b, i) => writeFileSync(path.join(pasta, `quadro-${tempos[i]}.png`), b))
  console.log(`${bufs.length} quadro(s) em ${pasta}`)
}
