
/* =========================================================
   Starfield + vertical streaks (close to reference feel)
   ========================================================= */
(() => {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d', { alpha: true });

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0;

  const stars = [];
  const streaks = [];

  const STAR_COUNT = 1400;          // dense, subtle
  const STREAK_RATE = 0.9;          // approx streak spawns / sec

  function resize(){
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++){
      const r = Math.random() < 0.95 ? (Math.random()*1.2 + 0.2) : (Math.random()*1.9 + 0.7);
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r,
        a: Math.random() * 0.55 + 0.15,
        tw: Math.random() * 0.9 + 0.1,
        sp: Math.random() * 0.15 + 0.02,
      });
    }
  }

  function spawnStreak(){
    // The reference streaks are thin vertical lines that fall and fade.
    const x = Math.random() * W;
    const len = Math.random() * 130 + 70;
    const speed = Math.random() * 520 + 420;
    streaks.push({
      x,
      y: -len - Math.random() * 200,
      len,
      speed,
      a: Math.random() * 0.55 + 0.25,
      w: Math.random() * 1.2 + 0.7
    });
  }

  let last = performance.now();
  let acc = 0;

  function tick(t){
    const dt = Math.min(0.04, (t - last) / 1000);
    last = t;
    acc += dt;

    // probabilistic spawn at STREAK_RATE
    // if (Math.random() < (STREAK_RATE * dt)) spawnStreak();

    ctx.clearRect(0, 0, W, H);

    // stars
    for (const s of stars){
      s.y += s.sp; // tiny drift
      if (s.y > H) s.y = -2;
      const tw = 0.15 * Math.sin((t/1000) * (0.9 + s.tw) + s.x*0.01);
      const alpha = Math.max(0, Math.min(1, s.a + tw));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // streaks
    ctx.globalAlpha = 1;
    for (let i = streaks.length - 1; i >= 0; i--){
      const st = streaks[i];
      st.y += st.speed * dt;

      // fade as it falls
      const fade = Math.max(0, 1 - (st.y / (H * 0.95)));
      const a = st.a * fade;

      // draw a soft vertical line
      const g = ctx.createLinearGradient(st.x, st.y, st.x, st.y + st.len);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.55, `rgba(255,255,255,${a * 0.55})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.strokeStyle = g;
      ctx.lineWidth = st.w;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(st.x, st.y + st.len);
      ctx.stroke();

      if (st.y > H + st.len + 80) streaks.splice(i, 1);
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(tick);
})();

/* =========================================================
   Dock magnification + smooth scroll
   ========================================================= */
(() => {
  const dock = document.getElementById('dock');
  if (!dock) return;

  const items = Array.from(dock.querySelectorAll('.dock-item'));

  function reset(){
    for (const it of items){
      it.style.transform = '';
    }
  }

  // mac-like: scale based on cursor distance to each icon center
  dock.addEventListener('mousemove', (e) => {
    const rect = dock.getBoundingClientRect();
    const mx = e.clientX;

    for (const it of items){
      const r = it.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const d = Math.abs(mx - cx);
      const influence = 90; // px
      const t = Math.max(0, 1 - d / influence);
      const scale = 1 + t * 0.55;     // up to ~1.55
      const lift = t * 10;            // px
      it.style.transform = `translateY(${-lift}px) scale(${scale})`;
    }
  });

  dock.addEventListener('mouseleave', reset);

  // smooth scroll (plus keep native hash)
  for (const it of items){
    const target = it.getAttribute('data-target');
    if (!target) continue;

    it.addEventListener('click', (e) => {
      const href = it.getAttribute('href') || '';
      if (href.startsWith('#')){
        e.preventDefault();
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    });
  }
})();

/* =========================================================
   Work gallery: stage slides + scrollbar thumb
   ========================================================= */
(() => {
  const stage = document.getElementById('stage');
  const thumbs = Array.from(document.querySelectorAll('.thumb'));
  const scrollThumb = document.getElementById('scrollThumb');
  if (!stage || thumbs.length === 0) return;

  let idx = 0;
  const max = thumbs.length - 1;

  function setActive(i){
    idx = Math.max(0, Math.min(max, i));
    stage.style.transform = `translateX(-${idx * 20}%)`;
    thumbs.forEach((t, k) => t.classList.toggle('is-active', k === idx));
    updateScrollThumb();
  }

  function updateScrollThumb(){
    if (!scrollThumb) return;
    const track = scrollThumb.parentElement;
    if (!track) return;
    const h = track.clientHeight;
    const thumbH = Math.max(60, Math.min(96, h * 0.16));
    const usable = h - thumbH - 20; // some padding
    const top = 10 + (usable * (idx / max || 0));
    scrollThumb.style.height = `${thumbH}px`;
    scrollThumb.style.top = `${top}px`;
  }

  thumbs.forEach((t) => {
    t.addEventListener('click', () => setActive(parseInt(t.dataset.i || '0', 10)));
  });

  // wheel / touchpad horizontal navigation
  const stageContainer = stage.parentElement;
  stageContainer?.addEventListener('wheel', (e) => {
    // treat horizontal or vertical wheel as slide navigation
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 10) return;
    e.preventDefault();
    if (delta > 0) setActive(idx + 1);
    else setActive(idx - 1);
  }, { passive: false });

  // keyboard
  stageContainer?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') setActive(idx + 1);
    if (e.key === 'ArrowLeft') setActive(idx - 1);
  });

  // simple autoplay like the reference “showcase” feel (stops on interaction)
  let autoplay = true;
  const stop = () => { autoplay = false; };
  stageContainer?.addEventListener('pointerdown', stop);
  thumbs.forEach(t => t.addEventListener('pointerdown', stop));

  setInterval(() => {
    if (!autoplay) return;
    setActive((idx + 1) % (max + 1));
  }, 4200);

  window.addEventListener('resize', updateScrollThumb, { passive: true });
  updateScrollThumb();
})();

/* footer year */
document.getElementById('year').textContent = new Date().getFullYear();
