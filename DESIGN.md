---
name: V8 Consultoria e Assessoria Financeira
description: Painel financeiro noturno com a linha da virada do logo como assinatura
colors:
  mint: "#00f9a4"
  verde-agua: "#80efce"
  cromo: "#91d3be"
  cromo-claro: "#e6f4f0"
  verde: "#009048"
  verde-escuro: "#00603c"
  verde-abissal: "#002010"
  preto-esverdeado: "#020d09"
  carvao: "#081a14"
  branco-esverdeado: "#f0f7f4"
  cinza: "#7e9a90"
  texto-apoio: "#b8c6c2"
  alerta: "#ff4d5e"
typography:
  display:
    fontFamily: "Archivo Black, Arial Black, sans-serif"
    fontSize: "min(4.85vw, 4.25rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Archivo Black, Arial Black, sans-serif"
    fontSize: "clamp(2rem, 1.15rem + 2.35vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Archivo Black, Arial Black, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.02em"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.2em"
  price:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "clamp(3.9rem, 2rem + 5vw, 6.25rem)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.04em"
rounded:
  botao: "4px"
  caixa: "8px"
  chanfro: "16px"
spacing:
  gutter: "clamp(16px, 4.2vw, 60px)"
  secao: "clamp(80px, 8.4vw, 128px)"
  container: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.preto-esverdeado}"
    rounded: "{rounded.botao}"
    height: "56px"
    padding: "0 26px"
  button-ghost:
    backgroundColor: "rgb(2 13 9 / .4)"
    textColor: "{colors.branco-esverdeado}"
    rounded: "{rounded.botao}"
    height: "56px"
    padding: "0 26px"
  input:
    backgroundColor: "rgb(2 13 9 / .75)"
    textColor: "{colors.branco-esverdeado}"
    rounded: "{rounded.botao}"
    height: "52px"
    padding: "0 16px"
  panel-hud:
    backgroundColor: "rgb(8 26 20 / .74)"
    textColor: "{colors.branco-esverdeado}"
    padding: "28px"
---

# Design System: V8 Consultoria e Assessoria Financeira

## Overview

**Creative North Star: "O painel da virada"**

A página é um painel financeiro à noite: fundo preto esverdeado, malha técnica quase invisível, painéis de 1 px com o canto cortado e a luz vindo sempre de uma tela, em verde. Sobre isso corre a linha da virada, o traço do V do logo que desce, toca o vale e sobe mais alto do que começou, com nós mint nas inflexões. Ela aparece fina no hero, gigante em "Como funciona" (a assinatura do site) e fina de novo no rodapé.

Tudo é chapado, menos o logo: o símbolo cromado é o único objeto 3D do sistema, e por isso ele pode ser a peça central de uma seção inteira. O tom é de precisão e controle, não de banco tradicional nem de SaaS genérico: nada de azul, dourado, vidro pesado ou neon em tudo.

**Key Characteristics:**
- Um só acento, o mint, sobre fundo escuro; nunca como fundo de área grande
- Painéis HUD de 1 px com chanfro diagonal, fundo levemente translúcido
- Títulos em Archivo Black caixa alta, com o fim em mint
- Números, preço e rótulos em IBM Plex Mono
- A linha da virada como grafismo recorrente, desenhada pelo JS a partir dos nós reais
- Vermelho só onde existe problema de verdade

## Colors

Preto esverdeado e carvão alternando as seções, mint como a única cor que chama o olho.

