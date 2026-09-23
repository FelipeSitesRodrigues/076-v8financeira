/**
 * Gera as imagens do site a partir de "../076 - V8 CONSULTORIA FINANCEIRA/Recursos Site".
 *
 * AVIF primeiro, WebP como reserva, cada foto em várias larguras pro srcset:
 * o celular não baixa a versão de desktop. As larguras saíram do tamanho em
 * que cada imagem aparece no layout, contando tela de densidade 2.
 *
 * Também gera:
 * - as capas dos quatro vídeos, tiradas dos próprios filmes (quadro escolhido
 *   a olho, tempo anotado em CAPAS);
 * - favicon e ícones de tela inicial, com o símbolo sobre o preto da marca;
 * - a imagem de compartilhamento (og-image.jpg), que é o que aparece quando o
 *   link do site é colado no WhatsApp.
 *
 * Grava assets/img/manifesto.json com largura e altura de cada arquivo, que é
 * de onde saem os width/height do HTML (sem eles o layout salta e o CLS sobe).
 *
 * Uso: node scripts/processar-imagens.mjs   (ou npm run imagens)
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { quadros } from './quadros-video.mjs'

const R = '../076 - V8 CONSULTORIA FINANCEIRA/Recursos Site/'
const OUT = 'assets/img/'
const CACHE = 'scripts/.cache/'
mkdirSync(OUT, { recursive: true })
mkdirSync(CACHE, { recursive: true })

// Os nomes vieram do Windows e do Mac misturados: "AUTORIZAÇÃO" chega com o
// acento decomposto (NFD). Compara tudo normalizado pra achar o arquivo.
function achar(relativo) {
  const partes = relativo.split('/')
  let atual = R
  for (const parte of partes) {
    const alvo = parte.normalize('NFC')
    const nome = readdirSync(atual).find((n) => n.normalize('NFC') === alvo)
    if (!nome) throw new Error(`falta o arquivo: ${atual}${parte}`)
    atual = path.join(atual, nome)
  }
  return atual
}

const manifesto = {}

async function gravar(img, base, larguras, { qAvif = 52, qWebp = 78, alfa = false } = {}) {
  for (const w of larguras) {
    const r = img.clone().resize({ width: w, withoutEnlargement: true })
    for (const [ext, opts] of [
      ['avif', { quality: qAvif, effort: 6 }],
      ['webp', { quality: qWebp, alphaQuality: alfa ? 100 : 80, effort: 5 }],
    ]) {
      const arq = `${base}-${w}.${ext}`
      const buf = await r.clone()[ext](opts).toBuffer()
      writeFileSync(OUT + arq, buf)
      const m = await sharp(buf).metadata()
      manifesto[arq] = { w: m.width, h: m.height, kb: +(buf.length / 1024).toFixed(1) }
    }
  }
  const p = manifesto[`${base}-${larguras[0]}.webp`]
  console.log(
    `${base.padEnd(20)} ${String(p.w).padStart(4)}x${String(p.h).padEnd(5)} ` +
      larguras.map((w) => `${w}: ${manifesto[`${base}-${w}.avif`].kb}/${manifesto[`${base}-${w}.webp`].kb} KB`).join('   ')
  )
}

const gerar = (origem, base, larguras, { extrair = null, ...opts } = {}) => {
  let img = sharp(achar(origem))
  if (extrair) img = img.extract(extrair)
  return gravar(img, base, larguras, opts)
}

// ---------------------------------------------------------------------- hero
// Desktop: a foto é o fundo do hero inteiro, na largura da tela.
await gerar('DESKTOP/IMAGEM HERO DESKTOP.png', 'hero-desktop', [1672, 1400, 1100], { qAvif: 50 })
// Celular: retrato, com o céu escuro em cima pra o título ficar por cima dele.
await gerar('MOBILE/IMAGEM HERO MOBILE.png', 'hero-mobile', [941, 780, 600], { qAvif: 50 })

// ------------------------------------------------------------------ problema
await gerar('03 - CREDITO NEGADO.png', 'problema', [1400, 1000, 700], { qAvif: 50 })

// ----------------------------------------------------------------- pagamento
// O terço de cima da foto é só céu: sai antes de gerar, pra não pagar por ele.
await gerar('04 - CREDITO HOJE, CONQUISTA AMANHA.png', 'pagamento', [941, 720, 540], {
  extrair: { left: 0, top: 260, width: 941, height: 1412 },
})

// --------------------------------------------------------------------- logo
// Só o símbolo (o PNG já vem com fundo transparente). Aparece no topo, no
// rodapé e grande em "Quem somos".
await gerar('02 LOGO V8 - FAVICON.png', 'v8-simbolo', [1000, 640, 360, 180, 120], { alfa: true, qAvif: 70, qWebp: 90 })

// -------------------------------------------------------------------- vídeos
// Capa de cada vídeo, tirada do próprio filme. O tempo foi escolhido olhando
// os quadros: o filme 1 abre no protagonista olhando o celular, o 4 no
// "crédito negado", o 3 no painel de análise e o de pagamento nos painéis
// financeiros (o começo dele é bege, destoa do site escuro).
const V = 'VÍDEOS QUE O AUGUSTO QUER NO SITE/'
const CAPAS = [
  { video: 'VIDEO 1.mp4', base: 'capa-filme', tempo: 1.5 },
  { video: 'VIDEO 4.mp4', base: 'capa-apontamento', tempo: 0.5 },
  { video: 'VIDEO 3.mp4', base: 'capa-autorizacao', tempo: 8 },
  { video: 'VÍDEO 2 - PAGAMENTO POS PAGO.mp4', base: 'capa-pagamento', tempo: 12 },
]
for (const c of CAPAS) {
  const cache = `${CACHE}${c.base}-${c.tempo}.png`
  if (!existsSync(cache)) {
    const [png] = await quadros(achar(V + c.video), [c.tempo])
    writeFileSync(cache, png)
  }
  await gravar(sharp(readFileSync(cache)), c.base, [576, 400], { qAvif: 55, qWebp: 80 })
}

// ------------------------------------------------------- favicon e ícones
// Navegador: símbolo solto, sem fundo. Tela inicial e PWA: com o preto da
// marca, porque o iOS e o Android pintam o fundo transparente de branco.
const simbolo = achar('02 LOGO V8 - FAVICON.png')
const PRETO = '#020D09'
const quadrado = async (s, margem, fundo) => {
  const miolo = Math.round(s * (1 - 2 * margem))
  const logo = await sharp(simbolo).resize({ width: miolo, height: miolo, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  return sharp({ create: { width: s, height: s, channels: 4, background: fundo } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}
writeFileSync(`${OUT}favicon-32.png`, await quadrado(32, 0.02, { r: 0, g: 0, b: 0, alpha: 0 }))
writeFileSync(`${OUT}favicon-180.png`, await quadrado(180, 0.14, PRETO))
writeFileSync(`${OUT}favicon-512.png`, await quadrado(512, 0.16, PRETO))
console.log('favicon-32 / 180 / 512')

// ---------------------------------------------------------- compartilhamento
// 1200x630, o formato que WhatsApp, Facebook e LinkedIn usam na prévia do link.
// Fundo preto da marca, a malha fina, o brilho verde subindo da base e o logo
// completo no centro.
{
  const W = 1200
  const H = 630
  const malha = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <pattern id="m" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="#00603C" stroke-opacity=".32" stroke-width="1"/>
      </pattern>
      <radialGradient id="g" cx="50%" cy="100%" r="75%">
        <stop offset="0" stop-color="#00F9A4" stop-opacity=".30"/>
        <stop offset=".45" stop-color="#009048" stop-opacity=".10"/>
        <stop offset="1" stop-color="#020D09" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="v" cx="50%" cy="45%" r="70%">
        <stop offset=".55" stop-color="#020D09" stop-opacity="0"/>
        <stop offset="1" stop-color="#020D09" stop-opacity=".9"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="#020D09"/>
    <rect width="100%" height="100%" fill="url(#m)"/>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#v)"/>
  </svg>`
  const logo = await sharp(achar('01 LOGO V8.png')).resize({ width: 640 }).toBuffer()
  await sharp(Buffer.from(malha))
    .composite([{ input: logo, gravity: 'center' }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`${OUT}og-image.jpg`)
  console.log('og-image.jpg 1200x630')
}

writeFileSync(OUT + 'manifesto.json', JSON.stringify(manifesto, null, 1), 'utf8')
const total = Object.values(manifesto).reduce((s, m) => s + m.kb, 0)
console.log(`\n${Object.keys(manifesto).length} arquivos, ${(total / 1024).toFixed(2)} MB no total.`)
