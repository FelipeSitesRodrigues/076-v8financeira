/**
 * Conferência automática antes de mostrar o site (Edge da máquina).
 *
 * - erro de console e requisição que falhou
 * - estouro horizontal em 13 larguras, com o elemento culpado
 * - marcação: 1 h1, imagem com alt e width/height, âncora que existe
 * - foto esticada: proporção desenhada x proporção real (fora object-fit)
 * - revelar ao rolar com animação LIGADA, rolando na roda do mouse: todo
 *   [data-revela] ganha .visivel e todo passo da linha ganha .aceso
 * - menu do celular, acordeão, formulário (erro e sucesso)
 * - CLS medido rolando a página no celular
 *
 * Uso: node scripts/serve.mjs  (noutro terminal)  e depois  node scripts/testar.mjs
 */
import puppeteer from 'puppeteer-core'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = process.env.BASE_URL || 'http://localhost:3076'
const LARGURAS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1366, 1440, 1536, 1920]

const navegador = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--hide-scrollbars'] })

let falhas = 0
const ok = (cond, msg) => {
  if (cond) console.log('  ok     ' + msg)
  else {
    falhas++
    console.log('  FALHA  ' + msg)
  }
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

const pag = await navegador.newPage()
const consoleErros = []
const redeErros = []
pag.on('console', (m) => m.type() === 'error' && consoleErros.push(m.text()))
pag.on('pageerror', (e) => consoleErros.push('pageerror: ' + e.message))
pag.on('requestfailed', (r) => {
  const u = r.url()
  if (!u.startsWith('mailto:') && !u.includes('wa.me')) redeErros.push(u + ' :: ' + r.failure().errorText)
})
pag.on('response', (r) => r.status() >= 400 && redeErros.push(r.status() + ' ' + r.url()))

await pag.setViewport({ width: 1440, height: 900 })
await pag.goto(BASE + '/', { waitUntil: 'networkidle0' })

// ------------------------------------------------------------------ marcação
console.log('\nMARCAÇÃO')
const m = await pag.evaluate(() => {
  const r = { h1: document.querySelectorAll('h1').length, semDim: [], semAlt: [], ancora: [], vazio: [], ids: [] }
  for (const img of document.images) {
    if (!img.getAttribute('width') || !img.getAttribute('height')) r.semDim.push(img.currentSrc || img.src)
    if (!img.hasAttribute('alt')) r.semAlt.push(img.currentSrc || img.src)
  }
  for (const a of document.querySelectorAll('a')) {
    const h = a.getAttribute('href')
    if (!h || h === '#') {
      if (!a.hasAttribute('data-reabrir')) r.vazio.push(a.textContent.trim().slice(0, 40))
    } else if (h.startsWith('#') && !document.getElementById(h.slice(1))) r.ancora.push(h)
  }
  const vistos = {}
  for (const el of document.querySelectorAll('[id]')) {
    if (vistos[el.id]) r.ids.push(el.id)
    vistos[el.id] = 1
  }
  return r
})
ok(m.h1 === 1, `1 h1 na página (${m.h1})`)
ok(!m.semDim.length, `toda imagem com width/height ${m.semDim.join(' ')}`)
ok(!m.semAlt.length, `toda imagem com alt ${m.semAlt.join(' ')}`)
ok(!m.ancora.length, `toda âncora existe ${m.ancora.join(' ')}`)
ok(!m.vazio.length, `nenhum link vazio ${m.vazio.join(' | ')}`)
ok(!m.ids.length, `nenhum id repetido ${m.ids.join(' ')}`)

// ------------------------------------------------------------ foto esticada
console.log('\nPROPORÇÃO DAS IMAGENS')
for (const w of [1440, 390]) {
  await pag.setViewport({ width: w, height: 900, isMobile: w < 768 })
  await pag.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 40))
    }
    window.scrollTo(0, 0)
  })
  await espera(1500)
  const tortas = await pag.evaluate(() =>
    [...document.images]
      .filter((i) => i.complete && i.naturalWidth && getComputedStyle(i).objectFit !== 'cover')
      .map((i) => {
        const r = i.getBoundingClientRect()
        const real = i.naturalWidth / i.naturalHeight
        const desenho = r.width / r.height
        return { src: (i.currentSrc || i.src).split('/').pop(), dif: Math.abs(desenho / real - 1) }
      })
      .filter((x) => x.dif > 0.03)
  )
  ok(!tortas.length, `${w}px: nenhuma imagem esticada ${tortas.map((t) => t.src + ' ' + (t.dif * 100).toFixed(1) + '%').join(', ')}`)
}

