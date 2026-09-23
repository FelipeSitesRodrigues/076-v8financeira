/* A linha da virada de "Como funciona".
   O traço passa pelo centro real de cada nó (medido no DOM), então acompanha
   qualquer largura e qualquer fonte. No desktop ele entra pela esquerda na
   altura do título, desce até o vale do passo 03 e sobe até a seta. Abaixo de
   1024 px vira linha do tempo vertical e termina subindo pra direita, como o
   V do logo.
   Desktop: desenha inteira quando a seção aparece, acendendo cada nó no
   instante em que o traço chega nele. Celular: cresce nó a nó conforme cada
   passo passa pelo meio da tela. */
(function () {
  'use strict'

  var secao = document.querySelector('[data-virada]')
  if (!secao) return

  var svg = secao.querySelector('.virada__svg')
  var linhas = Array.prototype.slice.call(svg.querySelectorAll('.virada__linha, .virada__halo'))
  var principal = svg.querySelector('.virada__linha')
  var seta = svg.querySelector('.virada__seta')
  var grad = svg.querySelector('linearGradient')
  var titulo = secao.querySelector('.como__titulo')
  var passos = Array.prototype.slice.call(secao.querySelectorAll('.passo'))
  var nos = passos.map(function (p) {
    return p.querySelector('.passo__no')
  })
  var largo = window.matchMedia('(min-width: 1024px)')
  var reduzido = window.V8.reduzido

  var fracoes = []
  var desenhada = false
  var atual = 1 // dashoffset atual (1 = nada desenhado)
  var anims = []

  var f = function (n) {
    return Math.round(n * 10) / 10
  }

  // Catmull-Rom em Bézier cúbica: curva suave que passa por todos os pontos.
  function segmentos(p) {
    var seg = []
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i]
      var p1 = p[i]
      var p2 = p[i + 1]
      var p3 = p[i + 2] || p2
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
      seg.push({ c1: c1, c2: c2, fim: p2 })
    }
    return seg
  }

  function caminho(inicio, seg) {
    return (
      'M' + f(inicio[0]) + ' ' + f(inicio[1]) +
      seg
        .map(function (s) {
          return 'C' + f(s.c1[0]) + ' ' + f(s.c1[1]) + ' ' + f(s.c2[0]) + ' ' + f(s.c2[1]) + ' ' + f(s.fim[0]) + ' ' + f(s.fim[1])
        })
        .join('')
    )
  }

  function medir() {
    var caixa = secao.getBoundingClientRect()
    var W = caixa.width
    var H = caixa.height
    if (!W || !H) return
    svg.setAttribute('viewBox', '0 0 ' + f(W) + ' ' + f(H))

    var pts = nos.map(function (n) {
      var r = n.getBoundingClientRect()
      return [r.left + r.width / 2 - caixa.left, r.top + r.height / 2 - caixa.top]
    })
    var ultimo = pts[pts.length - 1]
    var todos
    var ponta
    var tam

    if (largo.matches) {
      var t = titulo.getBoundingClientRect()
      var yTitulo = t.top + t.height * 0.62 - caixa.top
      var inicio = [-12, Math.min(yTitulo, pts[0][1] - 40)]
      var dx = Math.min(W * 0.075, 118)
      ponta = [ultimo[0] + dx, Math.max(yTitulo - 28, ultimo[1] - dx * 1.25)]
      tam = Math.max(18, Math.min(30, W * 0.02))
      todos = [inicio].concat(pts, [ponta])
      grad.setAttribute('x1', 0)
      grad.setAttribute('y1', 0)
      grad.setAttribute('x2', f(W))
      grad.setAttribute('y2', 0)
    } else {
      // Depois do 05 a linha desce pelo trilho até passar do texto, dobra e sai
      // pra direita subindo um pouco, com a seta no respiro antes da nota.
      var x = pts[0][0]
      tam = 13
      var fimLista = secao.querySelector('.virada__passos').getBoundingClientRect().bottom - caixa.top
      var dobra = [x, fimLista + 16]
      ponta = [x + 66, fimLista + 4]
      todos = [[x, pts[0][1] - 34]].concat(pts, [dobra, ponta])
      grad.setAttribute('x1', 0)
      grad.setAttribute('y1', f(pts[0][1]))
      grad.setAttribute('x2', 0)
      grad.setAttribute('y2', f(ultimo[1]))
    }

    // A seta segue a tangente do fim da curva. O traço termina na base dela,
    // pra a ponta arredondada da linha não furar a ponta da seta.
    var seg = segmentos(todos)
    var ult = seg[seg.length - 1]
    var ux = ponta[0] - ult.c2[0]
    var uy = ponta[1] - ult.c2[1]
    var len = Math.hypot(ux, uy) || 1
    ux /= len
    uy /= len
    var base = [ponta[0] - ux * tam * 0.72, ponta[1] - uy * tam * 0.72]
    todos[todos.length - 1] = base
    seg = segmentos(todos)

    var d = caminho(todos[0], seg)
    linhas.forEach(function (p) {
      p.setAttribute('d', d)
    })

    var nx = -uy
    var ny = ux
    var tras = [ponta[0] - ux * tam, ponta[1] - uy * tam]
    var meia = tam * 0.62
    seta.setAttribute(
      'd',
      'M' + f(ponta[0]) + ' ' + f(ponta[1]) +
        'L' + f(tras[0] + nx * meia) + ' ' + f(tras[1] + ny * meia) +
        'L' + f(tras[0] + ux * tam * 0.28) + ' ' + f(tras[1] + uy * tam * 0.28) +
        'L' + f(tras[0] - nx * meia) + ' ' + f(tras[1] - ny * meia) + 'Z'
    )
    seta.style.transformOrigin = f(ponta[0]) + 'px ' + f(ponta[1]) + 'px'

    // quanto do traço já foi desenhado quando ele chega em cada nó
    var total = principal.getTotalLength()
    var medidor = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svg.appendChild(medidor)
    fracoes = pts.map(function (_, i) {
      medidor.setAttribute('d', caminho(todos[0], seg.slice(0, i + 1)))
      return total ? medidor.getTotalLength() / total : 0
    })
    svg.removeChild(medidor)
  }

  function acendeAte(progresso) {
    for (var i = 0; i < passos.length; i++) {
      if (progresso >= fracoes[i] - 0.004) passos[i].classList.add('aceso')
    }
  }

  function tudoPronto() {
    desenhada = true
    atual = 0
    secao.classList.add('desenhada')
    passos.forEach(function (p) {
      p.classList.add('aceso')
    })
  }

  // leva o traço até "alvo" (0 = inteiro), acendendo os nós no caminho
  function desenharAte(alvo, duracao) {
    if (alvo >= atual) return
    // parte de onde o traço está agora, mesmo que a animação anterior não
    // tenha terminado (rolagem rápida no celular)
    var de = anims.length ? parseFloat(getComputedStyle(principal).strokeDashoffset) : atual
    if (isNaN(de)) de = atual
    anims.forEach(function (a) {
      a.cancel()
    })
    atual = alvo
    anims = linhas.map(function (p) {
      return p.animate([{ strokeDashoffset: de }, { strokeDashoffset: alvo }], {
        duration: duracao,
        easing: 'cubic-bezier(.3, .12, .2, 1)',
        fill: 'forwards',
      })
    })
    var a = anims[0]
    ;(function passo() {
      var t = a.effect.getComputedTiming().progress
      var feito = 1 - (de + (alvo - de) * (t == null ? 1 : t))
      acendeAte(feito)
      if (a.playState === 'running') requestAnimationFrame(passo)
      else acendeAte(1 - alvo)
    })()
    if (alvo === 0) {
      a.finished.then(function () {
        secao.classList.add('desenhada')
        seta.animate(
          [
            { opacity: 0, transform: 'scale(.3)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 520, easing: 'cubic-bezier(.16, 1, .3, 1)' }
        )
        desenhada = true
      })
    }
  }

  // Medir obriga o navegador a calcular o layout da página inteira. Feito no
  // carregamento (e de novo quando a fonte chegava), travava o celular: TBT de
  // ~500 ms no Lighthouse. Então a linha só é medida quando a seção chega
  // perto da tela e, daí em diante, acompanha as mudanças de tamanho.
  var medida = false
  function prepara() {
    if (medida) return
    medida = true
    medir()
    if (!('ResizeObserver' in window)) return
    var agendado = false
    var primeira = true
    new ResizeObserver(function () {
      // o observador avisa uma vez ao começar: essa medida acabou de ser feita
      if (primeira) {
        primeira = false
        return
      }
      if (agendado) return
      agendado = true
      requestAnimationFrame(function () {
        agendado = false
        medir()
      })
    }).observe(secao)
  }

  if (!('IntersectionObserver' in window)) {
    prepara()
    tudoPronto()
    return
  }

  var semAnimacao = reduzido.matches || !principal.animate
  var obsPerto = new IntersectionObserver(
    function (l) {
      if (!l[0].isIntersecting) return
      obsPerto.disconnect()
      prepara()
      if (semAnimacao) tudoPronto()
    },
    { rootMargin: '900px 0px 900px 0px' }
  )
  obsPerto.observe(secao)
  if (semAnimacao) return

  // desktop: desenha a linha inteira de uma vez quando a seção entra
  var obsSecao = new IntersectionObserver(
    function (l) {
      if (!l[0].isIntersecting || !largo.matches) return
      prepara()
      desenharAte(0, 1700)
      obsSecao.disconnect()
    },
    { threshold: 0.25 }
  )
  obsSecao.observe(secao)

  // celular: cada passo que chega no meio da tela puxa a linha até ele
  var obsPassos = new IntersectionObserver(
    function (l) {
      if (largo.matches || desenhada) return
      for (var i = 0; i < l.length; i++) {
        if (!l[i].isIntersecting) continue
        prepara()
        var idx = passos.indexOf(l[i].target)
        var alvo = idx === passos.length - 1 ? 0 : 1 - fracoes[idx]
        desenharAte(alvo, 700)
      }
    },
    { rootMargin: '0px 0px -42% 0px' }
  )
  passos.forEach(function (p) {
    obsPassos.observe(p)
  })

  // se virar desktop no meio (tablet girando), termina de uma vez
  largo.addEventListener('change', function () {
    if (!medida) return
    medir()
    if (!desenhada) desenharAte(0, 900)
  })
})()
