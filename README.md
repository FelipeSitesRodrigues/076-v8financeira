# 076 V8 Consultoria e Assessoria Financeira: site

Landing page única da V8. HTML, CSS e JS estático, montado por `build.mjs`, sem
nenhuma dependência em tempo de execução.

Documentação do projeto (copy, prompt de mockup, identidade, memória do cliente)
fica na pasta com acento, `sites/076 - V8 CONSULTORIA FINANCEIRA/`. Aqui mora só
o código.

## Rodar

```bash
npm install              # só na primeira vez
node build.mjs           # gera dist/
node scripts/serve.mjs   # http://localhost:3076
```

## Comandos

| Comando | O que faz |
|---|---|
| `node build.mjs` | monta `dist/index.html` com CSS, JS e o sprite de ícones embutidos |
| `node scripts/serve.mjs` | serve `dist/` com gzip e Range (o vídeo precisa), como a Vercel |
| `node scripts/print.mjs / --largura 390 --inteira --saida revisao/x.png` | print de revisão |
| `node scripts/testar.mjs` | console, estouro em 13 larguras, âncoras, imagem esticada, revelação com animação ligada, menu, acordeão, formulário e CLS |
| `node scripts/medir.mjs` | Lighthouse local, celular e desktop |
| `node scripts/processar-imagens.mjs` | regera as imagens e as capas dos vídeos a partir de `Recursos Site` |
| `node scripts/copiar-midia.mjs` | copia os vídeos e os documentos do Augusto com nome limpo |
| `node scripts/baixar-fontes.mjs` | rebaixa as fontes e reescreve `src/css/01-fontes.css` |
| `node scripts/icone-brasil.mjs` | redesenha o contorno do Brasil (Natural Earth) do selo "Brasil inteiro" |
| `node scripts/quadros-video.mjs <video> <pasta> 1.5 8` | tira quadros de um vídeo pelo Edge (a máquina não tem ffmpeg) |

`print`, `testar` e `medir` precisam do servidor rodando.

## Como o build funciona

`src/index.html` é o esqueleto. Dentro dele:

- `<?p 01-hero?>` puxa `src/partials/01-hero.html`
- `<?foto hero?>` vira um `<picture>` com AVIF, WebP, srcset e width/height, a partir
  de `src/fotos.json` e de `assets/img/manifesto.json`
- `<?video filme?>` vira o celular com o player, a partir de `src/videos.json`
- `{{chave}}` vem de `site.config.json`; `{{wpp|mensagem}}` vira link de WhatsApp com
  a mensagem já escrita
- `<?se chave?>…<?/se?>` e `<?nao chave?>…<?/nao?>` ligam e desligam blocos
- todo `href="#i-nome"` vira um símbolo no sprite, tirado da Tabler (traço) ou de
  `src/icones/` (o contorno do Brasil)

CSS e JS entram dentro do HTML de propósito: a página inteira chega numa resposta
só. Os arquivos de CSS e JS são numerados porque o build concatena em ordem.

## Decisões que valem saber

**Fidelidade ao mockup, copy do copy-site.** Layout, proporções e direção de arte vêm
dos mockups desktop e mobile; todo texto vem do `copy-site.md`. Onde o gerador de
mockup inventou frase ("Mais que crédito, liberdade para o seu futuro", o subtítulo dos
serviços, "Sonhos / Planos / Conquistas"), ficou a copy oficial ou nada.

**Seções sem foto.** "Quem somos" e "Análise gratuita" não tinham foto nos assets. Por
decisão do Felipe (2026-09-23) foram construídas sem ela: em "Quem somos" a peça central
é o símbolo 3D do logo; na análise, o vídeo 3 e o formulário. Quando a foto da sala de
operações existir, é trocar a chave `marca` de `src/fotos.json`.

**Vídeos.** VIDEO 1 logo depois do hero (pedido do Felipe), VIDEO 4 no problema, VIDEO 3
na análise gratuita e o VÍDEO 2 (o FILME 03 do wireframe, pagamento pós-pago) em Pagamentos:
do tablet pra cima o celular pousa no canto de baixo da foto do casal, sem cobrir os dois;
no celular entra depois do painel, com legenda. Nenhum baixa com a página: `preload="none"` e capa estática tirada
do próprio filme; o arquivo só começa a vir no play. Um toca por vez e pausa quando a
aba some.

