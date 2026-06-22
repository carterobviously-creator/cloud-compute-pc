/* 3D Configurator — click parts in sidebar, they appear in the case */
let scene, camera, renderer, controls;
let threeInit = false;
let autoRotate = true;
let caseOpen = false;
let caseGroup = null;
let placedParts = {};
let current3DType = 'cpu';

const SLOT_POS = {
  cpu:    [0, 0.45, 0.05],
  gpu:    [0.7, 0.22, 0.55],
  storage:[0.25, 0.28, -0.3],
  memory: [-0.5, 0.35, -0.45],
  powerSupply:[0, 0.25, -1.15]
};

function init3DConfigurator() {
  buildTabs();
  buildOptions(current3DType);
  updateBuildList();
  if (!threeInit) { threeInit = true; initScene(); }
  else {
    const c = document.getElementById('three-container');
    if (c && renderer && !c.contains(renderer.domElement)) c.appendChild(renderer.domElement);
    refreshScene();
  }
}

function initScene() {
  const container = document.getElementById('three-container');
  const w = container.clientWidth || 720;
  const h = container.clientHeight || 540;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e1a);
  scene.fog = new THREE.Fog(0x0e0e1a, 8, 16);

  camera = new THREE.PerspectiveCamera(28, w/h, 0.1, 30);
  camera.position.set(3.5, 3, 4.5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = false;
  controls.target.set(0, 0.8, 0);
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.update();

  scene.add(new THREE.AmbientLight(0x404070, 0.5));
  const key = new THREE.DirectionalLight(0xffeedd, 1.2);
  key.position.set(4, 8, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8888ff, 0.4);
  fill.position.set(-3, 2, -4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.3);
  rim.position.set(0, -2, 5); scene.add(rim);

  const gMat = new THREE.MeshStandardMaterial({ color: 0x0a0a18, roughness: 0.8, metalness: 0.1, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), gMat);
  g.rotation.x = -Math.PI/2; g.position.y = -0.3; g.receiveShadow = true; scene.add(g);
  scene.add(new THREE.GridHelper(8, 20, 0x7c83ff22, 0x7c83ff08));

  buildCase();
  container.addEventListener('click', onCaseClick);
  window.addEventListener('resize', onResize);
  animate();
}

function refreshScene() {
  if (caseGroup) scene.remove(caseGroup);
  placedParts = {};
  buildCase();
  // Re-place any selected components
  Object.keys(selected).forEach(k => {
    if (selected[k]) placePart(k);
  });
}

