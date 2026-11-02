// THEE ARCTIC storefront behaviour: bag, wishlist, drawers, search, listing filters, product page.
// State lives in localStorage until a commerce backend (e.g. Shopify) is connected.
import { garmentSvg, type Garment } from '../data/garments';
import { formatPrice } from './currency';

export interface Item { slug: string; name: string; /** null = not priced yet */ price: number | null; garment: Garment; color: string; hex: string; img?: string }
interface Line extends Item { size: string; qty: number }

const FREE_SHIP = 75;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
// Prices are stored in USD; data-usd lets the currency layer repaint them when the shopper switches currency
const money = (n: number) => `<span data-usd="${n}">${formatPrice(n)}</span>`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable: state lives for this page only */ }
}

let cart: Line[] = load('ta-cart', []);
let wish: Item[] = load('ta-wish', []);

const thumb = (i: Item) => (i.img ? `<img src="${esc(i.img)}" alt="">` : garmentSvg(i.garment, i.hex));

/* ---------- Toast ---------- */
let toastTimer = 0;
export function toast(html: string) {
  const t = $('[data-toast]');
  if (!t) return;
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- Overlays ---------- */
let lastFocus: HTMLElement | null = null;
export function openOverlay(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  lastFocus = document.activeElement as HTMLElement;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
  if (id === 'cart') renderCart();
  if (id === 'search') setTimeout(() => $<HTMLInputElement>('[data-search-input]')?.focus(), 60);
  else setTimeout(() => $<HTMLElement>('[data-close].icon-btn', el)?.focus(), 60);
}
function closeOverlays() {
  $$('.drawer.open, .modal.open').forEach((el) => { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); });
  document.body.classList.remove('locked');
  lastFocus?.focus?.();
}

/* ---------- Bag ---------- */
function persistCart() { save('ta-cart', cart); renderCounts(); renderCart(); renderCartPage(); }

export function addToCart(item: Item, size: string, qty = 1) {
  const found = cart.find((l) => l.slug === item.slug && l.size === size && l.color === item.color);
  if (found) found.qty += qty;
  else cart.unshift({ ...item, size, qty });
  persistCart();
  openOverlay('cart');
}

function setQty(i: number, qty: number) {
  if (!cart[i]) return;
  if (qty <= 0) cart.splice(i, 1);
  else cart[i].qty = Math.min(qty, 10);
  persistCart();
}

const subtotal = () => cart.reduce((s, l) => s + (l.price ?? 0) * l.qty, 0);
const units = () => cart.reduce((s, l) => s + l.qty, 0);

function lineHtml(l: Line, i: number) {
  return `<div class="line">
    <a class="thumb" href="/products/${esc(l.slug)}">${thumb(l)}</a>
    <div>
      <h4><a href="/products/${esc(l.slug)}">${esc(l.name)}</a></h4>
      <div class="meta">${[l.color, `Size ${l.size}`].filter(Boolean).map(esc).join(' · ')}</div>
      <div class="qty" role="group" aria-label="Quantity">
        <button type="button" data-qty="${i}" data-d="-1" aria-label="Decrease">−</button>
        <span>${l.qty}</span>
        <button type="button" data-qty="${i}" data-d="1" aria-label="Increase">+</button>
      </div>
    </div>
    <div class="right"><span>${money((l.price ?? 0) * l.qty)}</span><button type="button" class="remove" data-remove="${i}">Remove</button></div>
  </div>`;
}

function shipMeter() {
  const left = FREE_SHIP - subtotal();
  const pct = Math.min(100, (subtotal() / FREE_SHIP) * 100);
  const msg = left > 0 ? `You're <strong>${money(left)}</strong> away from free shipping` : '<strong>You\'ve unlocked free shipping</strong>';
  return `${msg}<div class="track"><div class="fill" style="width:${pct}%"></div></div>`;
}

function renderCart() {
  const lines = $('[data-cart-lines]');
  if (!lines) return;
  const foot = $('[data-cart-foot]')!;
  const meter = $('[data-ship-meter]')!;
  const label = $('[data-cart-count-text]');
  if (label) label.textContent = units() ? `(${units()})` : '';
  if (!cart.length) {
    lines.innerHTML = `<div class="empty"><p style="margin:0;font-weight:600;color:var(--ink)">Your bag is empty</p><p style="margin:0">Start with something new.</p><a class="btn" href="/new-in">Shop new in</a></div>`;
    foot.hidden = true; meter.hidden = true;
    return;
  }
  foot.hidden = false; meter.hidden = false;
  meter.innerHTML = shipMeter();
  lines.innerHTML = cart.map(lineHtml).join('');
  $('[data-cart-subtotal]')!.innerHTML = money(subtotal());
}