// ------------------------------------------------------------------ overflow
console.log('\nESTOURO HORIZONTAL')
for (const w of LARGURAS) {
  await pag.setViewport({ width: w, height: 900, isMobile: w < 768, hasTouch: w < 768 })
  await espera(200)
  const r = await pag.evaluate((largura) => {
    const doc = document.documentElement
    const culpados = []
    if (doc.scrollWidth > largura + 1) {
      for (const el of document.body.querySelectorAll('*')) {
        const c = el.getBoundingClientRect()
        if (!c.width || getComputedStyle(el).position === 'fixed') continue
        if (c.right > largura + 1.5) culpados.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ` [${Math.round(c.left)}..${Math.round(c.right)}]`)
      }
    }
    return { sw: doc.scrollWidth, culpados: culpados.slice(0, 4) }
  }, w)
  ok(r.sw <= w + 1, `${String(w).padStart(4)}px sem rolagem lateral (${r.sw})${r.culpados.length ? ' ' + r.culpados.join(', ') : ''}`)
}

// --------------------------------------------------- revelar (animação ligada)
console.log('\nREVELAR AO ROLAR (animação ligada, roda do mouse)')
for (const w of [1440, 390]) {
  const p = await navegador.newPage()
  await p.setViewport({ width: w, height: w < 768 ? 844 : 900, isMobile: w < 768, hasTouch: w < 768 })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  const altura = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < altura; y += 140) {
    await p.mouse.wheel({ deltaY: 140 })
    await espera(25)
  }
  await espera(2600)
  const r = await p.evaluate(() => ({
    presos: [...document.querySelectorAll('[data-revela]:not(.visivel)')].map((e) => e.tagName.toLowerCase() + '.' + (e.classList[0] || '?')),
    apagados: document.querySelectorAll('.passo:not(.aceso)').length,
    desenhada: document.querySelector('.como').classList.contains('desenhada'),
  }))
  ok(!r.presos.length, `${w}px: todo elemento animado aparece ${r.presos.join(', ')}`)
  ok(!r.apagados && r.desenhada, `${w}px: linha da virada desenhada e os 5 passos acesos (${5 - r.apagados}/5)`)
  await p.close()
}

// ------------------------------------------------------------ menu celular
console.log('\nMENU DO CELULAR')
await pag.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await pag.goto(BASE + '/', { waitUntil: 'networkidle0' })
await pag.click('.topo__hamb')
let e = await pag.evaluate(() => ({
  aberto: !document.getElementById('menu-celular').hidden,
  aria: document.querySelector('.topo__hamb').getAttribute('aria-expanded'),
  foco: document.activeElement && document.activeElement.textContent.trim(),
}))
ok(e.aberto && e.aria === 'true', 'abre e marca aria-expanded=true')
ok(/Apontamento/.test(e.foco || ''), `foco vai pro primeiro link (${e.foco})`)
await espera(700)
await pag.click('.menu-celular a[href="#pagamentos"]')
// a rolagem suave até o meio da página leva mais de um segundo
await pag.waitForFunction(() => Math.abs(document.getElementById('pagamentos').getBoundingClientRect().top) < 140, { timeout: 5000 }).catch(() => {})
await espera(300)
e = await pag.evaluate(() => ({
  aberto: !document.getElementById('menu-celular').hidden,
  y: Math.round(document.getElementById('pagamentos').getBoundingClientRect().top),
}))
ok(!e.aberto, 'fecha ao tocar num link')
ok(e.y >= 0 && e.y < 120, `rola até Pagamentos sem ficar embaixo do header (topo em ${e.y}px)`)
await pag.click('.topo__hamb')
await pag.keyboard.press('Escape')
e = await pag.evaluate(() => ({ aberto: !document.getElementById('menu-celular').hidden, foco: document.activeElement.className }))
ok(!e.aberto && String(e.foco).includes('topo__hamb'), 'Esc fecha e devolve o foco pro botão')

// ------------------------------------------------------------------ acordeão
console.log('\nACORDEÃO')
e = await pag.evaluate(async () => {
  const b = document.querySelector('#faq-p2')
  const antes = b.getAttribute('aria-expanded')
  b.click()
  await new Promise((r) => setTimeout(r, 500))
  const h = document.querySelector('#faq-r2').getBoundingClientRect().height
  return { antes, depois: b.getAttribute('aria-expanded'), h, primeira: document.querySelector('#faq-p1').getAttribute('aria-expanded') }
})
ok(e.primeira === 'true', 'primeira pergunta começa aberta')
ok(e.antes === 'false' && e.depois === 'true' && e.h > 20, `abre com aria-expanded e altura (${Math.round(e.h)}px)`)

