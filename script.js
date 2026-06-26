/* ══════════════════════════════════════════════════════════════
   script.js  —  Para ti...
   • Estrellas animadas (canvas)
   • Carrusel de recuerdos
   • Botón de corazón en carta
   • Reproductor de música completo
   • Scroll-reveal suave
══════════════════════════════════════════════════════════════ */

/* ─── 1. CANVAS DE ESTRELLAS ─────────────────────────────────── */
(function initStars() {
  const canvas = document.getElementById('stars');
  const ctx    = canvas.getContext('2d');
  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x:    Math.random() * W,
        y:    Math.random() * H,
        r:    Math.random() * 1.5 + 0.3,
        a:    Math.random(),          // alpha actual
        da:   (Math.random() - 0.5) * 0.008, // delta alpha (parpadeo)
        speed: Math.random() * 0.12,
      });
    }
  }

  // Estrellas fugaces
  let meteors = [];
  function spawnMeteor() {
    meteors.push({
      x:  Math.random() * W,
      y:  Math.random() * H * 0.5,
      len: Math.random() * 140 + 60,
      speed: Math.random() * 6 + 4,
      a:  1,
      angle: Math.PI / 5,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Estrellas
    stars.forEach(s => {
      s.a += s.da;
      if (s.a > 1 || s.a < 0.1) s.da *= -1;
      s.y -= s.speed;
      if (s.y < 0) s.y = H;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,230,255,${Math.max(0.1, s.a)})`;
      ctx.fill();
    });

    // Meteoros
    meteors = meteors.filter(m => m.a > 0);
    meteors.forEach(m => {
      ctx.save();
      ctx.globalAlpha = m.a;
      const grd = ctx.createLinearGradient(
        m.x, m.y,
        m.x + Math.cos(m.angle) * m.len,
        m.y + Math.sin(m.angle) * m.len
      );
      grd.addColorStop(0, 'rgba(255,77,139,0)');
      grd.addColorStop(1, 'rgba(255,200,230,0.9)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x + Math.cos(m.angle) * m.len, m.y + Math.sin(m.angle) * m.len);
      ctx.stroke();
      ctx.restore();

      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.a -= 0.018;
    });

    requestAnimationFrame(draw);
  }

  resize();
  createStars(160);
  draw();

  window.addEventListener('resize', () => { resize(); createStars(160); });

  // Meteoros cada ~5 s
  setInterval(spawnMeteor, 4800);
  setTimeout(spawnMeteor, 600);
})();


/* ─── 2. CARRUSEL DE RECUERDOS ──────────────────────────────── */
(function initCarousel() {
  const track   = document.getElementById('memoriesTrack');
  const dotsEl  = document.getElementById('memDots');
  const btnPrev = document.getElementById('memPrev');
  const btnNext = document.getElementById('memNext');

  if (!track) return;

  const cards   = Array.from(track.querySelectorAll('.mem-card'));
  const total   = cards.length;
  let current   = 0;

  // Cuántas tarjetas visibles según viewport
  function visibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 4;
  }

  // Crear dots
  function buildDots() {
    dotsEl.innerHTML = '';
    const pages = Math.ceil(total / visibleCount());
    for (let i = 0; i < pages; i++) {
      const d = document.createElement('button');
      d.className = 'mem-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Página ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(d);
    }
  }

  function goTo(page) {
    const visible = visibleCount();
    const pages   = Math.ceil(total / visible);
    current       = Math.max(0, Math.min(page, pages - 1));

    // Desplazar el primer card visible
    const targetCard = cards[current * visible];
    if (targetCard) {
      track.scrollTo({ left: targetCard.offsetLeft - 8, behavior: 'smooth' });
    }

    // Actualizar dots
    Array.from(dotsEl.querySelectorAll('.mem-dot')).forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  btnPrev.addEventListener('click', () => goTo(current - 1));
  btnNext.addEventListener('click', () => goTo(current + 1));

  // Swipe táctil
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1);
  });

  buildDots();
  window.addEventListener('resize', buildDots);
})();


/* ─── 3. BOTÓN CORAZÓN EN CARTA ─────────────────────────────── */
(function initLetterHeart() {
  const btn = document.getElementById('letterHeart');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('liked');
    btn.textContent = btn.classList.contains('liked') ? '♥' : '♡';
  });
})();


/* ─── 4. REPRODUCTOR DE MÚSICA ──────────────────────────────── */
(function initPlayer() {
  const audio     = document.getElementById('audioPlayer');
  const btnPlay   = document.getElementById('btnPlay');
  const btnPrev   = document.getElementById('btnPrev');
  const btnNext   = document.getElementById('btnNext');
  const btnShuffle= document.getElementById('btnShuffle');
  const btnRepeat = document.getElementById('btnRepeat');
  const musicFav  = document.getElementById('musicFav');
  const progressBg= document.getElementById('progressBg');
  const progressFill = document.getElementById('progressFill');
  const timeNow   = document.getElementById('timeNow');
  const timeTotal = document.getElementById('timeTotal');
  const volSlider = document.getElementById('volumeSlider');

  if (!audio) return;

  let isPlaying = false;
  let isRepeat  = false;
  let isShuffle = false;

  /* ── Utilidad: formatear tiempo ── */
  function fmt(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ── Play / Pause ── */
  function togglePlay() {
    if (audio.readyState === 0) {
      // Sin archivo cargado — animamos el botón igual
      showNoFileMsg();
      return;
    }
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => showNoFileMsg());
    }
  }

  function showNoFileMsg() {
    // Feedback visual suave si no hay archivo
    btnPlay.style.background = '#6b3fa0';
    setTimeout(() => { btnPlay.style.background = ''; }, 800);
  }

  btnPlay.addEventListener('click', togglePlay);

  audio.addEventListener('play',  () => { isPlaying = true;  btnPlay.textContent = '⏸'; });
  audio.addEventListener('pause', () => { isPlaying = false; btnPlay.textContent = '▶'; });
  audio.addEventListener('ended', () => {
    if (isRepeat) { audio.currentTime = 0; audio.play(); }
    else { isPlaying = false; btnPlay.textContent = '▶'; progressFill.style.width = '0%'; }
  });

  /* ── Progreso ── */
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    timeNow.textContent  = fmt(audio.currentTime);
    timeTotal.textContent = fmt(audio.duration);
  });

  audio.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = fmt(audio.duration);
  });

  // Click en la barra de progreso → seek
  if (progressBg) {
    progressBg.addEventListener('click', e => {
      if (!audio.duration) return;
      const rect = progressBg.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });
  }

  /* ── Volumen ── */
  if (volSlider) {
    audio.volume = parseFloat(volSlider.value);
    volSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volSlider.value);
    });
  }

  /* ── Repeat ── */
  if (btnRepeat) {
    btnRepeat.addEventListener('click', () => {
      isRepeat = !isRepeat;
      btnRepeat.style.color = isRepeat ? 'var(--rose)' : '';
    });
  }

  /* ── Shuffle (visual, útil si se extiende con playlist) ── */
  if (btnShuffle) {
    btnShuffle.addEventListener('click', () => {
      isShuffle = !isShuffle;
      btnShuffle.style.color = isShuffle ? 'var(--rose)' : '';
    });
  }

  /* ── Anterior / Siguiente (reinicia la misma pista por ahora) ── */
  if (btnPrev) btnPrev.addEventListener('click', () => { audio.currentTime = 0; });
  if (btnNext) btnNext.addEventListener('click', () => { audio.currentTime = 0; audio.pause(); btnPlay.textContent = '▶'; isPlaying = false; });

  /* ── Favorito en la barra ── */
  if (musicFav) {
    musicFav.addEventListener('click', () => {
      musicFav.classList.toggle('liked');
      musicFav.textContent = musicFav.classList.contains('liked') ? '♥' : '♡';
    });
  }

  /* ── Barra de progreso responsive en móvil ── */
  // Inyectar fila de progreso para móvil
  const bar = document.getElementById('musicBar');
  if (bar && window.innerWidth <= 600) {
    const pw = document.createElement('div');
    pw.className = 'progress-wrap-mobile progress-wrap';
    pw.innerHTML = `
      <span class="time" id="timeNowM">0:00</span>
      <div class="progress-bar-bg" id="progressBgM" style="max-width:unset;flex:1">
        <div class="progress-bar-fill" id="progressFillM"></div>
      </div>
      <span class="time" id="timeTotalM">0:00</span>
    `;
    bar.appendChild(pw);

    const fillM = document.getElementById('progressFillM');
    const nowM  = document.getElementById('timeNowM');
    const totM  = document.getElementById('timeTotalM');
    const bgM   = document.getElementById('progressBgM');

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      fillM.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
      nowM.textContent  = fmt(audio.currentTime);
      totM.textContent  = fmt(audio.duration);
    });
    audio.addEventListener('loadedmetadata', () => { totM.textContent = fmt(audio.duration); });
    bgM.addEventListener('click', e => {
      if (!audio.duration) return;
      const r = bgM.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  }
})();


/* ─── 5. SCROLL REVEAL ──────────────────────────────────────── */
(function initReveal() {
  const targets = document.querySelectorAll(
    '.thanks-item, .mem-card, .letter-box, .farewell-content'
  );

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp .7s ease both';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(t => {
    t.style.opacity = '0';
    obs.observe(t);
  });
})();


/* ─── 6. DOTS DEL HERO ──────────────────────────────────────── */
(function initHeroDots() {
  const sections = ['hero', 'recuerdos', 'gracias', 'carta'];
  const dots     = document.querySelectorAll('.hero-dots .dot');
  if (!dots.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = sections.indexOf(e.target.id);
        if (idx >= 0) {
          dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
})();