function renderCartPage() {
  const page = $('[data-cart-page]');
  if (!page) return;
  const list = $('[data-cart-page-lines]', page)!;
  const sum = $('[data-cart-page-summary]', page)!;
  if (!cart.length) {
    list.innerHTML = `<div class="empty"><p style="margin:0;font-weight:600;color:var(--ink)">Your bag is empty</p><a class="btn" href="/new-in">Start shopping</a></div>`;
    sum.hidden = true;
    return;
  }
  sum.hidden = false;
  list.innerHTML = `<div class="ship-meter" style="border-radius:12px">${shipMeter()}</div>` + cart.map(lineHtml).join('');
  const sub = subtotal();
  const ship = sub >= FREE_SHIP ? 0 : 7.95;
  $('[data-sum-sub]', sum)!.innerHTML = money(sub);
  $('[data-sum-ship]', sum)!.innerHTML = ship ? money(ship) : 'Free';
  $('[data-sum-total]', sum)!.innerHTML = money(sub + ship);
  $('[data-sum-klarna]', sum)!.innerHTML = money((sub + ship) / 4);
}

/* ---------- Wishlist ---------- */
const isWished = (slug: string) => wish.some((w) => w.slug === slug);
function toggleWish(item: Item) {
  if (isWished(item.slug)) {
    wish = wish.filter((w) => w.slug !== item.slug);
    toast('Removed from wishlist');
  } else {
    wish.unshift(item);
    toast(`Saved to wishlist · <a href="/wishlist" style="text-decoration:underline">View</a>`);
  }
  save('ta-wish', wish);
  syncWishButtons();
  renderCounts();
  renderWishPage();
}
function syncWishButtons() {
  $$('[data-wish]').forEach((b) => {
    const item = JSON.parse(b.dataset.wish!) as Item;
    b.setAttribute('aria-pressed', String(isWished(item.slug)));
  });
}
function renderWishPage() {
  const page = $('[data-wish-page]');
  if (!page) return;
  if (!wish.length) {
    page.innerHTML = `<div class="empty"><p style="margin:0;font-weight:600;color:var(--ink)">Nothing saved yet</p><p style="margin:0">Tap the heart on anything you love and it will wait for you here.</p><a class="btn" href="/new-in">Discover new in</a></div>`;
    return;
  }
  page.innerHTML = `<div class="grid">${wish.map((w) => miniCard(w, true)).join('')}</div>`;
  syncWishButtons();
}

/** A lightweight card for client-rendered lists (wishlist, search, recently viewed). */
function miniCard(i: Item & { was?: number }, withWish = false) {
  const wishBtn = withWish
    ? `<button class="wish" type="button" data-wish='${esc(JSON.stringify(i))}' aria-pressed="true" aria-label="Remove from wishlist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.3 3 4.2 6.2C19.5 15.4 12 20 12 20Z"/></svg></button>`
    : '';
  const price = i.price == null ? '<span class="tba">Price coming soon</span>'
    : i.was ? `<span class="now">${money(i.price)}</span><s>${money(i.was)}</s>` : `<span>${money(i.price)}</span>`;
  return `<article class="card">
    <div class="media"><a class="hit" href="/products/${esc(i.slug)}" aria-label="${esc(i.name)}"></a><div class="pimg main">${thumb(i)}</div>${wishBtn}</div>
    <div class="info"><a class="name" href="/products/${esc(i.slug)}">${esc(i.name)}</a><div class="price">${price}</div></div>
  </article>`;
}

function renderCounts() {
  $$('[data-cart-count]').forEach((c) => { c.textContent = String(units()); c.dataset.n = String(units()); });
  $$('[data-wish-count]').forEach((c) => { c.textContent = String(wish.length); c.dataset.n = String(wish.length); });
}

/* ---------- Search ---------- */
interface Indexed { s: string; n: string; d: string; c: string; p?: number; sp?: number; g: Garment; h: string; cn: string; i?: string }
let index: Indexed[] | null = null;
async function getIndex() {
  if (!index) index = await fetch('/search-index.json').then((r) => r.json());
  return index!;
}
export async function searchProducts(q: string, limit = 24) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const all = await getIndex();
  return all
    .filter((p) => {
      const hay = `${p.n} ${p.d} ${p.c} ${p.cn}`.toLowerCase();
      return terms.every((t) => hay.includes(t) || hay.includes(t.replace(/s$/, '')));
    })
    .slice(0, limit);
}
const toItem = (p: Indexed): Item & { was?: number } => ({ slug: p.s, name: p.n, price: p.sp ?? p.p ?? null, was: p.sp ? p.p : undefined, garment: p.g, color: p.cn, hex: p.h, img: p.i });

