let currentPage = 'dashboard';

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  const btn = document.querySelector('.nav-btn[data-page="' + page + '"]');
  if (btn) btn.classList.add('active');
  if (page === 'dashboard') renderDashboard();
  if (page === 'terminal') initTerminal();
  if (page === 'configurator3d') init3DConfigurator();
  if (page === 'ai') loadAI();
}

const catLabels = {cpu:'CPU',gpu:'GPU',storage:'Storage',memory:'Memory',case:'Case',powerSupply:'PSU'};

const compData = {
  cpu: [
    {id:'cpu-i7',name:'Intel Core i7-14700K',spec:'20C/28T, 3.4-5.6GHz',price:439,icon:'⚡',color:'#5a5a6a'},
    {id:'cpu-r9',name:'AMD Ryzen 9 7950X',spec:'16C/32T, 4.5-5.7GHz',price:699,icon:'⚡',color:'#d4302a'},
    {id:'cpu-i9',name:'Intel Core i9-14900K',spec:'24C/32T, 3.2-6.0GHz',price:899,icon:'⚡',color:'#5a5a6a'},
  ],
  gpu: [
    {id:'gpu-4090',name:'NVIDIA RTX 4090',spec:'24GB GDDR6X, 16384 CUDA',price:1599,icon:'🎮',color:'#76b900'},
    {id:'gpu-4080',name:'NVIDIA RTX 4080',spec:'16GB GDDR6X, 9728 CUDA',price:1199,icon:'🎮',color:'#76b900'},
    {id:'gpu-7900',name:'AMD RX 7900 XTX',spec:'24GB GDDR6, RDNA 3',price:999,icon:'🎮',color:'#e83230'},
  ],
  storage: [
    {id:'st-1tb',name:'1TB NVMe SSD',spec:'PCIe 4.0, 7000MB/s',price:89,icon:'💾',color:'#1a7a2a'},
    {id:'st-2tb',name:'2TB NVMe SSD',spec:'PCIe 4.0, 7000MB/s',price:169,icon:'💾',color:'#1a7a2a'},
    {id:'st-4tb',name:'4TB NVMe SSD',spec:'PCIe 4.0, 7000MB/s',price:299,icon:'💾',color:'#1a7a2a'},
  ],
  memory: [
    {id:'ram-16',name:'16GB DDR5-5600',spec:'1x16GB module',price:49,icon:'🧠',color:'#2a6a2a'},
    {id:'ram-32',name:'32GB DDR5-6000',spec:'2x16GB dual channel',price:89,icon:'🧠',color:'#2a6a2a'},
    {id:'ram-64',name:'64GB DDR5-6000',spec:'2x32GB dual channel',price:179,icon:'🧠',color:'#2a6a2a'},
  ],
  case: [
    {id:'case-gaming',name:'Gaming Case X',spec:'ARGB, mesh front, TG side',price:89,icon:'📦',color:'#2a2a3a'},
    {id:'case-minimal',name:'Minimalist Case',spec:'Silent, brushed alu',price:59,icon:'📦',color:'#aaa'},
    {id:'case-rack',name:'Server Rack 2U',spec:'Enterprise, hot-swap bays',price:199,icon:'📦',color:'#444'},
  ],
  powerSupply: [
    {id:'psu-650',name:'650W 80+ Bronze',spec:'Semi-modular',price:59,icon:'🔌',color:'#555'},
    {id:'psu-750',name:'750W 80+ Gold',spec:'Fully modular',price:99,icon:'🔌',color:'#888'},
    {id:'psu-850',name:'850W 80+ Platinum',spec:'Fully modular, ATX 3.0',price:149,icon:'🔌',color:'#aaa'},
  ],
};

let selected = {cpu:null,gpu:null,storage:null,memory:null,case:{id:'case-default',name:'ATX Mid Tower',spec:'Tempered glass, mesh front',price:89,icon:'📦'},powerSupply:null};

function renderDashboard() {
  const el = document.getElementById('page-dashboard');
  if (!el) return;
  const saved = localStorage.getItem('serverConfig3d');
  if (!saved) {
    el.innerHTML = `<div class="card"><div class="welcome-section">
      <h2>&#9729; Cloud Compute</h2>
      <p>Build your dream server with the 3D configurator, manage it with the terminal, and run AI models.</p>
      <div class="quick-actions">
        <button class="action-btn" onclick="navigateTo('configurator3d')">&#128736;&#65039; Start Building</button>
        <button class="action-btn sec" onclick="navigateTo('terminal')">&#128187; Open Terminal</button>
        <button class="action-btn acc" onclick="navigateTo('ai')">&#129302; AI Playground</button>
      </div>
    </div></div>`;
    return;
  }
  const cfg = JSON.parse(saved);
  let items = '';
  let total = 0;
  Object.keys(cfg).forEach(k => {
    if (!cfg[k] || k === 'totalPrice' || k === 'timestamp') return;
    items += `<div class="config-item"><div class="label">${catLabels[k]||k}</div><div class="val">${cfg[k].name}</div><div class="pr">$${cfg[k].price}</div></div>`;
    total += cfg[k].price;
  });
  el.innerHTML = `<div class="card">
    <h2>&#128202; Server Dashboard</h2>
    <p>Your saved server configuration</p>
    <div class="config-display">${items}</div>
    <div class="build-total" style="margin:1rem 0;padding:.6rem 0;border-top:1px solid rgba(255,255,255,.06)"><span>Total</span><span id="build-total-price" style="color:#7c83ff;font-size:1.3rem">$${(cfg.totalPrice||total).toLocaleString()}</span></div>
    <div style="display:flex;gap:.75rem;flex-wrap:wrap">
      <button class="action-btn" onclick="navigateTo('configurator3d')">&#128736;&#65039; Edit Build</button>
      <button class="action-btn sec" onclick="navigateTo('terminal')">&#128187; Terminal</button>
      <button class="action-btn acc" onclick="navigateTo('ai')">&#129302; AI Playground</button>
    </div>
  </div>`;
}

function save3DConfig() {
  const missing = Object.keys(selected).filter(k => !selected[k]);
  if (missing.length) {
    document.getElementById('build-list').innerHTML = '<p style="color:#f87171;font-size:.8rem">Select all components first!</p>';
    return;
  }
  const total = Object.values(selected).reduce((s,c) => s + c.price, 0);
  const cfg = {...selected, totalPrice: total, timestamp: new Date().toISOString()};
  localStorage.setItem('serverConfig3d', JSON.stringify(cfg));
  navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.addEventListener('click', () => navigateTo(b.dataset.page));
  });
  navigateTo('dashboard');
});
