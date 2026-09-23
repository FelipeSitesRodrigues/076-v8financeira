/**
 * Build do site da V8.
 *
 * Monta dist/index.html a partir de src/, com CSS e JS embutidos no HTML.
 * Embutir é de propósito: a página inteira chega numa resposta só, sem
 * round-trip extra pra CSS nem pra JS antes do primeiro pixel.
 *
 * - src/index.html é o esqueleto. <?p nome?> puxa src/partials/nome.html.
 * - <?foto chave?> vira um <picture> com AVIF, WebP, srcset e width/height,
 *   a partir de src/fotos.json e de assets/img/manifesto.json.
 * - {{chave}} vem de site.config.json. Chave vazia apaga o bloco marcado com
 *   <?se chave?> ... <?/se?> (e mostra o <?nao chave?> ... <?/nao?>), pra não
 *   sobrar link morto no ar.
 * - {{wpp|mensagem}} vira link de WhatsApp com a mensagem já escrita.
 * - Os ícones usados no HTML (href="#i-nome" e "#if-nome") viram um sprite
 *   só com eles, tirado da Tabler (traço) ou de src/icones/ (desenho próprio).
 * - assets/ e docs/ são copiados pra dist/.
 *
 * Uso: node build.mjs   (ou npm run build)
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const cfg = JSON.parse(readFileSync('site.config.json', 'utf8'))
const fotos = JSON.parse(readFileSync('src/fotos.json', 'utf8'))
const manifesto = JSON.parse(readFileSync('assets/img/manifesto.json', 'utf8'))
const ler = (p) => readFileSync(p, 'utf8')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// ------------------------------------------------------------------ css e js
// Concatena em ordem alfabética (por isso os arquivos são numerados).
// No JS, cada arquivo é um IIFE: o ";" entre eles impede que o seguinte seja
// lido como chamada do anterior.
const juntar = (pasta, ext) =>
  readdirSync(pasta)
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => ler(join(pasta, f)))
    .join(ext === '.js' ? '\n;\n' : '\n')

// Minificação conservadora: só comentário e espaço redundante. Não mexe em
// espaço perto de ":" ou ">", que muda o sentido de seletor (".a :is(.b)").
const minCss = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()

const minJs = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()

const css = minCss(juntar('src/css', '.css'))
const js = minJs(juntar('src/js', '.js'))

// ------------------------------------------------------------------- fotos
const IMG = '/assets/img/'
const conjunto = (base, larguras, ext) => larguras.map((w) => `${IMG}${base}-${w}.${ext} ${manifesto[`${base}-${w}.${ext}`].w}w`).join(', ')
const dim = (base, larguras) => {
  const maior = manifesto[`${base}-${Math.max(...larguras)}.webp`]
  if (!maior) throw new Error(`imagem sem manifesto: ${base} (rode npm run imagens)`)
  return maior
}

function picture(chave) {
  const f = fotos[chave]
  if (!f) throw new Error(`foto não cadastrada em src/fotos.json: ${chave}`)
  const partes = []
  for (const fonte of f.fontes || []) {
    const d = dim(fonte.base, fonte.larguras)
    for (const ext of ['avif', 'webp']) {
      partes.push(
        `<source type="image/${ext}" media="${fonte.media}" srcset="${conjunto(fonte.base, fonte.larguras, ext)}" sizes="${fonte.sizes}" width="${d.w}" height="${d.h}">`
      )
    }
  }
  const d = dim(f.base, f.larguras)
  partes.push(`<source type="image/avif" srcset="${conjunto(f.base, f.larguras, 'avif')}" sizes="${f.sizes}">`)
  const meio = f.larguras.slice().sort((a, b) => a - b)[Math.floor((f.larguras.length - 1) / 2)]
  const carregar = f.prioridade ? 'fetchpriority="high"' : 'loading="lazy"'
  partes.push(
    `<img src="${IMG}${f.base}-${meio}.webp" srcset="${conjunto(f.base, f.larguras, 'webp')}" sizes="${f.sizes}" ` +
      `width="${d.w}" height="${d.h}" alt="${esc(f.alt)}"${f.classe ? ` class="${f.classe}"` : ''} ${carregar} decoding="async">`
  )
  return `<picture${f.picture ? ` class="${f.picture}"` : ''}>${partes.join('')}</picture>`
}

// ------------------------------------------------------------------ vídeos
// Celular com o player. O <video> não tem poster nem preload: a capa é um
// <picture> lazy por cima, e o arquivo só começa a baixar no play.
const videos = JSON.parse(readFileSync('src/videos.json', 'utf8'))

function celular(chave) {
  const v = videos[chave]
  if (!v) throw new Error(`vídeo não cadastrado em src/videos.json: ${chave}`)
  const tamanhos = '(min-width: 1024px) 290px, 280px'
  const capa =
    `<picture class="celular__capa"><source type="image/avif" srcset="${conjunto(v.capa, [400, 576], 'avif')}" sizes="${tamanhos}">` +
    `<img src="${IMG}${v.capa}-400.webp" srcset="${conjunto(v.capa, [400, 576], 'webp')}" sizes="${tamanhos}" width="576" height="1024" alt="" loading="lazy" decoding="async"></picture>`
  return `<figure class="celular" data-video="${chave}">
  <div class="celular__aparelho">
    <div class="celular__tela">
      <video class="celular__video" preload="none" playsinline width="576" height="1024" aria-label="${esc(v.titulo)}"><source src="/assets/video/${v.arquivo}" type="video/mp4"></video>
      ${capa}
      <span class="celular__ilha" aria-hidden="true"></span>
      <button class="celular__play" type="button" aria-label="Assistir: ${esc(v.titulo)}, ${esc(v.falado)}"><svg class="ic ic--cheio" aria-hidden="true"><use href="#if-player-play"/></svg></button>
      <div class="celular__controles">
        <input class="celular__faixa" type="range" min="0" max="1000" step="1" value="0" aria-label="Posição do vídeo" tabindex="-1">
        <button class="celular__btn" type="button" data-acao="tocar" aria-label="Pausar ou continuar o vídeo"><svg class="ic ic--cheio i-play" aria-hidden="true"><use href="#if-player-play"/></svg><svg class="ic ic--cheio i-pause" aria-hidden="true"><use href="#if-player-pause"/></svg></button>
        <span class="celular__tempo"><span data-agora>0:00</span> / ${v.duracao}</span>
        <span class="celular__lado">
          <button class="celular__btn" type="button" data-acao="som" aria-label="Tirar o som"><svg class="ic i-som" aria-hidden="true"><use href="#i-volume"/></svg><svg class="ic i-mudo" aria-hidden="true"><use href="#i-volume-off"/></svg></button>
          <button class="celular__btn" type="button" data-acao="tela" aria-label="Ver em tela cheia"><svg class="ic" aria-hidden="true"><use href="#i-maximize"/></svg></button>
        </span>
      </div>
    </div>
  </div>${v.legenda ? `\n  <figcaption class="celular__legenda"><svg class="ic" aria-hidden="true"><use href="#i-player-play"/></svg>${esc(v.legenda)}</figcaption>` : ''}
</figure>`
}

// ------------------------------------------------------------------ montagem
let html = ler('src/index.html')

// partials, com voltas a mais caso um partial inclua outro
for (let i = 0; i < 3; i++) html = html.replace(/<\?p ([\w-]+)\?>/g, (_, nome) => ler(`src/partials/${nome}.html`))

html = html.replace(/<\?foto ([\w-]+)\?>/g, (_, chave) => picture(chave))
html = html.replace(/<\?video ([\w-]+)\?>/g, (_, chave) => celular(chave))

// chaves derivadas
cfg.temContato = !!(cfg.whatsapp || cfg.email)

html = html.replace(/<\?se (\w+)\?>([\s\S]*?)<\?\/se\?>/g, (_, chave, dentro) => (cfg[chave] ? dentro : ''))
html = html.replace(/<\?nao (\w+)\?>([\s\S]*?)<\?\/nao\?>/g, (_, chave, dentro) => (cfg[chave] ? '' : dentro))

// Link de WhatsApp com a mensagem daquele botão já escrita: {{wpp|mensagem}}.
// Regra da casa: um botão por serviço, com o assunto preenchido. Sem número
// cadastrado cai no e-mail com o mesmo texto, pra nunca virar link morto.
const linkWpp = (msg) =>
  cfg.whatsapp
    ? `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`
    : `mailto:${cfg.email}?subject=${encodeURIComponent('Contato pelo site da V8')}&body=${encodeURIComponent(msg)}`
html = html.replace(/\{\{wpp\|([^}]+)\}\}/g, (_, msg) => esc(linkWpp(msg.trim())))

// Dados estruturados: só entra o que existe de verdade.
const url = cfg.dominio ? cfg.dominio.replace(/\/$/, '') : ''
const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: 'V8 Consultoria e Assessoria Financeira',
  legalName: 'V8 Assessoria e Consultoria Financeira LTDA',
  description:
    'Análise, contestação e correção de apontamento interno, rating bancário, score interno e dados do SCR do Banco Central. Atendimento 100% digital em todo o Brasil.',
  areaServed: { '@type': 'Country', name: 'Brasil' },
  priceRange: 'R$ 2.850',
  ...(url && { url: url + '/', logo: `${url}/assets/img/favicon-512.png`, image: `${url}/assets/img/og-image.jpg` }),
  ...(cfg.email && { email: cfg.email }),
  ...(cfg.whatsappExibicao && { telephone: cfg.whatsappExibicao }),
  ...(cfg.cnpj && { taxID: cfg.cnpj }),
  ...(cfg.instagram && { sameAs: [cfg.instagram] }),
}

html = html.replace(/\{\{(\w+)\}\}/g, (_, chave) => {
  if (chave === 'ano') return String(new Date().getFullYear())
  if (chave === 'jsonld') return JSON.stringify(jsonld)
  if (chave === 'whatsappLink') return esc(linkWpp(cfg.whatsappMensagem || ''))
  if (chave === 'urlBase') return url
  return esc(cfg[chave] ?? '')
})

// ------------------------------------------------------------- sprite de ícones
const usados = [...new Set([...html.matchAll(/href="#(if?)-([\w-]+)"/g)].map((m) => `${m[1]}-${m[2]}`))].sort()
const simbolos = usados.map((id) => {
  const cheio = id.startsWith('if-')
  const nome = id.replace(/^if?-/, '')
  const proprio = `src/icones/${nome}.svg`
  const tabler = `node_modules/@tabler/icons/icons/${cheio ? 'filled' : 'outline'}/${nome}.svg`
  const arq = existsSync(proprio) ? proprio : tabler
  if (!existsSync(arq)) throw new Error(`ícone não encontrado: ${id}`)
  const miolo = ler(arq)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>[\s\S]*$/, '')
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/>/g, '/>')
    .trim()
  return `<symbol id="${id}" viewBox="0 0 24 24">${miolo}</symbol>`
})
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;overflow:hidden">${simbolos.join('')}</svg>`
html = html.replace('<!--SPRITE-->', sprite)

html = html.replace('/*CSS*/', css).replace('/*JS*/', js)

