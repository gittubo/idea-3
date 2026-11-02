// Local-currency display.
// Catalog prices are stored in USD. Each shopper sees them in their own currency:
// detected from their time zone / browser region, or chosen in the header/footer selector.
// Rates come from a free public feed and are cached for 12 hours; if the feed can't be reached,
// prices stay in USD rather than showing a guessed conversion.
// Note: this changes what shoppers SEE. Charging in that currency is done by the payment
// provider (e.g. Shopify Markets or Stripe multi-currency) once checkout is connected.

export const BASE = 'USD';
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const TTL = 12 * 60 * 60 * 1000;

export const CURRENCIES: [code: string, label: string][] = [
  ['USD', 'US Dollar'], ['NGN', 'Nigerian Naira'], ['GBP', 'British Pound'], ['EUR', 'Euro'],
  ['CAD', 'Canadian Dollar'], ['AUD', 'Australian Dollar'], ['GHS', 'Ghanaian Cedi'], ['KES', 'Kenyan Shilling'],
  ['ZAR', 'South African Rand'], ['XOF', 'West African CFA'], ['XAF', 'Central African CFA'], ['EGP', 'Egyptian Pound'],
  ['MAD', 'Moroccan Dirham'], ['AED', 'UAE Dirham'], ['SAR', 'Saudi Riyal'], ['INR', 'Indian Rupee'],
  ['JPY', 'Japanese Yen'], ['CNY', 'Chinese Yuan'], ['KRW', 'South Korean Won'], ['SGD', 'Singapore Dollar'],
  ['HKD', 'Hong Kong Dollar'], ['CHF', 'Swiss Franc'], ['SEK', 'Swedish Krona'], ['NOK', 'Norwegian Krone'],
  ['DKK', 'Danish Krone'], ['PLN', 'Polish Zloty'], ['TRY', 'Turkish Lira'], ['BRL', 'Brazilian Real'],
  ['MXN', 'Mexican Peso'], ['JMD', 'Jamaican Dollar'], ['NZD', 'New Zealand Dollar'], ['PHP', 'Philippine Peso'],
];

const COUNTRY: Record<string, string> = {
  US: 'USD', NG: 'NGN', GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR',
  PT: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR', CA: 'CAD', AU: 'AUD', NZ: 'NZD', GH: 'GHS', KE: 'KES',
  ZA: 'ZAR', SN: 'XOF', CI: 'XOF', BJ: 'XOF', TG: 'XOF', ML: 'XOF', BF: 'XOF', CM: 'XAF', GA: 'XAF', EG: 'EGP',
  MA: 'MAD', AE: 'AED', SA: 'SAR', IN: 'INR', JP: 'JPY', CN: 'CNY', KR: 'KRW', SG: 'SGD', HK: 'HKD', CH: 'CHF',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', TR: 'TRY', BR: 'BRL', MX: 'MXN', JM: 'JMD', PH: 'PHP',
};
// Time zone is a better country signal than browser language (many browsers default to en-US)
const ZONE: Record<string, string> = {
  'Africa/Lagos': 'NG', 'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Lisbon': 'PT',
  'Europe/Vienna': 'AT', 'Europe/Helsinki': 'FI', 'Europe/Athens': 'GR', 'Africa/Accra': 'GH', 'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA', 'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI', 'Africa/Douala': 'CM', 'Africa/Cairo': 'EG',
  'Africa/Casablanca': 'MA', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK',
  'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL',
  'Europe/Istanbul': 'TR', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX', 'America/Jamaica': 'JM',
  'Pacific/Auckland': 'NZ', 'Asia/Manila': 'PH', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
};

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const supported = new Set(CURRENCIES.map(([c]) => c));

function detect(): string {
  const saved = get('ta-currency');
  if (saved && supported.has(saved)) return saved;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fromZone = ZONE[zone] && COUNTRY[ZONE[zone]];
  if (fromZone) return fromZone;
  for (const lang of navigator.languages ?? [navigator.language]) {
    const region = lang.split('-')[1]?.toUpperCase();
    if (region && COUNTRY[region]) return COUNTRY[region];
  }
  return BASE;
}

let current = detect();
let rates: Record<string, number> | null = null;

function cachedRates(): Record<string, number> | null {
  try {
    const c = JSON.parse(get('ta-fx') ?? 'null');
    if (c && Date.now() - c.t < TTL && c.rates) return c.rates;
  } catch { /* ignore */ }
  return null;
}

async function loadRates() {
  rates = cachedRates();
  if (rates) return;
  try {
    const r = await fetch(RATES_URL);
    const j = await r.json();
    if (j?.result === 'success' && j.rates) {
      rates = j.rates;
      put('ta-fx', JSON.stringify({ t: Date.now(), rates }));
    }
  } catch { /* offline or blocked: stay in USD */ }
}

/** The currency prices are actually being shown in right now. */
export function activeCurrency(): string {
  return current !== BASE && rates?.[current] ? current : BASE;
}

/** Format a USD amount in the shopper's currency. */
export function formatPrice(usd: number): string {
  const code = activeCurrency();
  const amount = code === BASE ? usd : usd * rates![code];
  const big = amount >= 1000;
  return new Intl.NumberFormat(undefined, {
    style: 'currency', currency: code, currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: big ? 0 : undefined, maximumFractionDigits: big ? 0 : 2,
  }).format(amount);
}

function paint(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-usd]').forEach((el) => {
    const v = Number(el.dataset.usd);
    if (Number.isNaN(v)) return;
    const text = formatPrice(v);
    if (el.textContent !== text) el.textContent = text; // only write on change, so the observer doesn't loop
  });
  const code = activeCurrency();
  document.querySelectorAll<HTMLElement>('[data-currency-note]').forEach((el) => {
    const text = `Prices shown in ${code}, converted from USD at today's rate.`;
    if (el.hidden !== (code === BASE)) el.hidden = code === BASE;
    if (el.textContent !== text) el.textContent = text;
  });
}

function syncSelects() {
  document.querySelectorAll<HTMLSelectElement>('[data-currency-select]').forEach((s) => { s.value = current; });
}

export function setCurrency(code: string) {
  if (!supported.has(code)) return;
  current = code;
  put('ta-currency', code);
  syncSelects();
  paint();
  document.dispatchEvent(new CustomEvent('currencychange', { detail: activeCurrency() }));
}

function initSelects() {
  document.querySelectorAll<HTMLSelectElement>('[data-currency-select]').forEach((s) => {
    if (!s.options.length) {
      const compact = s.dataset.compact !== undefined;
      s.innerHTML = CURRENCIES.map(([c, l]) => `<option value="${c}" title="${l}">${compact ? c : `${c} · ${l}`}</option>`).join('');
    }
    s.value = current;
    s.addEventListener('change', () => setCurrency(s.value));
  });
}

// Repaint prices inside anything rendered later (bag, search results, recently viewed)
let queued = false;
new MutationObserver(() => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; paint(); });
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-usd'] });

initSelects();
paint();
loadRates().then(() => {
  paint();
  document.dispatchEvent(new CustomEvent('currencychange', { detail: activeCurrency() }));
});
