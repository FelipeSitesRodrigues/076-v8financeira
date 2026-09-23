/* Base: revelar ao rolar, header, item ativo do menu, menu do celular e o
   botão flutuante. Sem biblioteca e sem escutar scroll: tudo sai de
   IntersectionObserver. */
window.V8 = (function () {
  'use strict'

  var doc = document
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Evento pro Pixel do Meta e pro GA4, se um dia estiverem na página. Sem
  // eles, não faz nada.
  function rastrear(nome, padrao) {
    try {
      if (window.gtag) window.gtag('event', nome)
      if (window.fbq) {
        if (padrao) window.fbq('track', padrao, { content_name: nome })
        else window.fbq('trackCustom', nome)
      }
    } catch (e) {}
  }

  doc.addEventListener('click', function (e) {
    var alvo = e.target.closest('[data-evento]')
    if (!alvo) return
    var nome = alvo.getAttribute('data-evento')
    var padrao = /^whatsapp/.test(nome) ? 'Contact' : /^download/.test(nome) ? 'Lead' : null
    rastrear(nome, padrao)
  })

  // --------------------------------------------------- revelar ao rolar
  // Dentro de um grupo, cada item ganha --i pela ordem, pra entrar em fila.
  var grupos = doc.querySelectorAll('[data-revela-grupo]')
  for (var g = 0; g < grupos.length; g++) {
    var itens = grupos[g].querySelectorAll('[data-revela]')
    for (var k = 0; k < itens.length; k++) itens[k].style.setProperty('--i', k)
  }

  var alvos = doc.querySelectorAll('[data-revela]')
  if ('IntersectionObserver' in window && !reduzido.matches) {
    var obs = new IntersectionObserver(
      function (linhas) {
        for (var i = 0; i < linhas.length; i++) {
          if (linhas[i].isIntersecting) {
            linhas[i].target.classList.add('visivel')
            obs.unobserve(linhas[i].target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )
    for (var i = 0; i < alvos.length; i++) obs.observe(alvos[i])
  } else {
    for (var j = 0; j < alvos.length; j++) alvos[j].classList.add('visivel')
  }

  // ------------------------------------------------------- header
  // Um marcador de 1 px no topo da página: quando ele sai da tela, o header
  // fecha o fundo e acende a linha.
  var topo = doc.getElementById('topo')
  var marco = doc.createElement('div')
  marco.setAttribute('aria-hidden', 'true')
  marco.style.cssText = 'position:absolute;top:24px;left:0;width:1px;height:1px;pointer-events:none'
  doc.body.prepend(marco)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (l) {
      topo.classList.toggle('rolou', !l[0].isIntersecting)
    }).observe(marco)
  }

  // --------------------------------------------- item ativo do menu
  var links = doc.querySelectorAll('.topo__nav a[href^="#"]')
  var secoes = []
  for (var m = 0; m < links.length; m++) {
    var alvo = doc.getElementById(links[m].getAttribute('href').slice(1))
    if (alvo) secoes.push({ link: links[m], el: alvo })
  }
  if ('IntersectionObserver' in window && secoes.length) {
    var visiveis = {}
    var obsSec = new IntersectionObserver(
      function (linhas) {
        for (var i = 0; i < linhas.length; i++) visiveis[linhas[i].target.id] = linhas[i].isIntersecting
        var atual = null
        for (var s = 0; s < secoes.length; s++) if (visiveis[secoes[s].el.id]) atual = secoes[s].link
        for (var l = 0; l < links.length; l++) links[l].classList.toggle('ativo', links[l] === atual)
      },
      // a faixa fica no meio da tela: a seção "ativa" é a que passa ali
      { rootMargin: '-45% 0px -50% 0px' }
    )
    for (var n = 0; n < secoes.length; n++) obsSec.observe(secoes[n].el)
  }

  // ------------------------------------------------- menu do celular
  var hamb = doc.querySelector('.topo__hamb')
  var menu = doc.getElementById('menu-celular')

  function focaveis() {
    return menu.querySelectorAll('a[href], button:not([disabled])')
  }

  function fechaMenu(devolverFoco) {
    if (menu.hidden) return
    menu.hidden = true
    hamb.setAttribute('aria-expanded', 'false')
    hamb.setAttribute('aria-label', 'Abrir menu')
    doc.documentElement.style.overflow = ''
    if (devolverFoco) hamb.focus()
  }

  function abreMenu() {
    var itens = menu.querySelectorAll('.menu-celular__nav li')
    for (var i = 0; i < itens.length; i++) itens[i].style.setProperty('--i', i)
    menu.hidden = false
    hamb.setAttribute('aria-expanded', 'true')
    hamb.setAttribute('aria-label', 'Fechar menu')
    doc.documentElement.style.overflow = 'hidden'
    topo.classList.add('rolou')
    var primeiro = focaveis()[0]
    if (primeiro) primeiro.focus({ preventScroll: true })
  }

  if (hamb && menu) {
    hamb.addEventListener('click', function () {
      if (hamb.getAttribute('aria-expanded') === 'true') fechaMenu(false)
      else abreMenu()
    })

    // fecha ao escolher um destino; a rolagem até a âncora segue normal
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) fechaMenu(false)
    })

    doc.addEventListener('keydown', function (e) {
      if (menu.hidden) return
      if (e.key === 'Escape') return fechaMenu(true)
      if (e.key !== 'Tab') return
      // foco preso entre o botão do menu e os links, enquanto aberto
      var lista = [hamb].concat(Array.prototype.slice.call(focaveis()))
      var ini = lista[0]
      var fim = lista[lista.length - 1]
      if (e.shiftKey && doc.activeElement === ini) {
        e.preventDefault()
        fim.focus()
      } else if (!e.shiftKey && doc.activeElement === fim) {
        e.preventDefault()
        ini.focus()
      }
    })

    // voltar pro desktop com o menu aberto deixaria a página travada
    window.matchMedia('(min-width: 1180px)').addEventListener('change', function (q) {
      if (q.matches) fechaMenu(false)
    })
  }

  // ------------------------------------------------ âncoras do menu
  // Com content-visibility, a seção que ainda não foi montada reserva uma
  // altura estimada; se ela montar no caminho com outra altura, a rolagem
  // termina fora do destino. No fim da rolagem, confere e acerta de uma vez.
  var pendente = null
  var folga = function () {
    return parseFloat(getComputedStyle(doc.documentElement).scrollPaddingTop) || 0
  }
  function acertaAncora() {
    if (!pendente || Date.now() > pendente.ate) {
      pendente = null
      return
    }
    var alvo = pendente.alvo
    pendente = null
    var dif = alvo.getBoundingClientRect().top - folga()
    if (Math.abs(dif) > 3) window.scrollBy({ top: dif, behavior: 'instant' })
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]')
    if (!a || a.getAttribute('href').length < 2) return
    var alvo = doc.getElementById(a.getAttribute('href').slice(1))
    if (!alvo) return
    pendente = { alvo: alvo, ate: Date.now() + 4000 }
    if (!('onscrollend' in window)) setTimeout(acertaAncora, 1400)
  })
  if ('onscrollend' in window) window.addEventListener('scrollend', acertaAncora)

  // ------------------------------------------------ WhatsApp flutuante
  var flutuante = doc.querySelector('.flutuante')
  var hero = doc.querySelector('.hero')
  if (flutuante && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      function (l) {
        flutuante.classList.toggle('visivel', !l[0].isIntersecting)
      },
      { rootMargin: '-35% 0px 0px 0px' }
    ).observe(hero)
  } else if (flutuante) {
    flutuante.classList.add('visivel')
  }

  return { rastrear: rastrear, reduzido: reduzido }
})()