// ============ CASE ============
function buildCase() {
  if (caseGroup) { scene.remove(caseGroup); caseGroup = null; }
  caseGroup = new THREE.Group();
  caseGroup.userData.isCase = true;

  const cw = 2.8, ch = 2.4, cd = 1.8;

  // Chassis (wireframe/transparent shell)
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x7c83ff, transparent: true, opacity: 0.25 });
  const edgeGeo = new THREE.BoxGeometry(cw, ch, cd);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(edgeGeo), edgeMat);
  edges.position.y = ch/2;
  caseGroup.add(edges);

  // Glass panels
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x4466aa, roughness: 0.05, metalness: 0.05,
    transparent: true, opacity: 0.08, side: THREE.DoubleSide
  });
  // Front glass
  const fg = new THREE.Mesh(new THREE.BoxGeometry(cw*0.96, ch*0.96, 0.005), glassMat);
  fg.position.set(0, ch/2, cd/2); caseGroup.add(fg);
  // Top glass
  const tg = new THREE.Mesh(new THREE.BoxGeometry(cw*0.96, 0.005, cd*0.96), glassMat);
  tg.position.set(0, ch, 0); caseGroup.add(tg);
  // Back panel (dark)
  const bpMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.5, metalness: 0.2 });
  const bp = new THREE.Mesh(new THREE.BoxGeometry(cw*0.96, ch*0.96, 0.01), bpMat);
  bp.position.set(0, ch/2, -cd/2); caseGroup.add(bp);
  // Bottom
  const botMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.6, metalness: 0.1 });
  const bot = new THREE.Mesh(new THREE.BoxGeometry(cw*0.96, 0.01, cd*0.96), botMat);
  bot.position.y = 0; caseGroup.add(bot);

  // Side panel (toggle)
  const sideMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a2440, roughness: 0.05, metalness: 0.1,
    transparent: true, opacity: 0.15, side: THREE.DoubleSide
  });
  window.sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.01, ch*0.92, cd*0.92), sideMat);
  window.sidePanel.position.set(cw/2, ch/2, 0);
  window.sidePanel.userData.isSidePanel = true;
  caseGroup.add(window.sidePanel);

  // Motherboard tray
  const mbMat = new THREE.MeshStandardMaterial({ color: 0x0d2a0d, roughness: 0.6, metalness: 0.1 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(cw*0.75, 0.04, cd*0.65), mbMat);
  tray.position.set(0, 0.2, 0.05); tray.receiveShadow = true; caseGroup.add(tray);

  // MB traces
  const trMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.5 });
  for (let i=0;i<10;i++) { const t=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.002,0.004),trMat); t.position.set(-0.5+i*0.12,0.221,-0.15+Math.sin(i)*0.2); caseGroup.add(t); }
  for (let i=0;i<6;i++) { const t=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.002,0.3),trMat); t.position.set(-0.2+Math.sin(i)*0.08,0.221,-0.3+i*0.12); caseGroup.add(t); }

  // CPU socket area (raised platform)
  const sockMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.4, metalness: 0.3 });
  const sock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), sockMat);
  sock.position.set(0, 0.23, 0.05); caseGroup.add(sock);

  // Corner pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7c83ff, emissive: 0x7c83ff, emissiveIntensity: 0.05 });
  [[-cw/2,ch/2,-cd/2],[cw/2,ch/2,-cd/2],[-cw/2,ch/2,cd/2]].forEach(p => {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.03, ch, 0.03), pillarMat);
    pl.position.set(p[0],p[1],p[2]); caseGroup.add(pl);
  });

  // LED strip
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x7c83ff, emissive: 0x7c83ff, emissiveIntensity: 0.5 });
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.8, 0.015), ledMat);
  led.position.set(-cw/2+0.05, 1.0, 0.3); caseGroup.add(led);
  const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.8, 0.015), ledMat);
  led2.position.set(-cw/2+0.05, 1.0, -0.3); caseGroup.add(led2);

  // Power button
  const btnMat = new THREE.MeshStandardMaterial({ color: 0x7c83ff, emissive: 0x7c83ff, emissiveIntensity: 0.8 });
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.03,16), btnMat);
  btn.rotation.x=Math.PI/2; btn.position.set(0.25,0.3,cd/2+0.01); caseGroup.add(btn);

  // Vent pattern on front
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x222240, transparent: true, opacity: 0.2 });
  for (let i=0;i<12;i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.005), ventMat);
    v.position.set(-0.5+i*0.1, 0.5+Math.sin(i)*0.1, cd/2+0.008); caseGroup.add(v);
  }

  // === SLOTS ===
  buildSlots();

  caseGroup.position.y = 0;
  scene.add(caseGroup);
  updateBuildList();
  document.getElementById('view-label').textContent = 'SERVER CASE';
  document.getElementById('placement-info').textContent = 'Click a component in the sidebar to add it to your build';
}

function buildSlots() {
  // Remove existing slots
  const toRemove = [];
  caseGroup.traverse(c => { if (c.userData && c.userData.isSlot) toRemove.push(c); });
  toRemove.forEach(c => caseGroup.remove(c));
  
  Object.keys(SLOT_POS).forEach(type => {
    if (placedParts[type]) return;
    const pos = SLOT_POS[type];
    const size = type==='gpu'?[1.6,0.005,0.5]:type==='cpu'?[0.5,0.005,0.5]:type==='memory'?[0.3,0.005,0.08]:type==='storage'?[0.5,0.005,0.12]:[1.0,0.005,0.6];
    const slotMat = new THREE.MeshStandardMaterial({
      color: 0x7c83ff, emissive: 0x7c83ff, emissiveIntensity: 0.15,
      transparent: true, opacity: 0.2
    });
    const slot = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), slotMat);
    slot.position.set(pos[0], pos[1]-0.02, pos[2]);
    slot.userData.isSlot = true; slot.userData.slotType = type;
    caseGroup.add(slot);

    // Label glow dot
    const lbl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.002, 0.04), new THREE.MeshStandardMaterial({color:0x7c83ff,emissive:0x7c83ff,emissiveIntensity:0.4,transparent:true,opacity:0.5}));
    lbl.position.set(pos[0]-0.25, pos[1]-0.012, pos[2]);
    lbl.userData.isSlot = true;
    caseGroup.add(lbl);
  });
}

