/* Player dos celulares. O vídeo só começa a baixar no play (preload none);
   até lá aparece a capa. Um vídeo toca por vez. Toca com som, porque quem
   aperta o play escolheu assistir. */
(function () {
  'use strict'

  var celulares = Array.prototype.slice.call(document.querySelectorAll('[data-video]'))
  if (!celulares.length) return

  function mmss(s) {
    if (!isFinite(s) || s < 0) s = 0
    var m = Math.floor(s / 60)
    var r = Math.floor(s % 60)
    return m + ':' + (r < 10 ? '0' : '') + r
  }

  var videos = celulares.map(function (c) {
    return c.querySelector('video')
  })

  celulares.forEach(function (cel) {
    var video = cel.querySelector('video')
    var play = cel.querySelector('.celular__play')
    var faixa = cel.querySelector('.celular__faixa')
    var agora = cel.querySelector('[data-agora]')
    var btTocar = cel.querySelector('[data-acao="tocar"]')
    var btSom = cel.querySelector('[data-acao="som"]')
    var btTela = cel.querySelector('[data-acao="tela"]')
    var arrastando = false

    function tocar() {
      videos.forEach(function (v) {
        if (v !== video && !v.paused) v.pause()
      })
      cel.classList.add('iniciado')
      if (video.readyState < 3) cel.classList.add('carregando')
      var p = video.play()
      if (p && p.catch) {
        p.catch(function () {
          cel.classList.remove('carregando')
        })
      }
      faixa.removeAttribute('tabindex')
      window.V8.rastrear('video_' + cel.getAttribute('data-video'), 'ViewContent')
    }

    play.addEventListener('click', tocar)

    btTocar.addEventListener('click', function () {
      if (video.paused || video.ended) tocar()
      else video.pause()
    })

    // tocar na tela pausa e continua, como no celular de verdade
    video.addEventListener('click', function () {
      if (!cel.classList.contains('iniciado')) return
      if (video.paused) tocar()
      else video.pause()
    })

    btSom.addEventListener('click', function () {
      video.muted = !video.muted
      cel.classList.toggle('mudo', video.muted)
      btSom.setAttribute('aria-label', video.muted ? 'Ligar o som' : 'Tirar o som')
    })

    btTela.addEventListener('click', function () {
      if (video.requestFullscreen) video.requestFullscreen()
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen()
    })

    video.addEventListener('playing', function () {
      cel.classList.remove('carregando')
      cel.classList.add('tocando')
      btTocar.setAttribute('aria-label', 'Pausar o vídeo')
    })

    video.addEventListener('waiting', function () {
      cel.classList.add('carregando')
    })

    video.addEventListener('pause', function () {
      cel.classList.remove('tocando', 'carregando')
      btTocar.setAttribute('aria-label', 'Continuar o vídeo')
    })

    // no fim volta a capa, pronta pra assistir de novo
    video.addEventListener('ended', function () {
      cel.classList.remove('tocando', 'iniciado')
      video.currentTime = 0
    })

    video.addEventListener('timeupdate', function () {
      if (arrastando || !video.duration) return
      var p = video.currentTime / video.duration
      faixa.value = Math.round(p * 1000)
      faixa.style.setProperty('--p', p * 100 + '%')
      agora.textContent = mmss(video.currentTime)
    })

    faixa.addEventListener('input', function () {
      arrastando = true
      var p = faixa.value / 1000
      faixa.style.setProperty('--p', p * 100 + '%')
      if (video.duration) {
        agora.textContent = mmss(p * video.duration)
        video.currentTime = p * video.duration
      }
    })

    faixa.addEventListener('change', function () {
      arrastando = false
    })
  })

  // saiu da aba: pausa, pra não seguir falando sozinho
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      videos.forEach(function (v) {
        if (!v.paused) v.pause()
      })
    }
  })
})()