**A linha da virada.** Em "Como funciona" o traço é desenhado pelo JS a partir do centro
real de cada nó, então acompanha qualquer largura e fonte. No desktop ele se desenha
inteiro quando a seção aparece e acende cada nó no instante em que chega nele; abaixo de
1024 vira linha do tempo vertical que cresce nó a nó com a rolagem e termina subindo pra
direita, como o V do logo.

**Movimento.** Entrada do hero em CSS (a foto só escala, sem opacidade, pra não atrasar o
LCP); o resto revela ao rolar com IntersectionObserver, só opacity e transform. Com
`prefers-reduced-motion` tudo aparece no estado final, sem deslocamento.

**Formulário.** Site sem servidor: o envio monta a mensagem com os dados e abre o WhatsApp
da V8 (sem número, abre o e-mail). Valida CPF e CNPJ pelos dígitos verificadores,
inclusive o CNPJ alfanumérico que a Receita emite desde julho de 2026.

**Imagens.** AVIF com WebP de reserva, várias larguras por foto; todo `img` tem width e
height (CLS zero). Hero pré-carregado por media query, uma versão pro celular e outra
pro desktop.

**Seções montadas sob demanda.** Da seção do filme em diante, cada bloco usa
`content-visibility: auto` (`src/css/16-desempenho.css`): o navegador só monta a seção quando
ela chega perto da tela. O layout do carregamento caiu de ~610 para ~240 ms com a CPU limitada
4x. A altura reservada de cada seção é a do conteúdo, SEM o padding (o navegador soma o padding
por cima); com o padding incluído, o menu mirava ~800 px além do destino no celular. Mesmo com
os números certos, o JS confere a posição no fim da rolagem de toda âncora e acerta de uma vez.
Mudou muito a altura de uma seção? Atualizar o número dela no CSS.

**Medição (2026-09-23, local).** Desktop: Lighthouse 100 em desempenho, acessibilidade, boas
práticas e SEO, CLS 0. Celular: acessibilidade, boas práticas e SEO 100, CLS 0; o desempenho
oscila de 83 a 99 no método simulado conforme a carga da máquina (ele multiplica por 4 o tempo
medido), e com limitação real de CPU o TBT dá 0 ms. O número oficial sai no PageSpeed depois do
deploy.

## O que falta antes de publicar

`site.config.json` lista tudo; o build avisa o que está vazio a cada execução.

1. **WhatsApp** (`whatsapp` e `whatsappExibicao`). Sem ele todo botão de WhatsApp cai no
   e-mail e o botão flutuante não aparece.
2. **E-mail**: `suporte@assessoriav8.com.br` veio do VIDEO 3 do Augusto. Confirmar.
3. **Domínio** (`dominio`), pro canonical, og:image absoluto, robots e sitemap. O VIDEO 3
   sugere `assessoriav8.com.br`.
4. **CNPJ**, **horário** e **Instagram**.
5. **Política de Privacidade e Termos de Uso**. Obrigatórias: o formulário coleta CPF e
   CNPJ (LGPD). Hoje o texto do consentimento cita a política sem link.
6. **Contrato x promessa do hero**: o termo comercial do Augusto (cláusulas 5 e 11) cobra
   pela conclusão do serviço, e o site promete "só paga depois que o crédito sair". Ajustar
   o termo antes de publicar (ver memoria.md do 076). O VÍDEO 2 do Augusto, que está na
   seção de pagamento, também diz "o cliente só paga após serviço concluído".
7. Pixel do Meta e GA4: o JS já dispara os eventos (`Contact` nos botões de WhatsApp,
   `Lead` no formulário e nos downloads) se os scripts estiverem na página.

## Deploy

GitHub e Vercel, como nos outros projetos. O `vercel.json` serve `dist/` sem instalar
nada, então rodar `node build.mjs` antes de cada push: é o `dist/` do repositório que vai
pro ar. Os quatro vídeos somam 49 MB, dentro do limite de arquivo do GitHub.
