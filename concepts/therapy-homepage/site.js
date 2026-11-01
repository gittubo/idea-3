(() => {
  document.body.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');

  const setOpen = open => {
    nav.classList.toggle('open', open);
    header.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

  // Smooth scrolling
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : document.querySelector(id);
    setOpen(false);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -110 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  // Scroll-driven effects
  const parallax = [...document.querySelectorAll('[data-speed]')];
  const breath = document.getElementById('breath');
  const stage = breath && breath.querySelector('.breath-stage');
  const phases = breath ? [...breath.querySelectorAll('[data-phase]')] : [];
  const orb = breath && breath.querySelector('.orb');
  const solidFrom = document.querySelector('.hero') ? 40 : -1;

  const update = () => {
    const vh = innerHeight;
    header.classList.toggle('solid', scrollY > solidFrom);

    if (!reduce) {
      for (const el of parallax) {
        const r = el.getBoundingClientRect();
        const centre = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-centre * parseFloat(el.dataset.speed)).toFixed(1)}px, 0)`;
      }
    }

    if (breath) {
      const br = breath.getBoundingClientRect();
      const span = br.height - vh;
      const p = reduce || span <= 0 ? 1 : Math.min(1, Math.max(0, -br.top / span));
      stage.style.setProperty('--p', p.toFixed(3));
      let phase, s;
      if (p < .3)       { phase = 'in';    s = .55 + (p / .3) * .45; }
      else if (p < .45) { phase = 'hold';  s = 1; }
      else if (p < .72) { phase = 'out';   s = 1 - ((p - .45) / .27) * .4; }
      else              { phase = 'quote'; s = .6 + ((p - .72) / .28) * .25; }
      orb.style.setProperty('--s', s.toFixed(3));
      phases.forEach(el => el.classList.toggle('on', el.dataset.phase === phase));
    }
  };
  update();
  if (lenis) lenis.on('scroll', update);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);

  // Resource filters
  const chips = [...document.querySelectorAll('[data-filter]')];
  const items = [...document.querySelectorAll('[data-topics]')];
  const empty = document.getElementById('filter-empty');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    let shown = 0;
    items.forEach(it => {
      const show = f === 'all' || it.dataset.topics.split(' ').includes(f);
      it.hidden = !show;
      if (show) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }));

  // Contact form: concept only, nothing is sent
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const status = document.getElementById('form-status');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const name = form.querySelector('#f-name').value.trim().split(' ')[0];
      status.textContent = `Thank you, ${name}. This is a design concept, so your message hasn't been sent anywhere.`;
      status.hidden = false;
      form.reset();
    });
  }

  // Cursor ring on precise pointers
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    const c = document.querySelector('.cursor');
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    document.querySelectorAll('a, button, summary, input, textarea, select').forEach(el => {
      el.addEventListener('pointerenter', () => c.classList.add('big'));
      el.addEventListener('pointerleave', () => c.classList.remove('big'));
    });
    const loop = () => {
      cx += (x - cx) * .18; cy += (y - cy) * .18;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }
})();