function toggleCase() {
  caseOpen = !caseOpen;
  if (!window.sidePanel) return;
  const sp = window.sidePanel;
  const targetX = caseOpen ? 1.0 : 0;
  const targetOp = caseOpen ? 0.02 : 0.15;
  const startX = sp.position.x;
  const startOp = sp.material.opacity;
  const dur = 400;
  const t0 = performance.now();
  function anim(now) {
    const t = Math.min((now-t0)/dur, 1);
    const e = 1 - Math.pow(1-t, 3);
    sp.position.x = startX + (targetX-startX)*e;
    sp.material.opacity = startOp + (targetOp-startOp)*e;
    if (t<1) requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);
  document.getElementById('placement-info').textContent = caseOpen ? 'Case is open — click parts in sidebar to add' : 'Click case to open';
}

function onCaseClick(e) {
  const container = document.getElementById('three-container');
  const rect = container.getBoundingClientRect();
  const mx = ((e.clientX-rect.left)/rect.width)*2-1;
  const my = -((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(new THREE.Vector2(mx,my), camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (let hit of hits) {
    let obj = hit.object;
    while (obj) {
      if (obj.userData && obj.userData.isSidePanel) { toggleCase(); return; }
      obj = obj.parent;
    }
  }
  // Click on empty space: if case closed, open it
  if (!caseOpen) toggleCase();
}

// ============ BUILD 3D PARTS ============
function buildPart3D(type, group) {
  const item = selected[type];
  switch(type) {
    case 'cpu': {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.45,0.05,0.45), new THREE.MeshStandardMaterial({color:0x1a1a2a,roughness:0.4,metalness:0.1}));
      s.position.y=0.025; s.castShadow=true; group.add(s);
      const i = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.04,0.38), new THREE.MeshStandardMaterial({color:0x888899,roughness:0.15,metalness:0.85,emissive:0x222244,emissiveIntensity:0.05}));
      i.position.y=0.065; i.castShadow=true; group.add(i);
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.34,0.02,0.34), new THREE.MeshStandardMaterial({color:0x999aaa,roughness:0.1,metalness:0.9}));
      t.position.y=0.09; group.add(t);
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.005,0.025), new THREE.MeshStandardMaterial({color:0x7c83ff,emissive:0x7c83ff,emissiveIntensity:0.3}));
      d.position.set(0,0.1,-0.08); group.add(d);
      // Gold pins
      const gm = new THREE.MeshStandardMaterial({color:0xccaa44,roughness:0.2,metalness:0.9});
      for (let i=0;i<8;i++) for (let j=0;j<8;j++) { const p=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.02,4),gm); p.position.set(-0.15+i*0.04,0.005,-0.15+j*0.04); group.add(p); }
      break;
    }
    case 'gpu': {
      const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.5,0.06,0.5), new THREE.MeshStandardMaterial({color:0x0a2a0a,roughness:0.5,metalness:0.1}));
      pcb.position.y=0.03; pcb.castShadow=true; group.add(pcb);
      const gm = new THREE.MeshStandardMaterial({color:0xccaa44,roughness:0.2,metalness:0.9});
      for (let i=0;i<16;i++) { const c=new THREE.Mesh(new THREE.BoxGeometry(0.015,0.005,0.03),gm); c.position.set(-0.65+i*0.085,-0.025,-0.15); group.add(c); }
      const die = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.25), new THREE.MeshStandardMaterial({color:0x222233,roughness:0.3,metalness:0.4}));
      die.position.set(0.1,0.07,0); group.add(die);
      const vm = new THREE.MeshStandardMaterial({color:0x111122,roughness:0.4,metalness:0.3});
      [[-0.4,0.05,-0.15],[0.6,0.05,-0.15],[-0.4,0.05,0.15],[0.6,0.05,0.15]].forEach(p => { const v=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.02,0.08),vm); v.position.set(p[0],p[1],p[2]); group.add(v); });
      const hs = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.18,0.4), new THREE.MeshStandardMaterial({color:0x666677,roughness:0.15,metalness:0.75}));
      hs.position.set(0.1,0.16,0); hs.castShadow=true; group.add(hs);
      const fm = new THREE.MeshStandardMaterial({color:0x777788,roughness:0.15,metalness:0.8});
      for (let i=-5;i<=5;i++) { const f=new THREE.Mesh(new THREE.BoxGeometry(0.01,0.15,0.35),fm); f.position.set(i*0.11,0.235,0); group.add(f); }
      const fanG = new THREE.Group();
      const ff = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.03,12), new THREE.MeshStandardMaterial({color:0x222233,roughness:0.4,metalness:0.1}));
      ff.rotation.x=Math.PI/2; ff.position.y=0.3; fanG.add(ff);
      const bm = new THREE.MeshStandardMaterial({color:0x444455,roughness:0.3,metalness:0.2});
      for (let i=0;i<7;i++) { const a=i/7*Math.PI*2; const b=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.005,0.025),bm); b.position.set(Math.cos(a)*0.08,0.3,Math.sin(a)*0.08); b.rotation.y=a; fanG.add(b); }
      fanG.position.set(0.1,0,0); group.add(fanG);
      break;
    }
    case 'storage': {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.45,0.02,0.12), new THREE.MeshStandardMaterial({color:0x0a3a0a,roughness:0.5,metalness:0.1}));
      p.position.y=0.01; group.add(p);
      const ct = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.03,0.07), new THREE.MeshStandardMaterial({color:0x111122,roughness:0.4,metalness:0.3}));
      ct.position.set(0.08,0.025,0); group.add(ct);
      const nm = new THREE.MeshStandardMaterial({color:0x111122,roughness:0.4,metalness:0.3});
      for (let i=0;i<2;i++) { const n=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.02,0.06),nm); n.position.set(-0.08-i*0.12,0.02,0); group.add(n); }
      const lb = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.003,0.05), new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.6}));
      lb.position.set(-0.05,0.025,0.04); group.add(lb);
      const gm = new THREE.MeshStandardMaterial({color:0xccaa44,roughness:0.2,metalness:0.9});
      for (let i=0;i<3;i++) { const e=new THREE.Mesh(new THREE.BoxGeometry(0.01,0.01,0.08),gm); e.position.set(0.2+i*0.04,0.005,0); group.add(e); }
      break;
    }
    case 'memory': {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.02,0.08), new THREE.MeshStandardMaterial({color:0x0a3a0a,roughness:0.5,metalness:0.1}));
      p.position.y=0.01; group.add(p);
      const im = new THREE.MeshStandardMaterial({color:0x111122,roughness:0.4,metalness:0.3});
      for (let i=0;i<4;i++) { const ic=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.03,0.04),im); ic.position.set(-0.1+i*0.07,0.025,0); group.add(ic); }
      const hs = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.02,0.09), new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:0.2,metalness:0.7}));
      hs.position.y=0.035; group.add(hs);
      const gm = new THREE.MeshStandardMaterial({color:0xccaa44,roughness:0.2,metalness:0.9});
      for (let i=0;i<5;i++) { const pn=new THREE.Mesh(new THREE.BoxGeometry(0.005,0.015,0.005),gm); pn.position.set(-0.12+i*0.06,-0.005,0); group.add(pn); }
      break;
    }
    case 'powerSupply': {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.35,0.55), new THREE.MeshStandardMaterial({color:0x1a1a2a,roughness:0.3,metalness:0.5}));
      p.position.y=0.175; p.castShadow=true; group.add(p);
      const fn = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.015,12), new THREE.MeshStandardMaterial({color:0x222233,roughness:0.4,metalness:0.1}));
      fn.rotation.x=Math.PI/2; fn.position.set(0,0.36,0); group.add(fn);
      const bm = new THREE.MeshStandardMaterial({color:0x444455,roughness:0.3,metalness:0.2});
      for (let i=0;i<5;i++) { const a=i/5*Math.PI*2; const b=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.003,0.02),bm); b.position.set(Math.cos(a)*0.08,0.365,Math.sin(a)*0.08); b.rotation.y=a; group.add(b); }
      const gm = new THREE.MeshStandardMaterial({color:0x333344,roughness:0.4,metalness:0.2});
      for (let i=-3;i<=3;i++) { const gr=new THREE.Mesh(new THREE.BoxGeometry(0.003,0.003,0.2),gm); gr.position.set(i*0.04,0.37,0); group.add(gr); }
      const pm = new THREE.MeshStandardMaterial({color:0x444455,roughness:0.3,metalness:0.3});
      for (let i=0;i<3;i++) { const po=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.04,0.04),pm); po.position.set(-0.2+i*0.15,0.03,0.28); group.add(po); }
      break;
    }
  }
}

