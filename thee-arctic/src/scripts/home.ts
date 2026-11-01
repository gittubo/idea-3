// Home page interactions: hero slider + snowfall, spotlight carousel, tabs, countdown, parallax wordmark.
import { garmentSvg, type Garment } from '../data/garments';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

/* Hero slider */
function hero() {
  const root = $('[data-hero]');
  if (!root) return;
  const slides = $$('.slide', root);
  const bars = $$('[data-bar]', root);
  const toggle = $<HTMLButtonElement>('[data-hero-toggle]', root);
  const DURATION = 6500;
  let i = 0, playing = !reduce, start = performance.now(), elapsed = 0;

  const go = (n: number) => {
    slides[i].classList.remove('on');
    bars[i].style.setProperty('--p', '0');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('on');
    bars.forEach((b, j) => b.classList.toggle('done', j < i));
    start = performance.now(); elapsed = 0;
    slides.forEach((s) => s.querySelector('video')?.pause());
    slides[i].querySelector('video')?.play().catch(() => {});
  };
  bars.forEach((b, j) => b.addEventListener('click', () => go(j)));
  toggle?.addEventListener('click', () => {
    playing = !playing;
    if (playing) start = performance.now() - elapsed;
    toggle.setAttribute('aria-pressed', String(!playing));
    toggle.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
  });
  const tick = (now: number) => {
    if (playing) {
      elapsed = now - start;
      bars[i].style.setProperty('--p', String(Math.min(1, elapsed / DURATION)));
      if (elapsed >= DURATION) go(i + 1);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // swipe
  let x0 = 0;
  root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  root.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
  });
}

/* Snowfall on the hero canvas */
function snow() {
  const canvas = $<HTMLCanvasElement>('[data-snow]');
  if (!canvas || reduce) return;
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
  const flakes = Array.from({ length: Math.round(Math.min(140, w / 10)) }, () => ({
    x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2.2 + .4, s: Math.random() * .6 + .25, d: Math.random() * Math.PI * 2,
  }));
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  const draw = () => {
    if (visible) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (const f of flakes) {
        f.y += f.s; f.d += .01; f.x += Math.sin(f.d) * .35;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  };
  draw();
}

/* Spotlight carousel: centred piece, ghosted neighbours, details panel swaps with a blur transition */
interface SpotItem { slug: string; name: string; price: string; was: string; garment: Garment; colors: { name: string; hex: string }[]; sizes: string[]; img: string; cat: string }
function spotlight() {
  const root = $('[data-spot]');
  if (!root) return;
  const items: SpotItem[] = JSON.parse(root.dataset.spot!);
  const els = $$('.spot-item', root);
  const panel = $('[data-spot-panel]', root)!;
  const counter = $('[data-spot-count]', root)!;
  let i = 0, hex = items[0].colors[0].hex, timer = 0;

  const layout = () => {
    const n = els.length;
    els.forEach((el, j) => {
      let off = j - i;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      el.dataset.pos = off === 0 ? 'active' : off === -1 ? 'prev' : off === 1 ? 'next' : off < 0 ? 'far-prev' : 'far-next';
      el.setAttribute('aria-hidden', String(off !== 0));
    });
  };
  const fill = () => {
    const it = items[i];
    hex = it.colors[0].hex;
    panel.classList.add('swap');
    setTimeout(() => {
      $('[data-f="cat"]', panel)!.textContent = it.cat;
      $('[data-f="name"]', panel)!.textContent = it.name;
      $('[data-f="price"]', panel)!.innerHTML = it.was ? `<span class="now">${it.price}</span> <s>${it.was}</s>` : it.price;
      $('[data-f="link"]', panel)!.setAttribute('href', `/products/${it.slug}`);
      $('[data-f="swatches"]', panel)!.innerHTML = it.colors
        .map((c, k) => `<button type="button" class="sw" style="background:${c.hex}" data-hex="${c.hex}" data-name="${c.name}" aria-label="${c.name}" aria-pressed="${k === 0}"></button>`)
        .join('');
      $('[data-f="sizes"]', panel)!.innerHTML = it.sizes
        .map((s) => `<button type="button" class="sz" data-sz="${s}">${s}</button>`)
        .join('');
      counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      panel.classList.remove('swap');
    }, reduce ? 0 : 220);
  };
  const go = (n: number) => { i = (n + items.length) % items.length; layout(); fill(); restart(); };
  const restart = () => { clearInterval(timer); if (!reduce) timer = window.setInterval(() => go(i + 1), 7000); };

  $('[data-spot-prev]', root)?.addEventListener('click', () => go(i - 1));
  $('[data-spot-next]', root)?.addEventListener('click', () => go(i + 1));
  els.forEach((el, j) => el.addEventListener('click', () => { if (j !== i) go(j); }));
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
  let x0 = 0;
  root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  root.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); });

  panel.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const sw = t.closest<HTMLElement>('.sw');
    if (sw) {
      hex = sw.dataset.hex!;
      $$('.sw', panel).forEach((b) => b.setAttribute('aria-pressed', String(b === sw)));
      if (!items[i].img) els[i].querySelector('.spot-art')!.innerHTML = garmentSvg(items[i].garment, hex);
    }
    const sz = t.closest<HTMLElement>('.sz');
    if (sz) {
      const it = items[i];
      const colour = it.colors.find((c) => c.hex === hex) ?? it.colors[0];
      const btn = document.createElement('button');
      btn.hidden = true;
      btn.dataset.addItem = JSON.stringify({ slug: it.slug, name: it.name, price: parseFloat(it.price.slice(1)), garment: it.garment, color: colour.name, hex: colour.hex, img: it.img });
      btn.dataset.size = sz.dataset.sz;
      panel.appendChild(btn); btn.click(); btn.remove();
    }
  });
  layout(); fill(); restart();
}

/* Tabs (Popular picks) */
function tabs() {
  $$('[data-tabs]').forEach((root) => {
    const btns = $$<HTMLButtonElement>('[role="tab"]', root);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => { x.setAttribute('aria-selected', String(x === b)); x.classList.toggle('on', x === b); });
      $$('[role="tabpanel"]', root).forEach((p) => (p.hidden = p.id !== b.getAttribute('aria-controls')));
    }));
  });
}

/* Countdown to the end of the month */
function countdown() {
  const el = $('[data-countdown]');
  if (!el) return;
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const parts = ['d', 'h', 'm', 's'].map((k) => $(`[data-cd="${k}"]`, el)!);
  const tick = () => {
    let s = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
    const v = [Math.floor(s / 86400), Math.floor((s %= 86400) / 3600), Math.floor((s %= 3600) / 60), s % 60];
    parts.forEach((p, k) => (p.textContent = String(v[k]).padStart(2, '0')));
  };
  tick(); setInterval(tick, 1000);
}

/* Giant wordmark drifts sideways on scroll */
function drift() {
  const el = $('[data-drift]');
  if (!el || reduce) return;
  const host = el.parentElement!;
  const update = () => {
    const r = host.getBoundingClientRect();
    const p = (innerHeight - r.top) / (innerHeight + r.height);
    el.style.transform = `translateX(${(0.5 - p) * 30}%)`;
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

hero(); snow(); spotlight(); tabs(); countdown(); drift();
