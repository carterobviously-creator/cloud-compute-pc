let tOut, tIn, tInit = false;

function initTerminal() {
  tOut = document.getElementById('terminal-output');
  tIn = document.getElementById('terminal-input');
  if (!tOut || !tIn) return;
  if (tInit) { tIn.focus(); return; }
  tInit = true;
  putln('Welcome to Cloud Compute Terminal', 'info');
  putln('Type <span class="info">help</span> for commands', '');
  putln('');
  tIn.addEventListener('keydown', e => { if (e.key === 'Enter') handleCmd(); });
  tIn.focus();
}

function putln(t, c) { const d = document.createElement('div'); if(c)d.className=c; d.innerHTML=t; tOut.appendChild(d); tOut.scrollTop = tOut.scrollHeight; }

function handleCmd() {
  const c = tIn.value.trim();
  if (!c) return;
  putln('<span class="prompt">user@cloud:~$</span> ' + c, '');
  tIn.value = '';
  exec(c);
}

function exec(cmd) {
  const p = cmd.trim().split(/\s+/);
  const c = p[0].toLowerCase();
  const a = p.slice(1).join(' ');
  switch(c) {
    case 'help':
      putln('Available commands:', 'info');
      ['help - This help','clear - Clear screen','ls - List files','pwd - Print working dir',
       'whoami - Show user','date - Date/time','echo <t> - Echo text','config - Show server config',
       'build - Build server','server - Server status','deploy - Deploy to cloud',
       'gpu - GPU status','ai <prompt> - Ask AI'].forEach(l => putln('  ' + l, ''));
      break;
    case 'clear': tOut.innerHTML = ''; break;
    case 'pwd': putln('/home/cloud-user', ''); break;
    case 'whoami': putln('cloud-user', ''); break;
    case 'date': putln(new Date().toString(), ''); break;
    case 'ls':
      const dd = new Date().toLocaleDateString();
      putln('drwxr-xr-x  cloud-user cloud-user 4096 ' + dd + '  .', '');
      putln('drwxr-xr-x  cloud-user cloud-user 4096 ' + dd + '  ..', '');
      putln('-rw-r--r--  cloud-user cloud-user 1024 ' + dd + '  server-config.json', '');
      putln('-rw-r--r--  cloud-user cloud-user 2048 ' + dd + '  Dockerfile', '');
      putln('drwxr-xr-x  cloud-user cloud-user 4096 ' + dd + '  models/', '');
      putln('drwxr-xr-x  cloud-user cloud-user 4096 ' + dd + '  data/', '');
      break;
    case 'echo': putln(a || '', ''); break;
    case 'config': {
      const s = localStorage.getItem('serverConfig3d');
      if (!s) { putln('No config found. Build a server in the 3D Configurator!', 'warn'); break; }
      const cfg = JSON.parse(s);
      putln('Server Configuration:', 'info');
      Object.keys(cfg).forEach(k => { if (cfg[k] && k !== 'timestamp' && k !== 'totalPrice') putln('  ' + k + ': ' + cfg[k].name + ' ($' + cfg[k].price + ')', ''); });
      putln('  Total: $' + (cfg.totalPrice || 0).toLocaleString(), 'success');
      break;
    }
    case 'build': {
      const s = localStorage.getItem('serverConfig3d');
      if (!s) { putln('Build a server in the 3D Configurator first!', 'warn'); break; }
      putln('Building server...', ''); setTimeout(() => {
        putln('Validating components...', '');
        setTimeout(() => {
          putln('All components OK.', 'success');
          putln('Creating Docker image...', '');
          setTimeout(() => {
            putln('Deploying to cloud...', '');
            setTimeout(() => putln('Build complete! Server running.', 'success'), 500);
          }, 500);
        }, 400);
      }, 400);
      break;
    }
    case 'server':
      putln('Server Status:', 'info');
      putln('  Status:   Running', 'success');
      putln('  Region:   us-west-2', '');
      putln('  Instance: g6.xlarge (A100)', '');
      putln('  Uptime:   2d 14h 23m', '');
      putln('  CPU:      45%', '');
      putln('  Memory:   62% (24.8/40 GB)', '');
      putln('  GPU:      52% (12.4/80 GB)', '');
      break;
    case 'deploy':
      putln('Deploying to cloud...', '');
      setTimeout(() => putln('Provisioning...', ''), 300);
      setTimeout(() => putln('Configuring network...', ''), 600);
      setTimeout(() => putln('Starting services...', ''), 900);
      setTimeout(() => putln('Server live at: https://srv-cld-001.cloudcompute.app', 'success'), 1200);
      break;
    case 'gpu':
      putln('GPU Status:', 'info');
      putln('  Model:    NVIDIA A100 80GB', '');
      putln('  Memory:   12.4 GB / 80 GB', '');
      putln('  Temp:     58\u00b0C', '');
      putln('  Power:    185W / 400W', '');
      putln('  Util:     52%', '');
      break;
    case 'ai': {
      if (!a) { putln('Usage: ai <your prompt>', 'warn'); break; }
      putln('Thinking...', 'info');
      const reps = [
        "I'm smol-lm 1.7B on A100 GPU. I can help with code, cloud architecture, and more.",
        "Great question! For cloud workloads, I recommend a balanced approach to cost and performance.",
        "Here's a tip: always use infrastructure-as-code (Terraform/Bicep) for managing cloud resources.",
        "Your server build looks solid. Consider adding redundant storage for production workloads.",
      ];
      setTimeout(() => putln(reps[Math.floor(Math.random()*reps.length)], ''), 600 + Math.random()*1000);
      break;
    }
    default: putln('Unknown command: ' + c, 'error'); putln('Type <span class="info">help</span>', '');
  }
}