// ---------------------------------------------------------------- formulário
console.log('\nFORMULÁRIO')
// rolagem instantânea direto no botão: com a suave, o clique saía no meio do
// caminho (desde que os termos entraram antes do formulário, ele fica longe
// do topo da seção)
await pag.evaluate(() => document.querySelector('.form__enviar').scrollIntoView({ block: 'center', behavior: 'instant' }))
await espera(900)
await pag.click('.form__enviar')
e = await pag.evaluate(() => ({
  erros: [...document.querySelectorAll('.campo.erro')].length,
  foco: document.activeElement.id,
}))
ok(e.erros === 7 && e.foco === 'f-nome', `vazio: 7 campos com erro e foco no primeiro (${e.erros}, ${e.foco})`)
await pag.type('#f-nome', 'Maria da Silva')
await pag.type('#f-whats', '11987654321')
await pag.type('#f-email', 'maria@email.com')
await pag.type('#f-doc', '52998224725')
// clique no rótulo "Pessoa física" (a bolinha do rádio é invisível), já com ele no meio da tela
await pag.evaluate(() => document.querySelector('.opcao').scrollIntoView({ block: 'center' }))
await espera(200)
await pag.click('.opcao span')
await pag.select('#f-precisa', 'Apontamento interno')
await pag.evaluate(() => document.querySelector('[name="aceite"]').click())
const mascaras = await pag.evaluate(() => ({ fone: document.querySelector('#f-whats').value, doc: document.querySelector('#f-doc').value }))
ok(mascaras.fone === '(11) 98765-4321' && mascaras.doc === '529.982.247-25', `máscaras (${mascaras.fone} / ${mascaras.doc})`)
e = await pag.evaluate(() => {
  const d = document.querySelector('#f-doc')
  d.value = '12.ABC.345/01DE-35'
  d.dispatchEvent(new Event('input'))
  return d.value
})
ok(e === '12.ABC.345/01DE-35', `CNPJ alfanumérico aceito na máscara (${e})`)
await pag.evaluate(() => {
  const d = document.querySelector('#f-doc')
  d.value = '529.982.247-25'
  d.dispatchEvent(new Event('input'))
  window.open = () => ({})
})
await pag.click('.form__enviar')
await espera(400)
e = await pag.evaluate(() => ({
  enviado: document.querySelector('.form').classList.contains('enviado'),
  visivel: !document.querySelector('.form__sucesso').hidden,
  nome: document.querySelector('.form [data-nome]').textContent,
  link: document.querySelector('.form [data-reabrir]').getAttribute('href'),
  erros: [...document.querySelectorAll('.form .campo.erro')].map((c) => c.querySelector('.campo__erro').textContent),
}))
ok(e.enviado && e.visivel && e.nome === 'Maria', `envio mostra a confirmação (${e.nome}${e.erros.length ? ', erros: ' + e.erros.join(' / ') : ''})`)
ok(/^(https:\/\/wa\.me\/|mailto:)/.test(e.link) && decodeURIComponent(e.link).includes('529.982.247-25'), 'mensagem montada com os dados')

// ---------------------------------------------------------------- console
console.log('\nCONSOLE E REDE')
ok(!consoleErros.length, `sem erro no console ${consoleErros.slice(0, 3).join(' | ')}`)
ok(!redeErros.length, `sem requisição quebrada ${redeErros.slice(0, 3).join(' | ')}`)

// -------------------------------------------------------------------- CLS
console.log('\nCLS (celular 390, rolando)')
const p2 = await navegador.newPage()
await p2.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true })
await p2.evaluateOnNewDocument(() => {
  window.__cls = 0
  new PerformanceObserver((l) => {
    for (const x of l.getEntries()) if (!x.hadRecentInput) window.__cls += x.value
  }).observe({ type: 'layout-shift', buffered: true })
})
await p2.goto(BASE + '/', { waitUntil: 'networkidle0' })
await p2.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 120))
  }
})
const cls = await p2.evaluate(() => window.__cls)
ok(cls < 0.05, `CLS ${cls.toFixed(4)}`)

// o resultado sai antes de fechar: no Windows o Edge às vezes demora a encerrar
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.')
await Promise.race([navegador.close(), new Promise((r) => setTimeout(r, 5000))])
process.exit(falhas ? 1 : 0)
