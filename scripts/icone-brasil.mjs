/**
 * Desenha o contorno do Brasil do selo "Brasil inteiro" a partir do Natural
 * Earth (domínio público), em vez de traçar o mapa à mão.
 *
 * Projeção equirretangular com o cosseno da latitude média do país, que é o
 * que mantém a proporção certa numa área desse tamanho. Sai um path no mesmo
 * viewBox 24x24 dos ícones da Tabler, pra usar com o mesmo traço.
 *
 * Uso: node scripts/icone-brasil.mjs   (grava scripts/.cache/brasil.json)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const CACHE = 'scripts/.cache/ne_50m_countries.geojson'
const URL_NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
mkdirSync('scripts/.cache', { recursive: true })
if (!existsSync(CACHE)) writeFileSync(CACHE, Buffer.from(await (await fetch(URL_NE)).arrayBuffer()))
const geo = JSON.parse(readFileSync(CACHE, 'utf8'))
const br = geo.features.find((f) => f.properties.ADM0_A3 === 'BRA' || f.properties.ISO_A3 === 'BRA')
if (!br) throw new Error('Brasil não encontrado no GeoJSON')

// só o continente: o maior polígono (as ilhas somem num ícone de 24 px)
const polis = br.geometry.type === 'MultiPolygon' ? br.geometry.coordinates : [br.geometry.coordinates]
const anel = polis.map((p) => p[0]).sort((a, b) => b.length - a.length)[0]

const k = Math.cos((-14 * Math.PI) / 180)
const pts = anel.map(([lon, lat]) => [lon * k, -lat])
const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
const lado = 24 - 2 * 2.2 // margem pro traço de 1.5 não encostar na borda
const esc = lado / Math.max(x1 - x0, y1 - y0)
const ox = (24 - (x1 - x0) * esc) / 2, oy = (24 - (y1 - y0) * esc) / 2
let proj = pts.map(([x, y]) => [ox + (x - x0) * esc, oy + (y - y0) * esc])

// Simplificação por distância (Ramer-Douglas-Peucker), tolerância de 0,18 px
const rdp = (p, tol) => {
  if (p.length < 3) return p
  const [a, b] = [p[0], p[p.length - 1]]
  let dmax = 0, idx = 0
  for (let i = 1; i < p.length - 1; i++) {
    const [x, y] = p[i]
    const d = Math.abs((b[1] - a[1]) * x - (b[0] - a[0]) * y + b[0] * a[1] - b[1] * a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1])
    if (d > dmax) { dmax = d; idx = i }
  }
  return dmax > tol ? [...rdp(p.slice(0, idx + 1), tol).slice(0, -1), ...rdp(p.slice(idx), tol)] : [a, b]
}
// O anel é fechado (primeiro ponto = último): a distância até a corda daria
// divisão por zero. Parte o anel no ponto mais longe do início e simplifica
// cada metade.
proj = proj.slice(0, -1)
let longe = 0
for (let i = 1; i < proj.length; i++) {
  if (Math.hypot(proj[i][0] - proj[0][0], proj[i][1] - proj[0][1]) > Math.hypot(proj[longe][0] - proj[0][0], proj[longe][1] - proj[0][1])) longe = i
}
proj = [...rdp(proj.slice(0, longe + 1), 0.18).slice(0, -1), ...rdp([...proj.slice(longe), proj[0]], 0.18).slice(0, -1)]
const d = 'M' + proj.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z'
writeFileSync('scripts/.cache/brasil.json', JSON.stringify({ d, pontos: proj.length }), 'utf8')
console.log(`contorno com ${proj.length} pontos, ${d.length} caracteres`)
