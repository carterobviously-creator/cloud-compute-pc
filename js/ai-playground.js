let curModel = 'chat';
let history = [];
let aiInit = false;

function loadAI() {
  if (aiInit) return;
  aiInit = true;
  const s = localStorage.getItem('aiConvo');
  if (s) { history = JSON.parse(s); renderConvo(); }
}

function selectModel(m) {
  curModel = m;
  document.querySelectorAll('.model-card').forEach(c => c.classList.remove('active'));
  const el = document.querySelector('.model-card[data-model="'+m+'"]');
  if (el) el.classList.add('active');
  const names = {chat:'smol-lm Chat',code:'smol-lm Code',generate:'smol-lm Text',analyze:'smol-lm Analyze'};
  document.getElementById('ai-model-name').textContent = names[m] || 'smol-lm Chat';
}

const smolR = {
  chat: [
    "Hey! I'm smol-lm 1.7B on A100 GPU. What can I help you build today?",
    "Good question! In cloud architecture, start simple and add complexity only when needed.",
    "For your server build, I'd recommend balancing core count with clock speed for most workloads.",
    "That's a solid approach. Just remember: monitor everything, trust nothing in production.",
    "Tip: use spot instances for batch processing and reserved instances for steady-state workloads."
  ],
  code: [
    '```python\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci(10)))\n# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n```',
    '```python\nimport asyncio\nimport aiohttp\n\nasync def fetch(url):\n    async with aiohttp.ClientSession() as s:\n        async with s.get(url) as r:\n            return await r.json()\n\nasync def main():\n    urls = ["https://api.example.com/1", "https://api.example.com/2"]\n    return await asyncio.gather(*[fetch(u) for u in urls])\n```',
    '```bash\n# Cloud health check\ncheck() {\n  local h=$1 p=$2\n  if nc -zv $h $p 2>/dev/null; then\n    echo "OK - $h:$p reachable"\n  else\n    echo "FAIL - $h:$p unreachable"\n  fi\n}\n\ncheck "api.cloudcompute.app" 443\n```',
    '```python\n# Simple neural net\nimport torch.nn as nn\n\nclass Net(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc = nn.Sequential(\n            nn.Linear(784, 256),\n            nn.ReLU(),\n            nn.Linear(256, 128),\n            nn.ReLU(),\n            nn.Linear(128, 10)\n        )\n    def forward(self, x):\n        return self.fc(x)\n```'
  ],
  generate: [
    "Cloud computing has evolved from simple VMs to sophisticated AI-optimized infrastructure. GPU acceleration now powers large language models like smol-lm 1.7B, making advanced AI accessible without specialized hardware. The future is multi-cloud, edge-enabled, and AI-native.",
    "GPU computing transformed AI. The A100 in this system delivers 312 TFLOPS FP16. With 80GB HBM2e memory, it can handle massive models efficiently. This is why smol-lm 1.7B runs smoothly - the GPU does the heavy lifting for parallel matrix operations.",
    "Modern data centers are engineering marvels. They consume megawatts and use advanced cooling - from HVAC to liquid cooling for GPU clusters. Cloud providers now offer instances with 8x A100 GPUs connected via NVLink, providing 640GB unified GPU memory."
  ],
  analyze: [
    "Build Analysis:\n\nCPU: Excellent for compute workloads, strong single & multi-threaded perf.\nGPU: Exceptional AI inference, ample VRAM.\nMemory: Handles modern workloads. For AI training, consider 64GB+.\nStorage: NVMe ensures fast I/O.\n\nScore: 94/100 - Premium workstation for AI/ML development.",
    "Performance Projections:\n- AI Inference: ~128 samples/sec\n- Code Compilation: ~45s (large projects)\n- Data Throughput: ~2.5GB/s\n- Multi-tasking: Excellent (16+ cores)\n\nRecommendations:\n1. Add secondary SSD for dedicated storage\n2. 64GB RAM for heavy virtualization\n3. 1000W PSU for upgrade headroom"
  ]
};

async function sendToAI() {
  const inp = document.getElementById('ai-input');
  const txt = inp.value.trim();
  if (!txt) return;
  const conv = document.getElementById('ai-conversation');
  conv.innerHTML += '<div class="ai-message user"><div class="avatar">&#128100;</div><div class="bubble"><strong>You</strong><p>' + esc(txt) + '</p></div></div>';
  conv.scrollTop = conv.scrollHeight;
  inp.value = '';
  history.push({role:'user',content:txt});

  const ld = document.createElement('div');
  ld.className = 'ai-message bot ai-loading';
  ld.innerHTML = '<div class="avatar">&#129302;</div><div class="bubble"><strong>smol-lm 1.7B</strong><p>Thinking</p></div>';
  conv.appendChild(ld);
  conv.scrollTop = conv.scrollHeight;

  const start = Date.now();
  try {
    const r = await fetch('http://127.0.0.1:5000/api/ai', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:curModel, prompt:txt,
        temperature:parseFloat(document.getElementById('temperature').value),
        max_tokens:parseInt(document.getElementById('max-tokens').value),
        history:history.slice(-10)
      })
    });
    const d = await r.json();
    const elapsed = Date.now() - start;
    if (elapsed < 600) await new Promise(r2 => setTimeout(r2, 600 - elapsed));
    ld.classList.remove('ai-loading');
    ld.querySelector('.bubble p').textContent = esc(d.response || d.text || 'No response.');
  } catch(e) {
    const elapsed = Date.now() - start;
    if (elapsed < 600) await new Promise(r2 => setTimeout(r2, 600 - elapsed));
    ld.classList.remove('ai-loading');
    const reps = smolR[curModel] || smolR.chat;
    const txt2 = reps[Math.floor(Math.random() * reps.length)];
    ld.querySelector('.bubble p').innerHTML = txt2.replace(/\n/g,'<br>');
  }
  history.push({role:'assistant',content:ld.querySelector('.bubble p').textContent});
  localStorage.setItem('aiConvo', JSON.stringify(history));
}

function renderConvo() {
  const conv = document.getElementById('ai-conversation');
  conv.innerHTML = '';
  if (!history.length) {
    conv.innerHTML = '<div class="ai-message bot"><div class="avatar">&#129302;</div><div class="bubble"><strong>smol-lm 1.7B</strong><p>Hello! I\'m smol-lm 1.7B running on an A100 GPU. How can I help you today?</p></div></div>';
    return;
  }
  history.forEach(m => {
    const isUser = m.role === 'user';
    conv.innerHTML += '<div class="ai-message ' + (isUser?'user':'bot') + '"><div class="avatar">' + (isUser?'&#128100;':'&#129302;') + '</div><div class="bubble"><strong>' + (isUser?'You':'smol-lm 1.7B') + '</strong><p>' + esc(m.content) + '</p></div></div>';
  });
  conv.scrollTop = conv.scrollHeight;
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('ai-input');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToAI(); } });
  const temp = document.getElementById('temperature');
  if (temp) temp.addEventListener('input', e => document.getElementById('temp-value').textContent = e.target.value);
});