### Primary
- **Mint** (#00f9a4): botão principal, final dos títulos, nós da linha, números em alta, estados ativos. Pequenas doses.

### Secondary
- **Verde-água** (#80efce): ícones de traço, detalhes finos, rótulo do hero.
- **Cromo** (#91d3be): legenda de vídeo e miolo dos nós apagados.

### Neutral
- **Preto esverdeado** (#020d09): fundo principal.
- **Carvão** (#081a14): seções alternadas (Como funciona, Pagamento, Dúvidas) e fundo dos painéis.
- **Branco esverdeado** (#f0f7f4): títulos e texto principal.
- **Texto de apoio** (color-mix de #e6f4f0 80% com #020d09, ~#b8c6c2): todo parágrafo secundário. Quase neutro, como no mockup, pra o mint seguir sozinho.
- **Cromo claro** (#e6f4f0): rótulos, links do rodapé, subtítulo do hero.
- **Cinza** (#7e9a90): texto miúdo (nota fiscal, aviso legal, linha sob o botão do formulário).
- **Verde escuro** (#00603c) e **verde** (#009048), em transparência: bordas dos painéis, fios internos, malha.

### Named Rules
**A regra do acento único.** O mint aparece em pontos, nunca em superfícies. Se uma área grande ficou mint, está errado.

**A regra do vermelho com motivo.** #ff4d5e só existe na seção "O problema" (painel "o que o banco vê", ícones de alerta) e em erro de formulário.

## Typography

**Display Font:** Archivo Black (com Arial Black)
**Body Font:** Instrument Sans (com a fonte do sistema)
**Label/Mono Font:** IBM Plex Mono

**Character:** o peso quadrado da Archivo Black dá o impacto de manchete; a Instrument Sans é limpa e legível no corpo; o mono traz o ar de dado bancário nos números e rótulos.

### Hierarchy
- **Display** (400, min(4.85vw, 4.25rem), 0.98): só o H1 do hero, em 4 linhas (2 brancas, 2 mint). O tamanho é travado pra primeira linha terminar antes do cartão da foto.
- **Headline** (400, clamp(2rem, 1.15rem + 2.35vw, 3rem), 1.04): títulos de seção, caixa alta, `text-wrap: balance`, final em mint (`<em>`).
- **Title** (400, 0.9375–1.0625rem, caixa alta, +0.02em): títulos de card de serviço, passo, painel e diferencial.
- **Body** (400, 1rem–1.0625rem, 1.55–1.62): parágrafos, máximo ~35rem por coluna.
- **Label** (IBM Plex Mono 500, 0.8125rem, +0.2em, caixa alta): rótulo de seção "01 / O PROBLEMA", com número e barra em mint.
- **Price** (IBM Plex Mono 500, clamp até 6.25rem, -0.04em, tabular): o R$ 2.850, com "R$" e ",00" pequenos.

## Layout

Container de 1320 px com respiro lateral de clamp(16px, 4.2vw, 60px) e seções de clamp(80px, 8.4vw, 128px). Breakpoints: celular até 767, tablet 768–1023, desktop 1024+; o menu vira sanduíche abaixo de 1180, e o nome por extenso ao lado do símbolo some entre 1180 e 1399.

No celular, a ordem do hero é título, foto, subtítulo, botões; a mesma lógica (título, imagem, texto) se repete no filme e em "Quem somos". Grades de 3 colunas viram 2 no tablet e 1 no celular. "Como funciona" é horizontal a partir de 1024 e linha do tempo vertical abaixo.

## Elevation & Depth

Profundidade vem de tom e luz, não de sombra. As seções alternam preto e carvão; atrás dos elementos principais há uma luz radial verde "subindo da base", como tela iluminando de baixo. Sombras existem só no botão mint (brilho curto com deslocamento) e no celular dos vídeos. Dentro de painel com chanfro não cabe sombra: o clip-path corta.

### Named Rules
**A regra da luz de tela.** Toda luz é verde e vem de baixo ou de trás, nunca de cima.

## Shapes

Três formas, cada uma com seu papel: botão e campo quase retos (4 px), caixa de ícone com 8 px, e painel HUD sem raio, com o canto de cima à direita cortado em diagonal (16 px; 12 px no celular). Cards de serviço cortam também o canto de baixo à esquerda; a faixa de selos corta os dois de cima. A diagonal ganha traço pelo mesmo ::before da borda, então o chanfro nunca fica sem linha.

## Components

### Buttons
- **Shape:** 4 px, altura 56 px (58 no hero, 46 no pequeno), Instrument Sans 700 caixa alta +0.07em.
- **Primary:** fundo mint, texto preto esverdeado, brilho mint curto embaixo.
- **Hover / Focus:** sobe 1 px, clareia pro mint claro, a seta anda 4 px; foco com contorno mint de 2 px afastado 3 px.
- **Ghost:** fundo quase transparente, contorno interno mint a 55%, ícone mint; no hover ganha um véu mint de 8%.
- **Card de serviço:** contorno mint, texto mint, divisória antes da seta.

### Cards / Containers
- **Corner Style:** chanfro (ver Shapes).
- **Background:** carvão translúcido (rgb(8 26 20 / .74)) ou degradê escuro.
- **Border:** 1 px verde a 45%; no hover dos cards vira mint a 50% e o card sobe 3 px.
- **Internal Padding:** 26–32 px no desktop, 16–22 px no celular.

### Inputs / Fields
- **Style:** 52 px, fundo preto a 75%, borda verde a 45%, rótulo acima (nunca placeholder como rótulo).
- **Focus:** borda mint e anel mint a 16%.
- **Error:** borda e mensagem em vermelho de alerta, embaixo do campo; o foco vai pro primeiro erro.

### Navigation
Header fixo translúcido com blur leve; ao rolar, o fundo fecha e uma linha mint acende da esquerda. Links Instrument Sans 600 caixa alta com sublinhado mint que cresce no hover e no item ativo. No celular, menu em tela cheia com links em Archivo Black, foco preso e Esc pra fechar.

### A linha da virada (componente assinatura)
SVG desenhado pelo JS passando pelo centro real de cada nó. Nós 01–03 apagados (anel cromo), 04–05 em mint, o 05 maior e com um pulso único. Desenha uma vez ao entrar na tela (desktop) ou nó a nó com a rolagem (celular), acendendo cada nó no instante em que o traço chega. Com movimento reduzido, aparece pronta.

### Celular de vídeo
Moldura com tela 9:16, capa estática tirada do próprio filme, play mint central, barra de progresso fina e tempo em mono. Nada baixa até o play.

## Do's and Don'ts

### Do:
- **Do** usar o mint só em acento: botão principal, final do título, nó, número.
- **Do** manter todo painel com borda de 1 px e o chanfro diagonal com traço.
- **Do** terminar os títulos de seção com a parte importante em mint, via `<em>`.
- **Do** tirar a copy do `copy-site.md`; o texto que aparece no mockup é referência de espaço, não de conteúdo.
- **Do** animar só opacity e transform nas entradas, e dar ao movimento reduzido o estado final direto.

### Don't:
- **Don't** usar azul, roxo ou dourado, nem vermelho fora da seção do problema e dos erros de formulário.
- **Don't** aplicar cromado, bisel ou volume em nada que não seja o logo.
- **Don't** usar glassmorphism pesado: o translúcido dos painéis é discreto e o blur fica no header e na faixa de selos.
- **Don't** inventar depoimento, número de clientes, estrelas ou selo: a V8 é nova e a prova é o processo.
- **Don't** pôr rótulo miúdo em cima de título que não seja o rótulo numerado de seção.
