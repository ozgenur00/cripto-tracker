const grid = document.getElementById('grid');
const coinsEl = document.getElementById('coins');
const refreshBtn = document.getElementById('refresh');
const autoBtn = document.getElementById('autorefresh');
const updatedAt = document.getElementById('updatedAt');
let auto = null;

function selectedCoins() {
  return Array.from(coinsEl.selectedOptions).map(o => o.value);
}

function fmtUSD(n) {
  if (n === null || n === undefined) return '—';
  const opts = { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 6 : 2 };
  return new Intl.NumberFormat('en-US', opts).format(n);
}

async function fetchPrices(ids) {
  if (!ids.length) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true&precision=6`;
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

function render(data, ids) {
  grid.innerHTML = '';
  ids.forEach(id => {
    const d = data[id];
    const price = d?.usd ?? null;
    const chg = d?.usd_24h_change ?? null;
    const pos = typeof chg === 'number' ? chg >= 0 : null;
    const chgText = chg == null ? '—' : `${(chg).toFixed(2)}%`;
    const sym = id === 'bitcoin' ? 'BTC' : id === 'ethereum' ? 'ETH' : id === 'solana' ? 'SOL' : id.toUpperCase();

    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = `
      <div class="sym">${id} • ${sym}</div>
      <div class="price">${fmtUSD(price)}</div>
      <div class="chg ${pos === null ? '' : (pos ? 'pos' : 'neg')}">
        ${pos === null ? '' : (pos ? '▲' : '▼')} ${chgText}
      </div>
      <div class="small">24h change</div>
    `;
    grid.appendChild(tile);
  });
  updatedAt.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}

async function load() {
  const ids = selectedCoins();
  grid.querySelectorAll('.tile').forEach(t => t.classList.add('pulse'));
  try {
    const data = await fetchPrices(ids);
    render(data, ids);
  } catch (e) {
    grid.innerHTML = `<div class="tile">Failed to load. Try again.</div>`;
  } finally {
    grid.querySelectorAll('.tile').forEach(t => t.classList.remove('pulse'));
  }
}

refreshBtn.addEventListener('click', load);

autoBtn.addEventListener('click', () => {
  if (auto) {
    clearInterval(auto);
    auto = null;
    autoBtn.textContent = 'Auto: Off';
  } else {
    auto = setInterval(load, 15000); // refresh every 15s
    autoBtn.textContent = 'Auto: On (15s)';
    load();
  }
});

// initial
load();