let searchTimer = 0;
function wireSearch() {
  const input = $<HTMLInputElement>('[data-search-input]');
  const out = $('[data-search-results]');
  if (!input || !out) return;
  const run = async () => {
    const q = input.value.trim();
    if (!q) { out.innerHTML = ''; return; }
    const res = await searchProducts(q, 12);
    out.innerHTML = res.length
      ? `<div class="row" style="margin-bottom:14px"><span class="eyebrow">${res.length === 12 ? 'Top results' : `${res.length} results`}</span><a class="link-arrow" href="/search?q=${encodeURIComponent(q)}">See all</a></div><div class="grid">${res.map((r) => miniCard(toItem(r))).join('')}</div>`
      : `<p style="color:var(--muted)">No results for “${esc(q)}”. Try “hoodie”, “jeans” or “dress”.</p>`;
  };
  input.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = window.setTimeout(run, 120); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) location.href = `/search?q=${encodeURIComponent(input.value.trim())}`; });
  $$('[data-q]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.q!; run(); input.focus(); }));
}

async function renderSearchPage() {
  const page = $('[data-search-page]');
  if (!page) return;
  const q = new URLSearchParams(location.search).get('q') ?? '';
  const input = $<HTMLInputElement>('input', page);
  if (input) input.value = q;
  const out = $('[data-search-page-results]', page)!;
  const head = $('[data-search-page-head]', page)!;
  if (!q) { head.textContent = 'What are you looking for?'; return; }
  const res = await searchProducts(q, 200);
  head.textContent = `${res.length} result${res.length === 1 ? '' : 's'} for “${q}”`;
  out.innerHTML = res.length ? `<div class="grid">${res.map((r) => miniCard(toItem(r))).join('')}</div>` : '';
}

/* ---------- Recently viewed ---------- */
async function renderRecent() {
  const host = $('[data-recent]');
  if (!host) return;
  const current = host.dataset.recent;
  const slugs = load<string[]>('ta-recent', []).filter((s) => s !== current).slice(0, host.dataset.recentPage !== undefined ? 24 : 8);
  if (!slugs.length) return;
  const all = await getIndex();
  const items = slugs.map((s) => all.find((p) => p.s === s)).filter(Boolean) as Indexed[];
  if (!items.length) return;
  host.hidden = false;
  $('[data-recent-rail]', host)!.innerHTML = items.map((p) => miniCard(toItem(p))).join('');
  $('[data-recent-empty]', host)?.setAttribute('hidden', '');
}

