// Campaign carousel. Visitors can swipe or drag through the scenes (or use the arrows / arrow keys);
// left alone it plays by itself: the film to its end, each photo for PHOTO_MS, then loops.
// It only runs while on screen.
const PHOTO_MS = 6000;
const SLIDE_MS = 750;

function campaign(root: HTMLElement) {
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('.scene'));
  const n = scenes.length;
  const segs = Array.from(root.querySelectorAll<HTMLElement>('[data-seg]'));
  const count = root.querySelector<HTMLElement>('[data-cam-count]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-cam-toggle]');
  const pad = (k: number) => String(k).padStart(2, '0');
  const wrap = (i: number) => (i + n) % n;
  root.style.setProperty('--dur', `${PHOTO_MS}ms`);

  let idx = 0;
  let elapsed = 0; // ms the current scene has been shown (photos, or a film that can't play)
  let last = 0;
  let inView = false;
  let visible = false;
  let userPaused = false;
  let dragging = false;
  let sliding = false;
  let raf = 0;

  const videoOf = (i: number) => scenes[i].querySelector<HTMLVideoElement>('video');
  const running = () => visible && !userPaused && !dragging && !sliding;

  const loadVideo = (v: HTMLVideoElement) => {
    if (v.getAttribute('src')) return;
    const r = root.getBoundingClientRect();
    v.src = (r.width / Math.max(r.height, 1) < 0.9 ? v.dataset.tall : v.dataset.wide) ?? '';
  };

  const setProgress = (p: number) => {
    segs.forEach((s, i) => s.style.setProperty('--p', i < idx ? '1' : i === idx ? p.toFixed(4) : '0'));
  };

  /* Position: the current scene at offset dx (px), the neighbour it's revealing beside it */
  const place = (dx: number) => {
    const w = root.clientWidth;
    const prev = wrap(idx - 1);
    const next = wrap(idx + 1);
    scenes.forEach((s, i) => {
      const x = i === idx ? dx : i === next && dx < 0 ? dx + w : i === prev && dx > 0 ? dx - w : null;
      s.classList.toggle('peek', x !== null && i !== idx);
      s.style.transform = x === null ? '' : `translate3d(${x}px,0,0)`;
    });
  };

  /* Bookkeeping once a scene becomes current */
  const settle = () => {
    elapsed = 0;
    last = 0;
    scenes.forEach((s, k) => s.classList.toggle('on', k === idx));
    segs.forEach((s, k) => s.setAttribute('aria-current', String(k === idx)));
    if (count) count.textContent = `${pad(idx + 1)} / ${pad(n)}`;
    scenes.forEach((s, k) => { if (k !== idx) s.querySelector('video')?.pause(); });
    const v = videoOf(idx);
    if (v) { loadVideo(v); v.currentTime = 0; }
    // Warm the neighbouring film so a swipe lands on a playing video
    [wrap(idx + 1), wrap(idx - 1)].forEach((k) => { const nv = videoOf(k); if (nv) { loadVideo(nv); nv.preload = 'auto'; } });
    setProgress(0);
  };

  /* Slide to scene `to`, coming in from the right (dir 1) or the left (dir -1), starting at drag offset dx */
  const go = (to: number, dir: 1 | -1, dx = 0) => {
    to = wrap(to);
    if (to === idx || sliding) return;
    const w = root.clientWidth;
    const from = idx;
    const incoming = scenes[to];
    sliding = true;
    sync();
    root.classList.remove('sliding');
    scenes.forEach((s, i) => { if (i !== from && i !== to) { s.classList.remove('peek'); s.style.transform = ''; } });
    incoming.classList.add('peek');
    incoming.style.transform = `translate3d(${dx + dir * w}px,0,0)`;
    scenes[from].style.transform = `translate3d(${dx}px,0,0)`;
    void incoming.offsetWidth; // commit start positions before animating
    root.classList.add('sliding');
    idx = to;
    settle();
    incoming.style.transform = 'translate3d(0,0,0)';
    scenes[from].style.transform = `translate3d(${-dir * w}px,0,0)`;
    setTimeout(() => {
      root.classList.remove('sliding');
      sliding = false;
      place(0);
      sync();
    }, SLIDE_MS);
  };
  const next = () => go(idx + 1, 1);
  const prev = () => go(idx - 1, -1);

  const tick = (t: number) => {
    raf = 0;
    if (!running()) return;
    const dt = last ? Math.min(t - last, 100) : 0;
    last = t;
    const v = videoOf(idx);
    let p: number;
    if (v && v.duration && v.readyState >= 2) {
      p = v.currentTime / v.duration;
      if (v.paused && !v.ended) v.play().catch(() => { elapsed += dt; });
      if (elapsed > 3000) p = Math.max(p, elapsed / 10000); // autoplay blocked: move on by timer
    } else {
      elapsed += dt;
      p = elapsed / (v ? 10000 : PHOTO_MS);
    }
    setProgress(Math.min(1, p));
    if (p >= 1) { next(); return; }
    raf = requestAnimationFrame(tick);
  };

  function sync() {
    const on = running();
    root.classList.toggle('paused', !on && !sliding);
    const v = videoOf(idx);
    if (on) {
      if (v) { loadVideo(v); v.play().catch(() => {}); }
      last = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    } else {
      if (!sliding) v?.pause();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
  }

  /* Swipe / drag */
  let startX = 0, startY = 0, startT = 0, dx = 0, pid = -1, decided = false;
  root.addEventListener('pointerdown', (e) => {
    if (sliding || (e.target as HTMLElement).closest('button, a') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    pid = e.pointerId; startX = e.clientX; startY = e.clientY; startT = performance.now(); dx = 0; decided = false;
  });
  root.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    const mx = e.clientX - startX;
    const my = e.clientY - startY;
    if (!decided) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      decided = true;
      if (Math.abs(my) > Math.abs(mx)) { pid = -1; return; } // vertical: let the page scroll
      dragging = true;
      startT = performance.now();
      root.setPointerCapture(e.pointerId);
      root.classList.add('grabbing');
      sync();
    }
    if (!dragging) return;
    dx = mx;
    place(dx);
  });
  const release = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    pid = -1;
    if (!dragging) return;
    dragging = false;
    root.classList.remove('grabbing');
    const w = root.clientWidth;
    const fast = Math.abs(dx) > 30 && Math.abs(dx) / Math.max(performance.now() - startT, 1) > 0.45;
    if (Math.abs(dx) > w * 0.18 || fast) {
      go(dx < 0 ? idx + 1 : idx - 1, dx < 0 ? 1 : -1, dx);
    } else {
      root.classList.add('sliding'); // spring back
      scenes.forEach((s) => { if (s.classList.contains('peek')) s.style.transform = `translate3d(${dx < 0 ? w : -w}px,0,0)`; });
      scenes[idx].style.transform = 'translate3d(0,0,0)';
      setTimeout(() => { root.classList.remove('sliding'); place(0); }, SLIDE_MS);
      sync();
    }
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  root.querySelector('[data-cam-next]')?.addEventListener('click', next);
  root.querySelector('[data-cam-prev]')?.addEventListener('click', prev);
  segs.forEach((s, i) => s.addEventListener('click', () => go(i, i > idx ? 1 : -1)));
  scenes.forEach((s) => s.querySelector('video')?.addEventListener('ended', () => { if (running()) next(); }));
  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Play campaign' : 'Pause campaign');
    sync();
  });
  document.addEventListener('visibilitychange', () => { visible = inView && !document.hidden; sync(); });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; visible = inView && !document.hidden; sync(); }, { threshold: 0.35 }).observe(root);
  addEventListener('resize', () => { if (!sliding && !dragging) place(0); });

  settle();
  place(0);
  sync();
}

document.querySelectorAll<HTMLElement>('[data-campaign]').forEach(campaign);
