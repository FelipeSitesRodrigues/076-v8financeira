/* Formulário da análise gratuita.
   Site estático, sem servidor: o envio monta a mensagem com os dados e abre
   o WhatsApp da V8 (padrão dos outros sites da casa). Sem número cadastrado,
   abre o e-mail com o mesmo texto.
   Validação no envio e, depois da primeira tentativa, a cada campo que o
   visitante deixa. CPF e CNPJ conferem os dígitos verificadores. */
(function () {
  'use strict'

  var form = document.querySelector('[data-form]')
  if (!form) return

  var digitos = function (s) {
    return String(s || '').replace(/\D/g, '')
  }

  // CNPJ alfanumérico: a Receita emite desde julho de 2026 (letras nas 12
  // primeiras posições). O campo aceita letra e número.
  var alfanum = function (s) {
    return String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  }

  // (11) 98765-4321 / (11) 3456-7890
  function mascaraFone(v) {
    var d = digitos(v).slice(0, 11)
    if (d.length <= 2) return d.length ? '(' + d : ''
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2)
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6)
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7)
  }

  // 000.000.000-00 até 11 dígitos; XX.XXX.XXX/XXXX-XX com letra ou com 12 a 14
  function mascaraDoc(v) {
    var d = alfanum(v).slice(0, 14)
    if (d.length <= 11 && !/[A-Z]/.test(d)) {
      return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4')
    }
    return d
      .replace(/^(\w{2})(\w)/, '$1.$2')
      .replace(/^(\w{2})\.(\w{3})(\w)/, '$1.$2.$3')
      .replace(/\.(\w{3})(\w)/, '.$1/$2')
      .replace(/(\w{4})(\w{1,2})$/, '$1-$2')
  }

  function cpfValido(c) {
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
    for (var t = 9; t < 11; t++) {
      var soma = 0
      for (var i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i)
      var dv = ((soma * 10) % 11) % 10
      if (dv !== Number(c[t])) return false
    }
    return true
  }

  // Cada caractere vale o código ASCII menos 48 (o dígito vale ele mesmo): a
  // regra da Receita serve pro CNPJ numérico e pro alfanumérico.
  function cnpjValido(c) {
    if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(\w)\1{13}$/.test(c)) return false
    var pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for (var t = 12; t < 14; t++) {
      var soma = 0
      var ps = pesos.slice(13 - t)
      for (var i = 0; i < t; i++) soma += (c.charCodeAt(i) - 48) * ps[i]
      var resto = soma % 11
      var dv = resto < 2 ? 0 : 11 - resto
      if (dv !== Number(c[t])) return false
    }
    return true
  }

  var campos = {
    nome: form.querySelector('#f-nome'),
    whatsapp: form.querySelector('#f-whats'),
    email: form.querySelector('#f-email'),
    documento: form.querySelector('#f-doc'),
    necessidade: form.querySelector('#f-precisa'),
    situacao: form.querySelector('#f-situacao'),
    aceite: form.querySelector('[name="aceite"]'),
  }
  var perfis = form.querySelectorAll('[name="perfil"]')

  var regras = {
    nome: function () {
      var v = campos.nome.value.trim()
      if (!v) return 'Escreva seu nome.'
      if (v.length < 3 || v.split(/\s+/).length < 2) return 'Escreva o nome completo, com sobrenome.'
    },
    whatsapp: function () {
      var d = digitos(campos.whatsapp.value)
      if (!d) return 'Informe seu WhatsApp com DDD.'
      if (d.length < 10) return 'Confira o número com DDD. Ex.: (11) 98765-4321.'
    },
    email: function () {
      var v = campos.email.value.trim()
      if (!v) return 'Informe seu e-mail.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Confira o e-mail. Ex.: nome@email.com.'
    },
    documento: function () {
      var d = alfanum(campos.documento.value)
      if (!d) return 'Informe seu CPF ou o CNPJ da empresa.'
      var ok = d.length === 11 && /^\d+$/.test(d) ? cpfValido(d) : d.length === 14 ? cnpjValido(d) : false
      if (!ok) return 'CPF ou CNPJ inválido. Confira os números.'
    },
    perfil: function () {
      for (var i = 0; i < perfis.length; i++) if (perfis[i].checked) return
      return 'Escolha pessoa física ou empresa.'
    },
    necessidade: function () {
      if (!campos.necessidade.value) return 'Escolha o que você precisa resolver.'
    },
    aceite: function () {
      if (!campos.aceite.checked) return 'Pra seguir, marque a autorização de contato.'
    },
  }

  var elementoDe = {
    perfil: perfis[0],
  }

  function marcar(nome) {
    var el = elementoDe[nome] || campos[nome]
    var campo = el.closest('.campo')
    var erro = campo.querySelector('.campo__erro')
    var msg = regras[nome]()
    campo.classList.toggle('erro', !!msg)
    campo.classList.toggle('ok', !msg && nome !== 'aceite' && nome !== 'perfil')
    if (erro) erro.textContent = msg || ''
    var alvos = nome === 'perfil' ? perfis : [el]
    for (var i = 0; i < alvos.length; i++) alvos[i].setAttribute('aria-invalid', msg ? 'true' : 'false')
    return msg
  }

  var tentou = false

  campos.whatsapp.addEventListener('input', function () {
    campos.whatsapp.value = mascaraFone(campos.whatsapp.value)
  })

  campos.documento.addEventListener('input', function () {
    campos.documento.value = mascaraDoc(campos.documento.value)
  })

  // depois da primeira tentativa, cada campo se corrige na hora
  form.addEventListener('focusout', function (e) {
    if (!tentou) return
    var nome = e.target.name
    if (regras[nome]) marcar(nome)
  })

  form.addEventListener('change', function (e) {
    if (!tentou) return
    var nome = e.target.name
    if (regras[nome]) marcar(nome)
  })

  var linkEnvio = ''

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    tentou = true
    var ordem = ['nome', 'whatsapp', 'email', 'documento', 'perfil', 'necessidade', 'aceite']
    var primeiroErro = null
    for (var i = 0; i < ordem.length; i++) {
      if (marcar(ordem[i]) && !primeiroErro) primeiroErro = ordem[i]
    }
    if (primeiroErro) {
      ;(elementoDe[primeiroErro] || campos[primeiroErro]).focus()
      return
    }

    var perfil = ''
    for (var p = 0; p < perfis.length; p++) if (perfis[p].checked) perfil = perfis[p].value
    var nome = campos.nome.value.trim().replace(/\s+/g, ' ')
    var linhas = [
      'Olá! Vim pelo site da V8 e quero minha *análise gratuita*.',
      '',
      '*Nome:* ' + nome,
      '*WhatsApp:* ' + mascaraFone(campos.whatsapp.value),
      '*E-mail:* ' + campos.email.value.trim(),
      '*CPF/CNPJ:* ' + mascaraDoc(campos.documento.value),
      '*Sou:* ' + perfil,
      '*Preciso resolver:* ' + campos.necessidade.value,
    ]
    var situacao = campos.situacao.value.trim()
    if (situacao) linhas.push('*Minha situação:* ' + situacao.replace(/\s+/g, ' '))
    var mensagem = linhas.join('\n')

    var numero = form.getAttribute('data-numero')
    var email = form.getAttribute('data-email')
    var textoCanal = form.querySelector('[data-canal-texto]')
    if (numero) {
      linkEnvio = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensagem)
    } else {
      linkEnvio = 'mailto:' + email + '?subject=' + encodeURIComponent('Análise gratuita pelo site') + '&body=' + encodeURIComponent(mensagem)
      textoCanal.textContent = 'Abrimos o seu e-mail com os dados já escritos. É só enviar.'
    }

    window.V8.rastrear('formulario_analise', 'Lead')

    form.querySelector('[data-nome]').textContent = nome.split(' ')[0]
    form.querySelector('[data-reabrir]').setAttribute('href', linkEnvio)
    form.classList.add('enviado')
    var sucesso = form.querySelector('.form__sucesso')
    sucesso.hidden = false

    // nova aba, como os outros botões de WhatsApp; se o navegador bloquear, vai na mesma
    var aba = numero ? window.open(linkEnvio, '_blank') : null
    if (aba) aba.opener = null
    else window.location.href = linkEnvio
  })
})()