/* ---------- Listing filters ---------- */
function wireListing() {
  const root = $('[data-listing]');
  if (!root) return;
  const grid = $('[data-grid]', root)!;
  const cards = $$('.card', grid);
  const countEl = $('[data-count]', root);
  const more = $<HTMLButtonElement>('[data-more]', root);
  const sortSel = $<HTMLSelectElement>('[data-sort]', root);
  const PAGE = 24;
  let shown = PAGE;
  const state = { sizes: new Set<string>(), colors: new Set<string>(), price: '', sale: false, isNew: false, cat: '' };

  const params = new URLSearchParams(location.search);
  if (params.get('filter') === 'sale') state.sale = true;
  if (params.get('filter') === 'new') state.isNew = true;
  if (params.get('sort') && sortSel) sortSel.value = params.get('sort')!;

  const match = (c: HTMLElement) => {
    const d = c.dataset;
    if (state.sale && d.sale !== '1') return false;
    if (state.isNew && d.new !== '1') return false;
    if (state.cat && d.cat !== state.cat) return false;
    if (state.sizes.size && !d.sizes!.split('|').some((s) => state.sizes.has(s))) return false;
    if (state.colors.size && !d.colors!.split('|').some((s) => state.colors.has(s))) return false;
    if (state.price) {
      const [lo, hi] = state.price.split('-').map(Number);
      const p = Number(d.price);
      if (p < lo || p > hi) return false;
    }
    return true;
  };

  const sorters: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
    featured: (a, b) => +a.dataset.idx! - +b.dataset.idx!,
    new: (a, b) => +b.dataset.new! - +a.dataset.new! || +a.dataset.idx! - +b.dataset.idx!,
    best: (a, b) => +b.dataset.reviews! - +a.dataset.reviews!,
    'price-asc': (a, b) => +a.dataset.price! - +b.dataset.price!,
    'price-desc': (a, b) => +b.dataset.price! - +a.dataset.price!,
    rating: (a, b) => +b.dataset.rating! - +a.dataset.rating!,
  };

  const apply = () => {
    const sorted = [...cards].sort(sorters[sortSel?.value ?? 'featured'] ?? sorters.featured);
    sorted.forEach((c) => grid.appendChild(c));
    const visible = sorted.filter(match);
    sorted.forEach((c) => (c.hidden = true));
    visible.slice(0, shown).forEach((c) => (c.hidden = false));
    if (countEl) countEl.textContent = `${visible.length} item${visible.length === 1 ? '' : 's'}`;
    if (more) more.hidden = visible.length <= shown;
    $('[data-no-results]', root)?.toggleAttribute('hidden', visible.length > 0);
    // reflect toggles
    $$<HTMLButtonElement>('[data-toggle]', root).forEach((b) => {
      const k = b.dataset.toggle as 'sale' | 'isNew';
      b.setAttribute('aria-pressed', String(state[k]));
    });
    $$<HTMLButtonElement>('[data-cat-chip]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.catChip === state.cat)));
    const active = state.sizes.size + state.colors.size + (state.price ? 1 : 0);
    $$('[data-filter-count]', root).forEach((e) => (e.textContent = active ? `(${active})` : ''));
  };

  sortSel?.addEventListener('change', () => { shown = PAGE; apply(); });
  more?.addEventListener('click', () => { shown += PAGE; apply(); });
  $$<HTMLButtonElement>('[data-toggle]', root).forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.toggle as 'sale' | 'isNew';
    state[k] = !state[k]; shown = PAGE; apply();
  }));
  $$<HTMLButtonElement>('[data-cat-chip]', root).forEach((b) => b.addEventListener('click', () => {
    state.cat = state.cat === b.dataset.catChip ? '' : b.dataset.catChip!; shown = PAGE; apply();
  }));
  // Filter drawer controls
  const panel = document.getElementById('filters');
  panel?.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'size') t.checked ? state.sizes.add(t.value) : state.sizes.delete(t.value);
    if (t.name === 'color') t.checked ? state.colors.add(t.value) : state.colors.delete(t.value);
    if (t.name === 'price') state.price = t.value;
    shown = PAGE; apply();
  });
  $('[data-clear]', panel ?? undefined)?.addEventListener('click', () => {
    state.sizes.clear(); state.colors.clear(); state.price = '';
    $$<HTMLInputElement>('input', panel!).forEach((i) => (i.checked = i.value === ''));
    shown = PAGE; apply();
  });
  apply();
}

