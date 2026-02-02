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

const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

// Smooth scrolling (native + reduced motion)
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
qsa('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = qs(href);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    closeDrawer();
  });
});

// Mobile drawer
const drawer = qs('#drawer');
const navToggle = qs('#navToggle');
function openDrawer(){
  if (!drawer || !navToggle) return;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden','false');
  navToggle.setAttribute('aria-expanded','true');
}
function closeDrawer(){
  if (!drawer || !navToggle) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden','true');
  navToggle.setAttribute('aria-expanded','false');
}
navToggle?.addEventListener('click', () => {
  if (drawer?.classList.contains('is-open')) closeDrawer();
  else openDrawer();
});
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });
window.addEventListener('click', (e) => {
  if (!drawer || !navToggle) return;
  const t = e.target;
  if (drawer.classList.contains('is-open') && !drawer.contains(t) && !navToggle.contains(t)) closeDrawer();
});

// Ticker marquee
const ticker = qs('#tickerTrack');
let tickerX = 0;
function tickTicker(){
  if (!ticker || prefersReduced) return;
  tickerX -= 0.5;
  ticker.style.transform = `translateX(${tickerX}px)`;
  // Reset when half scrolled (content duplicated in HTML)
  const w = ticker.scrollWidth / 2;
  if (-tickerX >= w) tickerX = 0;
  requestAnimationFrame(tickTicker);
}
requestAnimationFrame(tickTicker);

// Scrollspy
const spyLinks = qsa('[data-spy]');
const spyMap = new Map(spyLinks.map(a => [a.getAttribute('href'), a]));
const sections = qsa('section.section').map(s => ({ id: `#${s.id}`, el: s }));

const spyObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = `#${entry.target.id}`;
    spyLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === id));
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 });
sections.forEach(s => spyObs.observe(s.el));

// Reveal on scroll
const reveals = qsa('.reveal');
const revObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => revObs.observe(el));

// Modal
const modal = qs('#modal');
const modalBody = qs('#modalBody');
const modalClose = qs('#modalClose');
const modalBackdrop = qs('#modalBackdrop');

const PROJECTS = {
  p1: {
    title: 'Voranty',
    text: 'Finance product UI + API integrations. Clean dashboards, fast tables, and sharp interactions.',
    chips: ['React', 'TypeScript', 'Node', 'Charts']
  },
  p2: {
    title: 'DashStack',
    text: 'Admin console with multi-tenant UX patterns, role-based access, and performance-focused UI.',
    chips: ['Next.js', 'Postgres', 'Prisma', 'Auth']
  },
  p3: {
    title: 'Portal Runner',
    text: 'AR prototype with game loops, anchors, and mobile-friendly 3D performance constraints.',
    chips: ['Unity', 'ARKit', 'C#', 'iOS']
  },
  p4: {
    title: 'BigQuery Canvas',
    text: 'Data exploration UX: responsive layout, complex state, and high signal visual polish.',
    chips: ['Angular/TS', 'Data', 'Performance', 'UI Systems']
  }
};

function openModal(key){
  if (!modal || !modalBody) return;
  const p = PROJECTS[key];
  if (!p) return;

  modalBody.innerHTML = `
    <h3>${escapeHtml(p.title)}</h3>
    <p>${escapeHtml(p.text)}</p>
    <div class="chips">${p.chips.map(c => `<span class="chip">${escapeHtml(c)}</span>`).join('')}</div>
  `;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}

function closeModal(){
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

qsa('.work-card').forEach(card => {
  card.addEventListener('click', () => openModal(card.dataset.modal));
});
modalClose?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', closeModal);

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}