// sobra de marcação de template é erro de digitação: melhor parar aqui
const sobra = html.match(/\{\{[^}]*\}\}|<\?(p|se|nao|foto|video)[^?]*\?>|<\?\/(se|nao)\?>/)
if (sobra) throw new Error(`marcação não resolvida no HTML: ${sobra[0]}`)

// ------------------------------------------------------------------- escrita
if (existsSync('dist')) rmSync('dist', { recursive: true })
mkdirSync('dist', { recursive: true })
writeFileSync('dist/index.html', html, 'utf8')
cpSync('assets', 'dist/assets', { recursive: true, filter: (f) => !f.endsWith('manifesto.json') })
if (existsSync('docs')) cpSync('docs', 'dist/docs', { recursive: true })
if (existsSync('src/site.webmanifest')) cpSync('src/site.webmanifest', 'dist/site.webmanifest')

// robots e sitemap pedem endereço absoluto: sem domínio, o sitemap fica de fora
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n${url ? `\nSitemap: ${url}/sitemap.xml\n` : ''}`, 'utf8')
if (url) {
  const hoje = new Date().toISOString().slice(0, 10)
  writeFileSync(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}/</loc><lastmod>${hoje}</lastmod></url>\n</urlset>\n`,
    'utf8'
  )
}

// ------------------------------------------------------------------ relatório
const kb = (s) => (Buffer.byteLength(s, 'utf8') / 1024).toFixed(1) + ' KB'
console.log(`dist/index.html  ${kb(html)}   (css ${kb(css)} + js ${kb(js)} embutidos, ${usados.length} ícones)`)

const faltando = ['whatsapp', 'email', 'cnpj', 'dominio', 'politicaPrivacidade', 'termosDeUso', 'instagram', 'horario'].filter((k) => !cfg[k])
if (faltando.length) {
  console.log(`\nAinda sem valor em site.config.json: ${faltando.join(', ')}`)
  console.log('Esses blocos saíram do HTML em vez de virar link morto.')
  if (!cfg.whatsapp) console.log('Sem whatsapp, todo botão de WhatsApp cai no e-mail e o botão flutuante some.')
}
