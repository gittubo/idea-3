// Auto-playing campaign: the film plays to its end, each photo holds for PHOTO_MS,
// then the next scene crossfades in and the sequence loops. It only runs while on screen.
const PHOTO_MS = 6000;

function campaign(root: HTMLElement) {
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('.scene'));
  const segs = Array.from(root.querySelectorAll<HTMLElement>('[data-seg]'));
  const count = root.querySelector<HTMLElement>('[data-cam-count]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-cam-toggle]');
  const pad = (k: number) => String(k).padStart(2, '0');
  root.style.setProperty('--dur', `${PHOTO_MS}ms`);

  let idx = 0;
  let elapsed = 0; // ms shown, for photos
  let last = 0;
  let inView = false;
  let visible = false;
  let userPaused = false;
  let raf = 0;

  const videoOf = (i: number) => scenes[i].querySelector<HTMLVideoElement>('video');
  const running = () => visible && !userPaused;

  const loadVideo = (v: HTMLVideoElement) => {
    if (v.getAttribute('src')) return;
    const r = root.getBoundingClientRect();
    v.src = (r.width / Math.max(r.height, 1) < 0.9 ? v.dataset.tall : v.dataset.wide) ?? '';
  };

  const setProgress = (p: number) => {
    segs.forEach((s, i) => s.style.setProperty('--p', i < idx ? '1' : i === idx ? p.toFixed(4) : '0'));
  };

  const show = (i: number) => {
    const prev = videoOf(idx);
    idx = (i + scenes.length) % scenes.length;
    if (prev && prev !== videoOf(idx)) prev.pause();
    elapsed = 0;
    scenes.forEach((s, k) => s.classList.toggle('on', k === idx));
    segs.forEach((s, k) => s.setAttribute('aria-current', String(k === idx)));
    if (count) count.textContent = `${pad(idx + 1)} / ${pad(scenes.length)}`;
    const v = videoOf(idx);
    if (v) { loadVideo(v); v.currentTime = 0; if (running()) v.play().catch(() => {}); }
    setProgress(0);
  };

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
    if (p >= 1) show(idx + 1);
    raf = requestAnimationFrame(tick);
  };

  const sync = () => {
    const on = running();
    root.classList.toggle('paused', !on);
    const v = videoOf(idx);
    if (on) {
      if (v) { loadVideo(v); v.play().catch(() => {}); }
      last = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    } else {
      v?.pause();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
  };

  scenes.forEach((s) => s.querySelector('video')?.addEventListener('ended', () => { if (running()) show(idx + 1); }));
  segs.forEach((s, i) => s.addEventListener('click', () => { show(i); sync(); }));
  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Play campaign' : 'Pause campaign');
    sync();
  });
  document.addEventListener('visibilitychange', () => { visible = inView && !document.hidden; sync(); });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; visible = inView && !document.hidden; sync(); }, { threshold: 0.35 }).observe(root);

  show(0);
  sync();
}

document.querySelectorAll<HTMLElement>('[data-campaign]').forEach(campaign);
