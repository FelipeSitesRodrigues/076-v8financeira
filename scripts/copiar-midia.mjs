/**
 * Copia os vídeos e os documentos do Augusto pra dentro do site, com nome
 * limpo (sem espaço e sem acento, que quebram URL).
 *
 * Vídeo vai pra assets/video (cache longo na Vercel). Documento vai pra docs/,
 * fora de assets, de propósito: se o Augusto trocar o PDF mantendo o nome, o
 * visitante recebe o novo, e não uma cópia guardada por um ano no navegador.
 *
 * Os vídeos entram como vieram (576x1024, perto de 1 Mbps). Nenhum carrega com
 * a página: o player só busca o arquivo quando alguém aperta o play.
 *
 * Uso: node scripts/copiar-midia.mjs   (ou npm run midia)
 */
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const R = '../076 - V8 CONSULTORIA FINANCEIRA/Recursos Site/'

function achar(relativo) {
  let atual = R
  for (const parte of relativo.split('/')) {
    const nome = readdirSync(atual).find((n) => n.normalize('NFC') === parte.normalize('NFC'))
    if (!nome) throw new Error(`falta o arquivo: ${atual}${parte}`)
    atual = path.join(atual, nome)
  }
  return atual
}

const COPIAS = [
  // filme 01, o do topo da página (o Augusto pediu na página principal)
  ['VÍDEOS QUE O AUGUSTO QUER NO SITE/VIDEO 1.mp4', 'assets/video/filme-credito-negado.mp4'],
  // apontamento interno, na seção do problema
  ['VÍDEOS QUE O AUGUSTO QUER NO SITE/VIDEO 4.mp4', 'assets/video/filme-apontamento-interno.mp4'],
  // filme 02 do wireframe, autorização de consulta do SCR, junto do formulário
  ['VÍDEOS QUE O AUGUSTO QUER NO SITE/VIDEO 3.mp4', 'assets/video/filme-autorizacao-scr.mp4'],
  ['DOCUMENTOS EXPLICATIVOS DO SERVIÇO/TERMO DE AUTORIZAÇÃO PDF.pdf', 'docs/termo-de-autorizacao-v8.pdf'],
  ['DOCUMENTOS EXPLICATIVOS DO SERVIÇO/termo e contrato consultoria.pdf', 'docs/termo-de-condicoes-comerciais-v8.pdf'],
  ['DOCUMENTOS EXPLICATIVOS DO SERVIÇO/Minuta_Peticao_Reanalise_Correcao_SCR_Credito.docx', 'docs/minuta-peticao-correcao-scr.docx'],
]

for (const [origem, destino] of COPIAS) {
  mkdirSync(path.dirname(destino), { recursive: true })
  copyFileSync(achar(origem), destino)
  console.log(`${destino.padEnd(46)} ${(statSync(destino).size / 1024 / 1024).toFixed(2)} MB`)
}