function placePart(type) {
  // Remove old part if exists
  if (placedParts[type]) { caseGroup.remove(placedParts[type]); }
  
  const pos = SLOT_POS[type];
  if (!pos) return;
  
  const group = new THREE.Group();
  buildPart3D(type, group);
  group.position.set(pos[0], pos[1], pos[2]);
  group.userData.isPart = true;
  group.userData.partType = type;
  
  // Highlight on place
  group.traverse(c => { if (c.isMesh) c.userData.origEmissive = c.material.emissiveIntensity || 0; });
  
  caseGroup.add(group);
  placedParts[type] = group;
  
  // Flash effect
  let flash = 0;
  function doFlash() {
    flash++;
    const bright = flash % 2 === 0 ? 0.6 : 0;
    group.traverse(c => {
      if (c.isMesh && c.material) {
        c.material.emissiveIntensity = bright;
        c.material.needsUpdate = true;
      }
    });
    if (flash < 6) setTimeout(doFlash, 100);
    else {
      group.traverse(c => {
        if (c.isMesh && c.material) c.material.emissiveIntensity = c.userData.origEmissive || 0;
      });
    }
  }
  doFlash();
  
  updateBuildList();
  document.getElementById('placement-info').textContent = type.toUpperCase() + ' placed!';
  document.getElementById('placement-info').style.color = '#4ade80';
  setTimeout(() => {
    document.getElementById('placement-info').style.color = '#666';
    document.getElementById('placement-info').textContent = 'Click case to open/close. Orbit to inspect.';
  }, 2000);
}

