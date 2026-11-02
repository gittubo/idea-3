// Pinned campaign sequence: maps scroll position inside the section to the active scene
// and a 0–1 local progress (--lp) that drives each shot's slow push-in.
function campaign(root: HTMLElement) {
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('.scene'));
  const n = scenes.length;
  const shots = scenes.length - 2; // title card and end card aren't counted as scenes
  const label = root.querySelector<HTMLElement>('[data-cam-label]');
  const count = root.querySelector<HTMLElement>('[data-cam-count]');
  const bar = root.querySelector<HTMLElement>('[data-cam-bar]');
  root.classList.add('ready');
  let visible = false;
  let queued = false;
  let current = -1;

  const update = () => {
    queued = false;
    const r = root.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    const f = p * n;
    const idx = Math.min(n - 1, Math.floor(f));
    if (idx !== current) {
      scenes.forEach((s, i) => s.classList.toggle('on', i === idx));
      current = idx;
      if (label) label.textContent = scenes[idx].dataset.label ?? '';
      if (count) count.textContent = `${String(Math.min(Math.max(idx, 0), shots)).padStart(2, '0')} / ${String(shots).padStart(2, '0')}`;
    }
    const lp = Math.min(1, Math.max(0, f - idx));
    scenes[idx].style.setProperty('--lp', lp.toFixed(3));
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  const request = () => { if (visible && !queued) { queued = true; requestAnimationFrame(update); } };

  // Only track scroll while the section is on screen
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) request(); }, { rootMargin: '10% 0px' }).observe(root);
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { visible = true; request(); });
  update();
}

document.querySelectorAll<HTMLElement>('[data-campaign]').forEach(campaign);