/* ---------- Product page ---------- */
function wirePdp() {
  const root = $('[data-pdp]');
  if (!root) return;
  const base = JSON.parse(root.dataset.pdp!) as Item & { images: string[] };
  let color = base.color, hex = base.hex, size = '';
  const sizeMsg = $('[data-size-msg]', root);
  const colorLabel = $('[data-color-label]', root);
  const sizeLabel = $('[data-size-label]', root);

  // remember for "recently viewed"
  const recent = load<string[]>('ta-recent', []).filter((s) => s !== base.slug);
  recent.unshift(base.slug);
  save('ta-recent', recent.slice(0, 12));

  $$<HTMLButtonElement>('[data-color]', root).forEach((b) => b.addEventListener('click', () => {
    color = b.dataset.color!; hex = b.dataset.hex!;
    $$('[data-color]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (colorLabel) colorLabel.textContent = color;
    if (!base.images.length) $$('[data-gallery-art]').forEach((g) => (g.innerHTML = garmentSvg(base.garment, hex)));
  }));
  $$<HTMLButtonElement>('[data-pick-size]', root).forEach((b) => b.addEventListener('click', () => {
    size = b.dataset.pickSize!;
    $$('[data-pick-size]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (sizeLabel) sizeLabel.textContent = size;
    sizeMsg?.setAttribute('hidden', '');
  }));
  const single = $$('[data-pick-size]', root);
  if (single.length === 1) (single[0] as HTMLButtonElement).click();

  const add = () => {
    if (!size) {
      sizeMsg?.removeAttribute('hidden');
      const box = $('[data-size-box]', root);
      box?.classList.remove('shake'); void (box as HTMLElement)?.offsetWidth; box?.classList.add('shake');
      return;
    }
    addToCart({ ...base, color, hex }, size);
  };
  $$('[data-add]', root).forEach((b) => b.addEventListener('click', add));
  $('[data-add-sticky]')?.addEventListener('click', () => {
    if (!size) { root.scrollIntoView({ behavior: 'smooth' }); setTimeout(add, 400); } else add();
  });

  // Sticky add bar appears once the main button scrolls away
  const mainBtn = $('[data-add]', root);
  const sticky = $('[data-sticky-bar]');
  if (mainBtn && sticky) {
    new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(mainBtn);
  }

  // Mobile gallery dots
  const rail = $('[data-gallery]');
  const dots = $$('[data-dot]');
  if (rail && dots.length) {
    rail.addEventListener('scroll', () => {
      const i = Math.round(rail.scrollLeft / rail.clientWidth);
      dots.forEach((d, j) => d.classList.toggle('on', i === j));
    }, { passive: true });
  }
}

/* ---------- Small things ---------- */
function wireAnnouncements() {
  const items = $$('[data-announce] li');
  if (items.length < 2) return;
  let i = 0;
  setInterval(() => {
    items[i].classList.remove('on'); items[i].classList.add('out');
    const prev = items[i];
    setTimeout(() => prev.classList.remove('out'), 700);
    i = (i + 1) % items.length;
    items[i].classList.add('on');
  }, 4200);
}

function wireReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

function wireRails() {
  $$<HTMLButtonElement>('[data-rail-btn]').forEach((b) => b.addEventListener('click', () => {
    const rail = document.getElementById(b.dataset.railBtn!);
    if (rail) rail.scrollBy({ left: (b.dataset.dir === 'prev' ? -1 : 1) * rail.clientWidth * 0.8, behavior: 'smooth' });
  }));
}

function wireNewsletter() {
  $$<HTMLFormElement>('[data-newsletter]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    // Not connected to an email provider yet: hook this up to Klaviyo/Mailchimp/Shopify Customers.
    const msg = f.parentElement?.querySelector('[data-newsletter-msg]');
    if (msg) msg.textContent = "You're on the list. Check your inbox for your 15% off code.";
    f.reset();
  }));
}

function finishPreloader() {
  const pre = document.getElementById('preloader');
  if (!pre) return;
  try { sessionStorage.setItem('ta-intro', '1'); } catch { /* ignore */ }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => { pre.classList.add('done'); setTimeout(() => pre.remove(), 900); }, reduce ? 0 : 1000);
}

/* ---------- Deferred images (menu features, card hover photos) ---------- */
const loadDeferred = (e: Event) => {
  const host = (e.target as HTMLElement).closest?.('.card, .nav > ul > li');
  host?.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => { img.src = img.dataset.src!; img.removeAttribute('data-src'); });
};
document.addEventListener('pointerover', loadDeferred, { passive: true });
document.addEventListener('focusin', loadDeferred);

/* ---------- Global click delegation ---------- */
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const open = t.closest<HTMLElement>('[data-open]');
  if (open) { e.preventDefault(); closeOverlays(); openOverlay(open.dataset.open!); return; }
  if (t.closest('[data-close]')) { closeOverlays(); return; }

  const wishBtn = t.closest<HTMLElement>('[data-wish]');
  if (wishBtn) { e.preventDefault(); toggleWish(JSON.parse(wishBtn.dataset.wish!)); return; }

  const quick = t.closest<HTMLElement>('[data-quick] [data-size]');
  if (quick) {
    const item = JSON.parse(quick.closest<HTMLElement>('[data-quick]')!.dataset.quick!) as Item;
    addToCart(item, quick.dataset.size!);
    return;
  }
  const qty = t.closest<HTMLElement>('[data-qty]');
  if (qty) { const i = +qty.dataset.qty!; setQty(i, cart[i].qty + +qty.dataset.d!); return; }
  const rm = t.closest<HTMLElement>('[data-remove]');
  if (rm) { setQty(+rm.dataset.remove!, 0); return; }
  const add = t.closest<HTMLElement>('[data-add-item]');
  if (add) { addToCart(JSON.parse(add.dataset.addItem!), add.dataset.size ?? 'One Size'); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlays(); });
window.addEventListener('storage', (e) => {
  if (e.key === 'ta-cart') { cart = load('ta-cart', []); renderCounts(); renderCart(); renderCartPage(); }
  if (e.key === 'ta-wish') { wish = load('ta-wish', []); renderCounts(); syncWishButtons(); renderWishPage(); }
});

renderCounts();
syncWishButtons();
renderCartPage();
renderWishPage();
wireSearch();
renderSearchPage();
renderRecent();
wireListing();
wirePdp();
wireAnnouncements();
wireReveal();
wireRails();
wireNewsletter();
finishPreloader();
