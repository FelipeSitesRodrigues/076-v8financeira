/**
 * Baixa as fontes do Google e grava em assets/fonts, junto com o @font-face
 * em src/css/01-fontes.css.
 *
 * Self-hosted por performance: fonts.googleapis.com custa DNS, TLS e dois
 * round-trips antes de o texto aparecer, e nenhum deles é cacheado entre sites
 * desde que os navegadores particionaram o cache.
 *
 * Só o subset latin, que cobre o português inteiro. A Instrument Sans vem como
 * fonte variável (um arquivo só de 400 a 700); as outras duas, num peso cada.
 *
 * Uso: node scripts/baixar-fontes.mjs   (ou npm run fontes)
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const FAMILIAS = [
  // Títulos, caixa alta. A Archivo Black só existe no peso 400.
  { css: 'Archivo Black', arquivo: 'archivo-black', eixo: 'wght@400' },
  // Corpo, botões e menu: 400 no texto, 500 e 600 nos rótulos.
  { css: 'Instrument Sans', arquivo: 'instrument-sans', eixo: 'wght@400..700' },
  // Números, preço, rótulos de seção.
  { css: 'IBM Plex Mono', arquivo: 'ibm-plex-mono-500', eixo: 'wght@500' },
]

// User-agent moderno: sem ele o Google devolve ttf em vez de woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

mkdirSync('assets/fonts', { recursive: true })
const regras = []

for (const fam of FAMILIAS) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam.css)}:${fam.eixo}&display=swap`
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text()

  // Volta um bloco por subset; o latin é o que cobre U+0000-00FF.
  const bloco = css
    .split('@font-face')
    .filter((b) => b.includes('src:'))
    .find((b) => b.includes('U+0000-00FF'))
  if (!bloco) throw new Error(`sem subset latin em ${fam.css}`)

  const src = bloco.match(/url\((https:[^)]+)\)/)[1]
  const range = bloco.match(/unicode-range:\s*([^;]+);/)[1].trim()
  const peso = bloco.match(/font-weight:\s*([^;]+);/)[1].trim()

  const arq = `${fam.arquivo}.woff2`
  const bin = Buffer.from(await (await fetch(src)).arrayBuffer())
  writeFileSync(`assets/fonts/${arq}`, bin)
  console.log(`${arq.padEnd(28)} peso ${peso.padEnd(8)} ${(bin.length / 1024).toFixed(1)} KB`)

  regras.push(`@font-face {
  font-family: '${fam.css}';
  font-style: normal;
  font-weight: ${peso};
  font-display: swap;
  src: url('/assets/fonts/${arq}') format('woff2');
  unicode-range: ${range};
}`)
}

writeFileSync(
  'src/css/01-fontes.css',
  `/* Gerado por scripts/baixar-fontes.mjs. Não editar à mão. */\n${regras.join('\n')}\n`,
  'utf8'
)
console.log('\nsrc/css/01-fontes.css atualizado.')