// ============ UI ============
function buildTabs() {
  const el = document.getElementById('comp-tabs');
  if (!el) return;
  el.innerHTML = '';
  Object.keys(compData).forEach(type => {
    if (type === 'case') return;
    const btn = document.createElement('button');
    btn.className = 'comp-tab' + (type === current3DType ? ' active' : '');
    btn.textContent = catLabels[type] || type;
    btn.onclick = () => { current3DType = type; buildOptions(type); };
    el.appendChild(btn);
  });
}

function buildOptions(type) {
  const el = document.getElementById('comp-options');
  if (!el) return;
  const data = compData[type];
  if (!data) return;
  el.innerHTML = '';
  data.forEach(item => {
    const opt = document.createElement('div');
    opt.className = 'comp-option' + (selected[type] && selected[type].id === item.id ? ' selected' : '');
    opt.dataset.id = item.id;
    opt.innerHTML = '<div class="thumb">' + item.icon + '</div><div class="info"><div class="name">' + item.name + '</div><div class="spec">' + item.spec + '</div></div><div class="price">$' + item.price + '</div>';
    opt.onclick = () => {
      selected[type] = item;
      document.querySelectorAll('.comp-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      placePart(type);
    };
    el.appendChild(opt);
  });
}

function updateBuildList() {
  const el = document.getElementById('build-list');
  if (!el) return;
  let html = ''; let total = 0;
  Object.keys(selected).forEach(k => {
    const c = selected[k];
    if (c) {
      html += '<div class="build-item"><span>' + (catLabels[k]||k) + ': ' + c.name + '</span><span>$' + c.price + '</span></div>';
      total += c.price;
    }
  });
  if (!html) html = '<p style="color:#666;font-size:.8rem">Click a part in the sidebar to add it to the case.</p>';
  el.innerHTML = html;
  document.getElementById('build-total-price').textContent = '$' + total.toLocaleString();
}

function clearPlacedParts() {
  Object.keys(placedParts).forEach(k => {
    if (placedParts[k]) { caseGroup.remove(placedParts[k]); delete placedParts[k]; }
  });
  Object.keys(selected).forEach(k => { if (k !== 'case') selected[k] = null; });
  buildSlots(); // re-create all slots
  updateBuildList();
  buildTabs();
  buildOptions(current3DType);
  document.getElementById('placement-info').textContent = 'All parts cleared — click a component to add it';
}

function resetCamera() {
  camera.position.set(3.5, 3, 4.5);
  controls.target.set(0, 0.8, 0);
  controls.update();
}

function toggleAutoRotate() { autoRotate = !autoRotate; }

function animate() {
  requestAnimationFrame(animate);
  if (controls) { controls.autoRotate = autoRotate; controls.update(); }
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onResize() {
  const c = document.getElementById('three-container');
  if (!c || !renderer || !camera) return;
  const w = c.clientWidth, h = c.clientHeight;
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h);
}
