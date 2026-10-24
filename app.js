(function () {
  'use strict';

  /* ================== Configuração ================== */
  // Chave Pix para a aba "Apoie". Deixe vazio até ter uma chave real.
  var PIX_KEY = 'afcd0024-28e9-4629-be7a-2274d5e1b9b3';

  var CANDS = {
    flavio: { nome: 'Flávio Bolsonaro', curto: 'Flávio', partido: 'PL', foto: 'flavio22-foto-flavio-web.webp', ring: '#1f5fd1' },
    lula:   { nome: 'Luiz Inácio Lula da Silva', curto: 'Lula', partido: 'PT', foto: 'lula.webp', ring: '#d12a2a' }
  };

  var VERDICTS = [
    { key: 'VERDADEIRO',          label: 'Verdadeiro',        c: 'var(--v-verdadeiro)', g: '✓' },
    { key: 'VERDADEIRO, MAS...',  label: 'Verdadeiro, mas...', c: 'var(--v-mas)',        g: '✓' },
    { key: 'NÃO É BEM ASSIM',     label: 'Não é bem assim',    c: 'var(--v-nao)',        g: '≈' },
    { key: 'EXAGERADO',           label: 'Exagerado',          c: 'var(--v-exagerado)',  g: '▲' },
    { key: 'DISTORCIDO',          label: 'Distorcido',         c: 'var(--v-distorcido)', g: '↯' },
    { key: 'FALSO',               label: 'Falso',              c: 'var(--v-falso)',      g: '✕' },
    { key: 'SEM PROVAS',          label: 'Sem provas',         c: 'var(--v-sem)',        g: '?' }
  ];
  var VMAP = {};
  VERDICTS.forEach(function (v) { VMAP[v.key] = v; });

  var FALAS = (window.FALAS || []).slice().sort(function (a, b) { return a.id - b.id; });
  var PAGE = 15;

  /* ================== Utilitários ================== */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function pct(n, t) { return t ? (n / t * 100).toFixed(1).replace('.', ',') + '%' : '0%'; }
  function baseUrl() { return location.href.split('#')[0]; }
  function linkFor(f) { return baseUrl() + '#fala-' + f.id; }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }
  function copy(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(okMsg); } catch (e) { toast('Não foi possível copiar'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    } else { fallback(); }
  }

  /* ================== Texto de compartilhamento ================== */
  // Monta o texto exato da fala escolhida (quem disse, o que disse, veredito, motivo, fontes e link direto).
  function shareText(f, forX) {
    var c = CANDS[f.candidato];
    var v = VMAP[f.classificacao];
    var fontes = f.fontes.slice(0, 2).map(function (s) { return s.nome; });
    if (forX) {
      return c.nome + ' disse: “' + trunc(f.trecho, 150) + '”\n\nVeredito Fato Veraz: ' + v.label.toUpperCase() + '.';
    }
    return [
      '*FATO VERAZ* — checagem de fala',
      '',
      '*' + c.nome + ' disse:*',
      '“' + trunc(f.trecho, 600) + '”',
      '',
      '⚖️ *Veredito: ' + v.label.toUpperCase() + '*',
      trunc(f.motivo, 700),
      '',
      '🔎 Fontes: ' + fontes.join(' | '),
      '',
      '👉 Fala completa, motivo e fontes: ' + linkFor(f),
      '_“A paz, se possível, mas a verdade a qualquer preço.”_'
    ].join('\n');
  }
  function waUrl(f) { return 'https://wa.me/?text=' + encodeURIComponent(shareText(f, false)); }
  function xUrl(f) {
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText(f, true)) + '&url=' + encodeURIComponent(linkFor(f));
  }

  /* ================== Ícones ================== */
  var ICON = {
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.500 8.500a5 5 0 0 1 0 7"/><path d="M18.500 5.500a9 9 0 0 1 0 13"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.6-4.8A9 9 0 1 1 8 19.6z"/><path d="M9.2 8.6c0 3.3 2.9 6.200 6.200 6.200l1.200-1.500-2-1-.9.800c-1-.4-1.900-1.300-2.300-2.300l.8-.9-1-2z" fill="currentColor" stroke="none"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.300 21H2.200l7.200-8.300L2 3h6.400l4.400 5.800L17.800 3zm-1.100 16.200h1.700L7.400 4.700H5.600l11.100 14.500z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.500 4.500 0 0 0 6.400 0l3-3a4.500 4.500 0 0 0-6.400-6.400l-1 1"/><path d="M14 10a4.500 4.500 0 0 0-6.400 0l-3 3a4.500 4.500 0 0 0 6.400 6.400l1-1"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>'
  };

  /* ================== Cartão de fala ================== */
  function cardHtml(f) {
    var c = CANDS[f.candidato];
    var v = VMAP[f.classificacao];
    var long = f.trecho.length > 420;
    var srcs = f.fontes.map(function (s) {
      var alta = /^alta/i.test(s.confianca);
      return '<li><span>' + esc(s.nome) + '</span><span class="conf' + (alta ? '' : ' media') + '">' + esc(s.confianca) + ' confiabilidade</span></li>';
    }).join('');
    return '' +
    '<article class="fala" id="fala-' + f.id + '" data-id="' + f.id + '" style="--vc:' + v.c + '">' +
      '<div class="fala__head">' +
        '<img class="avatar" style="--ring:' + c.ring + '" src="' + c.foto + '" alt="Foto de ' + esc(c.nome) + '" loading="lazy">' +
        '<div class="fala__who"><span class="fala__name">' + esc(c.curto.toUpperCase()) + ' DISSE' + (f.resposta ? ' · DIREITO DE RESPOSTA' : '') + '</span>' +
        '<span class="fala__meta">' + esc(f.tema) + ' · ' + esc(f.inicio) + '</span></div>' +
        '<span class="fala__num">Nº ' + f.id + '</span>' +
      '</div>' +
      '<p class="fala__quote' + (long ? ' clamp' : '') + '">' + esc(f.trecho) + '</p>' +
      (long ? '<button class="more" type="button" data-more>Ler fala completa</button>' : '') +
      '<div class="verdict">' +
        '<span class="badge"><span aria-hidden="true">' + v.g + '</span>' + esc(f.classificacao) + '</span>' +
        '<p>' + esc(f.motivo) + '</p>' +
      '</div>' +
      '<details class="src"><summary>Fontes e confiabilidade (' + f.fontes.length + ')</summary><ul class="srcs">' + srcs + '</ul></details>' +
      '<div class="actions">' +
        '<a class="btn btn--wa" data-share="wa" href="' + esc(waUrl(f)) + '" target="_blank" rel="noopener">' + ICON.wa + 'WhatsApp</a>' +
        '<a class="btn" data-share="x" href="' + esc(xUrl(f)) + '" target="_blank" rel="noopener">' + ICON.x + 'X</a>' +
        '<button class="btn" type="button" data-copylink>' + ICON.link + 'Copiar link</button>' +
        '<button class="btn" type="button" data-copytext>' + ICON.text + 'Copiar texto</button>' +
      '</div>' +
    '</article>';
  }

  /* ================== Aba: Falas ================== */
  var state = { cand: 'todos', verd: 'todos', tema: 'todos', q: '', shown: PAGE };

  function filtered() {
    var q = norm(state.q.trim());
    return FALAS.filter(function (f) {
      if (state.cand !== 'todos' && f.candidato !== state.cand) return false;
      if (state.verd !== 'todos' && f.classificacao !== state.verd) return false;
      if (state.tema !== 'todos' && f.tema !== state.tema) return false;
      if (q && norm(f.trecho + ' ' + f.motivo).indexOf(q) === -1) return false;
      return true;
    });
  }

  function viewFalas(app) {
    var temas = [];
    FALAS.forEach(function (f) { if (temas.indexOf(f.tema) === -1) temas.push(f.tema); });
    var cn = { flavio: 0, lula: 0 };
    FALAS.forEach(function (f) { cn[f.candidato]++; });

    app.innerHTML =
      '<div class="filters">' +
        '<div class="filters__row"><span class="lbl">Quem falou</span>' +
          '<button class="chip" type="button" data-cand="todos">Todos <span class="n">' + FALAS.length + '</span></button>' +
          Object.keys(CANDS).map(function (k) {
            return '<button class="chip" type="button" data-cand="' + k + '"><img src="' + CANDS[k].foto + '" alt="" style="outline:2px solid ' + CANDS[k].ring + '">' + CANDS[k].curto + ' <span class="n">' + cn[k] + '</span></button>';
          }).join('') +
        '</div>' +
        '<div class="filters__row"><span class="lbl">Veredito</span>' +
          '<button class="chip" type="button" data-verd="todos">Todos</button>' +
          VERDICTS.map(function (v) {
            return '<button class="chip" type="button" data-verd="' + esc(v.key) + '" style="--c:' + v.c + '"><span class="dot"></span>' + esc(v.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="filters__grid">' +
          '<input class="search" id="q" type="search" placeholder="Buscar nas falas e nas análises…" value="' + esc(state.q) + '" aria-label="Buscar">' +
          '<select class="select" id="tema" aria-label="Tema"><option value="todos">Todos os temas</option>' +
            temas.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="countbar"><p class="count" id="count"></p>' +
        (HAS_TTS ? '<button class="btn btn--listen" type="button" id="listen" aria-label="Ouvir as falas em voz alta (audiodescrição)">' + ICON.speaker + '<span>Ouvir as falas</span></button>' : '') +
      '</div>' +
      '<div class="feed" id="feed"></div>' +
      '<div class="loadmore" id="lm"></div>';

    app.querySelector('#tema').value = state.tema;

    app.querySelector('.filters').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cand],[data-verd]');
      if (!b) return;
      if (b.hasAttribute('data-cand')) state.cand = b.getAttribute('data-cand');
      else state.verd = b.getAttribute('data-verd');
      state.shown = PAGE; paintFeed(); paintChips();
    });
    app.querySelector('#q').addEventListener('input', function (e) { state.q = e.target.value; state.shown = PAGE; paintFeed(); });
    app.querySelector('#tema').addEventListener('change', function (e) { state.tema = e.target.value; state.shown = PAGE; paintFeed(); });
    app.querySelector('#lm').addEventListener('click', function (e) {
      if (e.target.closest('[data-more-items]')) { state.shown += PAGE; paintFeed(); }
    });
    app.querySelector('#feed').addEventListener('click', onFeedClick);
    var lb = app.querySelector('#listen');
    if (lb) lb.addEventListener('click', startAudio);

    paintChips(); paintFeed();
  }

  function paintChips() {
    document.querySelectorAll('[data-cand]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cand') === state.cand)); });
    document.querySelectorAll('[data-verd]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-verd') === state.verd)); });
  }

  function paintFeed(forceId) {
    var list = filtered();
    if (forceId) {
      var idx = list.findIndex(function (f) { return f.id === forceId; });
      if (idx >= state.shown) state.shown = idx + 1;
    }
    var feed = document.getElementById('feed');
    var shown = list.slice(0, state.shown);
    feed.innerHTML = shown.length ? shown.map(cardHtml).join('') : '<div class="empty">Nenhuma fala encontrada com esses filtros.</div>';
    document.getElementById('count').textContent = list.length + (list.length === 1 ? ' fala' : ' falas') + ' · exibindo ' + shown.length;
    markReading();
    document.getElementById('lm').innerHTML = list.length > shown.length
      ? '<button class="btn btn--big" type="button" data-more-items>Ver mais ' + Math.min(PAGE, list.length - shown.length) + ' falas</button>' : '';
  }

  function onFeedClick(e) {
    var card = e.target.closest('.fala');
    if (!card) return;
    var f = FALAS.find(function (x) { return x.id === +card.getAttribute('data-id'); });
    if (e.target.closest('[data-more]')) {
      var q = card.querySelector('.fala__quote'); q.classList.remove('clamp'); e.target.closest('[data-more]').remove();
    } else if (e.target.closest('[data-copylink]')) {
      copy(linkFor(f), 'Link da fala copiado');
    } else if (e.target.closest('[data-copytext]')) {
      copy(shareText(f, false), 'Texto copiado');
    }
  }

  /* ================== Aba: Placar ================== */
  function viewPlacar(app) {
    function stats(k) {
      var arr = FALAS.filter(function (f) { return f.candidato === k; });
      var by = {};
      VERDICTS.forEach(function (v) { by[v.key] = 0; });
      arr.forEach(function (f) { by[f.classificacao]++; });
      return { total: arr.length, by: by };
    }
    app.innerHTML =
      '<div class="score">' +
      Object.keys(CANDS).map(function (k) {
        var c = CANDS[k], s = stats(k);
        var vv = s.by['VERDADEIRO'];
        return '' +
        '<section class="cand" style="--ring:' + c.ring + '">' +
          '<div class="cand__head">' +
            '<img class="avatar" style="--ring:' + c.ring + '" src="' + c.foto + '" alt="Foto de ' + esc(c.nome) + '">' +
            '<div><div class="cand__name">' + esc(c.nome) + '</div><div class="cand__party">' + c.partido + '</div></div>' +
            '<div class="cand__total"><b>' + s.total + '</b><span>FALAS</span></div>' +
          '</div>' +
          '<div class="hl"><b>' + vv + '</b><span>falas verdadeiras<small>' + pct(vv, s.total) + ' das falas analisadas</small></span></div>' +
          '<div class="stack" role="img" aria-label="Distribuição dos vereditos">' +
            VERDICTS.map(function (v) { return '<i style="width:' + (s.by[v.key] / s.total * 100) + '%;background:' + v.c + '" title="' + esc(v.label) + ': ' + s.by[v.key] + '"></i>'; }).join('') +
          '</div>' +
          '<div class="rows">' +
            VERDICTS.map(function (v) {
              var n = s.by[v.key];
              return '<button class="row" type="button" data-go="' + k + '|' + esc(v.key) + '" style="--vc:' + v.c + '">' +
                '<span class="badge"><span aria-hidden="true">' + v.g + '</span>' + esc(v.key) + '</span>' +
                '<span class="row__n">' + n + '<small>' + pct(n, s.total) + '</small></span>' +
                '<span class="bar"><i style="width:' + (n / s.total * 100) + '%"></i></span>' +
              '</button>';
            }).join('') +
          '</div>' +
          '<a class="cand__cta" href="#/falas" data-go="' + k + '|todos">Ver as falas de ' + esc(c.curto) + '</a>' +
        '</section>';
      }).join('') +
      '</div>' +
      '<p class="note">Contagem consolidada dos ' + FALAS.length + ' trechos analisados no debate. Toque em um veredito para ver as falas correspondentes.</p>';

    app.onclick = function (e) {
      var b = e.target.closest('[data-go]');
      if (!b) return;
      e.preventDefault();
      var p = b.getAttribute('data-go').split('|');
      state.cand = p[0]; state.verd = p[1]; state.tema = 'todos'; state.q = ''; state.shown = PAGE;
      location.hash = '#/falas';
    };
  }

  /* ================== Aba: Apoie ================== */
  function viewApoie(app) {
    app.innerHTML =
      '<div class="apoie">' +
        '<div class="panel panel--dark">' +
          '<h2>A verdade custa. Ajude a mantê-la de pé.</h2>' +
          '<p>O Fato Veraz existe para que qualquer pessoa confira, em segundos, o que foi dito e o que os dados oficiais mostram. Sem cortes, sem torcida: cada fala com veredito, motivo e fontes.</p>' +
          (PIX_KEY
            ? '<div class="pix"><code id="pix">' + esc(PIX_KEY) + '</code><button class="btn" type="button" data-pix style="color:#16181d">Copiar chave Pix</button></div>'
            : '<p><strong>Chave Pix em breve.</strong></p>') +
        '</div>' +
        '<div class="panel">' +
          '<h2>Apoie sem gastar nada</h2>' +
          '<p>O apoio mais poderoso é espalhar. Em cada fala, o botão de WhatsApp envia exatamente aquela frase, com o veredito, o motivo, as fontes e um link direto para a análise completa.</p>' +
          '<a class="btn btn--wa" href="#/falas">' + ICON.wa + 'Escolher uma fala para compartilhar</a>' +
        '</div>' +
        '<div class="panel">' +
          '<h2>Compartilhe o site</h2>' +
          '<p>“A paz, se possível, mas a verdade a qualquer preço.”</p>' +
          '<a class="btn btn--wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('*Fato Veraz* — cada fala dos candidatos checada, com veredito e fontes.\n_“A paz, se possível, mas a verdade a qualquer preço.”_\n' + baseUrl()) + '">' + ICON.wa + 'Enviar o Fato Veraz no WhatsApp</a> ' +
          '<button class="btn" type="button" data-copysite>' + ICON.link + 'Copiar link do site</button>' +
        '</div>' +
      '</div>';
    var p = app.querySelector('[data-pix]');
    if (p) p.addEventListener('click', function () { copy(PIX_KEY, 'Chave Pix copiada'); });
    app.querySelector('[data-copysite]').addEventListener('click', function () { copy(baseUrl(), 'Link do site copiado'); });
  }

  /* ================== Audiodescrição (Web Speech API) ================== */
  var synth = window.speechSynthesis;
  var HAS_TTS = !!(synth && window.SpeechSynthesisUtterance);
  var P = { steps: [], i: 0, gen: 0, active: false, paused: false, rate: 1, voice: null, voiceURI: '', current: null, keep: null };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // Pontua as vozes instaladas: pt-BR primeiro; vozes neurais/"naturais" e de alta qualidade ganham prioridade.
  function scoreVoice(v) {
    var lang = (v.lang || '').replace('_', '-').toLowerCase(), n = v.name || '', s = 0;
    if (lang === 'pt-br') s += 100; else if (lang.indexOf('pt') === 0) s += 20; else return -1;
    if (/natural|neural|online/i.test(n)) s += 60;
    if (/premium|enhanced|aprimorad|siri/i.test(n)) s += 35;
    if (/google/i.test(n)) s += 25;
    if (/francisca|antonio|thalita|luciana|felipe|fernanda|camila|vitoria|ricardo/i.test(n)) s += 10;
    if (v.localService === false) s += 5;
    if (v.default) s += 1;
    return s;
  }
  function ptVoices() {
    return synth.getVoices().filter(function (v) { return scoreVoice(v) >= 0; })
      .sort(function (a, b) { return scoreVoice(b) - scoreVoice(a); });
  }
  function pickVoice() {
    var list = ptVoices();
    var saved = store('fv-voice');
    var chosen = saved && list.find(function (v) { return v.voiceURI === saved; });
    P.voice = chosen || list[0] || null;
    var sel = document.getElementById('pl-voice');
    if (sel) {
      sel.innerHTML = '<option value="">Melhor voz disponível</option>' + list.map(function (v) {
        return '<option value="' + esc(v.voiceURI) + '">' + esc(v.name) + ' (' + esc(v.lang) + ')</option>';
      }).join('');
      sel.value = chosen ? chosen.voiceURI : '';
    }
  }

  function speakable(s) {
    var num = '(\\d[\\d.,]*\\d|\\d)(\\s*(?:mil|milh(?:ão|ões)|bilh(?:ão|ões)|trilh(?:ão|ões)))?';
    return String(s)
      .replace(/\*+/g, '')
      .replace(/[\[\]]/g, '')
      .replace(new RegExp('US\\$\\s?' + num, 'gi'), function (m, n, u) { return n + (u || '') + ' dólares'; })
      .replace(new RegExp('R\\$\\s?' + num, 'gi'), function (m, n, u) { return n + (u || '') + ' reais'; })
      .replace(/\s\/\s/g, ' e ')
      .replace(/\s[-–—]\s/g, ', ')
      .replace(/\.\.\./g, ', ')
      .replace(/\s+/g, ' ').trim();
  }
  // Quebra em trechos curtos: evita que o navegador corte falas longas no meio.
  function chunk(text) {
    var parts = speakable(text).replace(/([.!?;:])\s+/g, '$1\u0001').split('\u0001'), out = [], acc = '';
    function pushLong(p) {
      var words = p.split(' '), cur = '';
      words.forEach(function (w) {
        if ((cur + ' ' + w).length > 180 && cur) { out.push(cur); cur = w; } else { cur = cur ? cur + ' ' + w : w; }
      });
      if (cur) out.push(cur);
    }
    parts.forEach(function (p) {
      if (p.length > 180) { if (acc) { out.push(acc); acc = ''; } pushLong(p); return; }
      if ((acc + ' ' + p).length > 180 && acc) { out.push(acc); acc = p; } else { acc = acc ? acc + ' ' + p : p; }
    });
    if (acc) out.push(acc);
    return out.filter(function (x) { return x.trim(); });
  }

  function announce(f) {
    var nome = CANDS[f.candidato].nome;
    if (/^Direito de Resposta/i.test(f.tema)) return 'Agora vamos ouvir o direito de resposta de ' + nome + '.';
    if (f.resposta) return 'Agora vamos ouvir o direito de resposta de ' + nome + ', no tema ' + f.tema + '.';
    if (/^Confronto de Tema Livre/i.test(f.tema)) return 'Agora vamos ouvir as falas de ' + nome + ' no confronto de tema livre.';
    return 'Agora vamos ouvir as falas de ' + nome + ' sobre o tema ' + f.tema + '.';
  }
  function buildSteps(list) {
    var steps = [], lastKey = null;
    list.forEach(function (f, idx) {
      var key = f.candidato + '|' + f.tema + '|' + f.inicio + '|' + f.resposta;
      var texts = [];
      if (idx === 0) texts.push('Fato Veraz. Audiodescrição das falas do debate. Vamos começar.');
      if (key !== lastKey) texts.push(announce(f));
      lastKey = key;
      var label = VMAP[f.classificacao].label.replace(/\.+$/, '');
      texts.push(f.trecho);
      texts.push('Classificação: ' + label + '.');
      texts.push('Justificativa: ' + f.motivo);
      steps.push({ id: f.id, texts: texts, nome: CANDS[f.candidato].nome });
    });
    return steps;
  }

  function markReading() {
    document.querySelectorAll('.fala.reading').forEach(function (el) { el.classList.remove('reading'); });
    if (!P.active || P.current == null) return;
    var el = document.getElementById('fala-' + P.current);
    if (el) el.classList.add('reading');
    return el;
  }
  function ui() {
    var pl = document.getElementById('player');
    pl.hidden = !P.active;
    document.body.classList.toggle('has-player', P.active);
    if (!P.active) return;
    var st = P.steps[P.i];
    document.getElementById('pl-status').textContent = st ? ('Lendo fala ' + (P.i + 1) + ' de ' + P.steps.length) : 'Concluído';
    document.getElementById('pl-sub').textContent = st ? st.nome + ' · Nº ' + st.id : '';
    var pp = document.getElementById('pl-play');
    pp.setAttribute('aria-label', P.paused ? 'Continuar' : 'Pausar');
    pp.innerHTML = P.paused ? PLAYER_ICON.play : PLAYER_ICON.pause;
  }
  var PLAYER_ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.500z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.500" width="4.200" height="15" rx="1"/><rect x="13.800" y="4.500" width="4.200" height="15" rx="1"/></svg>'
  };

  function playStep() {
    var gen = ++P.gen, st = P.steps[P.i];
    if (!st) { // fim
      var u = new SpeechSynthesisUtterance('Fim das falas. Obrigado por ouvir o Fato Veraz.');
      u.lang = 'pt-BR'; if (P.voice) u.voice = P.voice; u.rate = P.rate;
      u.onend = u.onerror = function () { if (gen === P.gen) stopAudio(); };
      P.keep = u; synth.speak(u); P.current = null; markReading(); ui();
      return;
    }
    P.current = st.id; ui();
    var el = markReading();
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    var chunks = [];
    st.texts.forEach(function (t) { chunks = chunks.concat(chunk(t)); });
    var k = 0;
    (function next() {
      if (gen !== P.gen) return;
      if (k >= chunks.length) { P.i++; playStep(); return; }
      var u = new SpeechSynthesisUtterance(chunks[k++]);
      u.lang = 'pt-BR';
      if (P.voice) u.voice = P.voice;
      u.rate = P.rate;
      u.onend = next;
      u.onerror = function (e) { if (gen !== P.gen) return; if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; next(); };
      P.keep = u; // evita coleta de lixo do utterance antes do fim (bug do Chrome)
      synth.speak(u);
    })();
  }
  function jump(to) {
    if (!P.active) return;
    P.gen++; synth.cancel(); synth.resume();
    P.paused = false;
    P.i = Math.max(0, Math.min(P.steps.length, to));
    playStep();
  }
  function stopAudio() {
    P.gen++; P.active = false; P.paused = false; P.current = null;
    if (HAS_TTS) synth.cancel();
    markReading(); ui();
  }
  function startAudio() {
    if (!HAS_TTS) { toast('Seu navegador não suporta leitura em voz alta'); return; }
    var list = filtered();
    if (!list.length) { toast('Nenhuma fala para ler'); return; }
    stopAudio();
    state.shown = Math.max(state.shown, list.length); paintFeed();
    pickVoice();
    P.steps = buildSteps(list); P.i = 0; P.active = true; P.paused = false;
    synth.cancel();
    playStep();
  }
  function togglePause() {
    if (!P.active) return;
    if (P.paused) { synth.resume(); P.paused = false; } else { synth.pause(); P.paused = true; }
    ui();
  }
  function restartCurrent() { if (P.active && !P.paused) jump(P.i); }

  function initPlayer() {
    if (!HAS_TTS) return;
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice); else synth.onvoiceschanged = pickVoice;
    var rate = parseFloat(store('fv-rate')); if (rate) P.rate = rate;
    var rs = document.getElementById('pl-rate'); rs.value = String(P.rate);
    rs.addEventListener('change', function () { P.rate = parseFloat(rs.value); store('fv-rate', rs.value); restartCurrent(); });
    document.getElementById('pl-voice').addEventListener('change', function (e) {
      store('fv-voice', e.target.value); pickVoice(); restartCurrent();
    });
    document.getElementById('pl-play').addEventListener('click', togglePause);
    document.getElementById('pl-next').addEventListener('click', function () { jump(P.i + 1); });
    document.getElementById('pl-prev').addEventListener('click', function () { jump(P.i - 1); });
    document.getElementById('pl-stop').addEventListener('click', function () {
      document.getElementById('player').classList.remove('open');
      document.getElementById('pl-opt').setAttribute('aria-expanded', 'false');
      stopAudio();
    });
    document.getElementById('pl-opt').addEventListener('click', function (e) {
      var pl = document.getElementById('player'), open = pl.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', String(open));
    });
    window.addEventListener('beforeunload', function () { synth.cancel(); });
  }
  initPlayer();

  /* ================== Roteador ================== */
  function route() {
    var h = location.hash || '#/falas';
    var app = document.getElementById('app');
    var m = h.match(/^#fala-(\d+)$/);
    var tab = 'falas', target = null;
    if (m) { target = +m[1]; }
    else if (h.indexOf('#/placar') === 0) tab = 'placar';
    else if (h.indexOf('#/apoie') === 0) tab = 'apoie';

    document.querySelectorAll('.tabs a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === tab); });

    if (tab === 'placar') { viewPlacar(app); window.scrollTo(0, 0); }
    else if (tab === 'apoie') { viewApoie(app); window.scrollTo(0, 0); }
    else {
      var existing = document.getElementById('feed');
      if (!existing || target === null) viewFalas(app);
      if (target !== null) {
        // Link direto: limpa filtros para garantir que a fala apareça e rola até ela.
        state.cand = 'todos'; state.verd = 'todos'; state.tema = 'todos'; state.q = '';
        if (!document.getElementById('feed')) viewFalas(app); else { paintChips(); }
        var f = FALAS.find(function (x) { return x.id === target; });
        if (f) {
          app.querySelector('#q').value = ''; app.querySelector('#tema').value = 'todos';
          paintFeed(target);
          var el = document.getElementById('fala-' + target);
          if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); }
        }
      } else if (!existing) { window.scrollTo(0, 0); }
    }
  }
  window.addEventListener('hashchange', route);
  route();
})();
