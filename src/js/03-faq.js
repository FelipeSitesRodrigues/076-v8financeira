/* Acordeão das dúvidas. A animação de altura é do CSS (grid-template-rows de
   0fr a 1fr); aqui só troca o estado e o aria-expanded. Cada pergunta abre e
   fecha sozinha, sem fechar as outras. */
(function () {
  'use strict'

  var faq = document.querySelector('[data-faq]')
  if (!faq) return

  faq.addEventListener('click', function (e) {
    var botao = e.target.closest('.faq__pergunta')
    if (!botao) return
    var item = botao.closest('.faq__item')
    var abrir = botao.getAttribute('aria-expanded') !== 'true'
    botao.setAttribute('aria-expanded', abrir ? 'true' : 'false')
    item.classList.toggle('aberto', abrir)
    if (abrir) window.V8.rastrear('faq_abre')
  })
})()
