/* ============================================================
   ARAYE — production controller
   Motion (reveals, curve draw, condensing header) ·
   Configurator (state, spec card, mailto) ·
   3D vitrine (Three.js r149, lazy init, full teardown)
   ============================================================ */
(function () {
  'use strict';

  // Prevent mobile browsers from jumping to anchors on load
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  // Enable scroll-reveal styles + smooth scroll only after JS is confirmed running,
  // so a no-JS or script-error page never leaves .reveal content invisible.
  document.documentElement.classList.add('js-loaded');

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =============== Motion =============== */
  (function motion() {
    function showAll() {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      document.querySelectorAll('.curve-path').forEach(function (el) { el.classList.add('in'); });
    }
    if (REDUCE || !('IntersectionObserver' in window)) { showAll(); }
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io2.unobserve(en.target); } });
      }, { threshold: 0.4 });
      document.querySelectorAll('.curve-path').forEach(function (el) { io2.observe(el); });
    }
    var header = document.getElementById('site-header');
    var sentinel = document.getElementById('nav-sentinel');
    if (header && sentinel && 'IntersectionObserver' in window) {
      var io4 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { header.classList.toggle('scrolled', !en.isIntersecting); });
      }, { threshold: 0 });
      io4.observe(sentinel);
    }
  })();

  /* =============== Invitation form -> mailto =============== */
  (function form() {
    var btn = document.getElementById('invitation-send');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      var name = (document.getElementById('f-name') || {}).value || '';
      var occasion = (document.getElementById('f-occasion') || {}).value || '';
      var contact = (document.getElementById('f-contact') || {}).value || '';
      if (!name && !occasion && !contact) return;
      e.preventDefault();
      var body = 'Hello ARAYE,%0D%0A%0D%0AName: ' + encodeURIComponent(name)
        + '%0D%0AOccasion: ' + encodeURIComponent(occasion)
        + '%0D%0APreferred contact: ' + encodeURIComponent(contact) + '%0D%0A';
      window.location.href = 'mailto:[YOUR EMAIL]?subject='
        + encodeURIComponent('Private consultation - ARAYE') + '&body=' + body;
    });
  })();

  /* =============== Configurator =============== */
  var state = { piece: 'Ring', metal: 'Yellow gold 18K', shape: 'Round', carat: '1.00 ct', colour: 'F–G', clarity: 'VS' };
  var shapeNames = { Round: 'round brilliant', Oval: 'oval', Pear: 'pear', Emerald: 'emerald-cut', Marquise: 'marquise', Cushion: 'cushion' };
  var groups = {
    piece: ['Ring', 'Earrings', 'Necklace', 'Bracelet'],
    metal: [
      { label: 'Yellow gold 18K', swatch: '#D4AF6A' },
      { label: 'White gold 18K', swatch: '#D2D6DA' },
      { label: 'Rose gold 18K', swatch: '#D9A38F' }
    ],
    carat: ['0.50 ct', '0.75 ct', '1.00 ct', '1.50 ct', '2.00 ct', '3.00 ct +'],
    colour: [
      { label: 'D–E', desc: 'exceptional white' },
      { label: 'F–G', desc: 'rare white' },
      { label: 'H–I', desc: 'fine white' }
    ],
    clarity: [
      { label: 'VVS', desc: 'loupe-clean' },
      { label: 'VS', desc: 'eye-clean' },
      { label: 'SI', desc: 'character within' }
    ]
  };
  var SELECTED = 'box-shadow: inset 0 0 0 1px #1D1C1C; border-color: #1D1C1C; background-color: #F7F6F4';

  function makeButton(key, item) {
    var label = item.label || item;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'optbtn';
    b.dataset.key = key;
    b.dataset.value = label;
    if (item.swatch) {
      var sw = document.createElement('span');
      sw.setAttribute('aria-hidden', 'true');
      sw.style.cssText = 'display: inline-block; width: 18px; height: 18px; border-radius: 50%; background: '
        + item.swatch + '; border: 1px solid rgba(0,0,0,.14)';
      b.appendChild(sw);
    }
    var lab = document.createElement('span');
    lab.textContent = label;
    b.appendChild(lab);
    if (item.desc) {
      var d = document.createElement('span');
      d.className = 'optdesc';
      d.textContent = item.desc;
      b.appendChild(d);
    }
    b.addEventListener('click', function () { state[key] = label; syncUI(); sync3d(); });
    return b;
  }

  Object.keys(groups).forEach(function (key) {
    var mount = document.getElementById('opt-' + key + 's'); // opt-pieces, opt-metals, ...
    if (!mount) return;
    groups[key].forEach(function (item) { mount.appendChild(makeButton(key, item)); });
  });
  document.querySelectorAll('[data-key="shape"]').forEach(function (b) {
    b.addEventListener('click', function () { state.shape = b.dataset.value; syncUI(); sync3d(); });
  });

  function syncUI() {
    document.querySelectorAll('[data-key]').forEach(function (b) {
      var sel = state[b.dataset.key] === b.dataset.value;
      b.setAttribute('aria-pressed', sel ? 'true' : 'false');
      b.style.cssText = sel ? SELECTED : '';
    });
    var s1 = document.getElementById('sum1');
    var s2 = document.getElementById('sum2');
    var s3 = document.getElementById('sum3');
    if (s1) s1.textContent = state.carat + ' ' + shapeNames[state.shape] + ' diamond';
    if (s2) s2.textContent = state.colour + ' colour, ' + state.clarity + ' clarity';
    if (s3) s3.textContent = state.metal.toLowerCase() + ' ' + state.piece.toLowerCase();
    var link = document.getElementById('mailtoLink');
    if (link) {
      var body = 'Hello ARAYE,%0D%0A%0D%0AI would like to begin a request:%0D%0A'
        + '- Piece: ' + encodeURIComponent(state.piece) + '%0D%0A'
        + '- Metal: ' + encodeURIComponent(state.metal) + '%0D%0A'
        + '- Diamond: ' + encodeURIComponent(state.carat + ' ' + shapeNames[state.shape]) + '%0D%0A'
        + '- Colour: ' + encodeURIComponent(state.colour) + '%0D%0A'
        + '- Clarity: ' + encodeURIComponent(state.clarity) + '%0D%0A%0D%0A'
        + 'My story, occasion and ideas:%0D%0A%0D%0A';
      link.href = 'mailto:[YOUR EMAIL]?subject='
        + encodeURIComponent('ARAYE request - ' + state.piece) + '&body=' + body;
    }
  }
  syncUI();

  /* =============== 3D vitrine =============== */
  var T = { gemGeo: null, disposables: [], inited: false, applied: null, dragging: false };
  var canvas = document.getElementById('gem-canvas');

  function studioEnv(kind) {
    // 2048x1024 studio HDRI (procedural): soft key/fill/rim softboxes, edge
    // streaks and a field of pinpoint sources — pinpoints are what make a
    // faceted stone sparkle as it turns.
    var W = 2048, H = 1024;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    function soft(x, y, rx, ry, col, a) {
      c.save();
      c.translate(x, y); c.scale(rx, ry);
      var g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = a; c.globalCompositeOperation = 'lighter';
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
      c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    function streak(x, y, w, h, col, a) {
      var g = c.createLinearGradient(x - w / 2, y, x + w / 2, y);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = a; c.globalCompositeOperation = 'lighter';
      c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    function pinpoints(n, ymax, warmEvery) {
      for (var i = 0; i < n; i++) {
        var x = ((i * 887 + 131) % W), y = 30 + ((i * 421 + 67) % ymax);
        var s = 1.5 + (i % 4) * 1.2;
        soft(x, y, s * 3.2, s * 3.2, i % warmEvery === 0 ? '#ffe6bd' : '#ffffff', 0.85);
      }
    }
    if (kind === 'metal') {
      // warm silk tent: broad soft sources, liquid gold reflections
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#f0e4c8'); g.addColorStop(0.34, '#9a835c');
      g.addColorStop(0.62, '#382b17'); g.addColorStop(1, '#0d0803');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      soft(W * 0.22, H * 0.16, 420, 150, '#ffffff', 0.8);
      soft(W * 0.55, H * 0.10, 300, 190, '#fffdf4', 0.75);
      soft(W * 0.82, H * 0.20, 340, 130, '#ffe9bd', 0.7);
      soft(W * 0.50, H * 0.44, 900, 60, '#fff0d2', 0.4);
      c.globalAlpha = 0.75; c.globalCompositeOperation = 'source-over';
      var gd = c.createLinearGradient(0, H * 0.62, 0, H);
      gd.addColorStop(0, '#241a0c'); gd.addColorStop(1, '#050302');
      c.fillStyle = gd; c.fillRect(0, H * 0.62, W, H * 0.38); c.globalAlpha = 1;
      soft(W * 0.30, H * 0.60, 260, 18, '#ffdf9e', 0.6);
      soft(W * 0.72, H * 0.60, 300, 16, '#fff3dc', 0.55);
      pinpoints(10, 300, 4);
    } else {
      // diamond box: near-black studio, hard overhead panels, pinpoint stars
      var g2 = c.createLinearGradient(0, 0, 0, H);
      g2.addColorStop(0, '#191c22'); g2.addColorStop(0.48, '#0a0b0e'); g2.addColorStop(1, '#020203');
      c.fillStyle = g2; c.fillRect(0, 0, W, H);
      soft(W * 0.30, H * 0.13, 470, 130, '#ffffff', 0.98);   // key softbox
      soft(W * 0.68, H * 0.10, 260, 150, '#eef4ff', 0.9);    // cool fill
      soft(W * 0.50, H * 0.30, 340, 90, '#ffffff', 0.75);
      soft(W * 0.88, H * 0.24, 220, 110, '#fff1d6', 0.8);    // warm rim
      streak(W * 0.055, H * 0.28, 10, 300, '#dfe8ff', 0.85); // anamorphic edges
      streak(W * 0.945, H * 0.30, 10, 260, '#ffe9c8', 0.8);
      soft(W * 0.50, H * 0.56, 1050, 46, '#454b55', 0.5);    // table sheen
      pinpoints(64, 430, 6);
    }
    var tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }
  function roughNoise() {
    // subtle polish micro-scratches: drives metal roughnessMap
    var s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
    var c = cv.getContext('2d');
    var im = c.createImageData(s, s);
    for (var i = 0; i < im.data.length; i += 4) {
      var v = 30 + Math.random() * 22;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    c.putImageData(im, 0, 0);
    var big = document.createElement('canvas'); big.width = big.height = 256;
    var bc = big.getContext('2d'); bc.imageSmoothingEnabled = true;
    bc.drawImage(cv, 0, 0, 256, 256);
    var tex = new THREE.CanvasTexture(big);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  /* Round-brilliant topology, mapped onto each fancy outline. Every crown and
     pavilion facet is a planar polygon by construction (cone-profile rings,
     verified): table + 8 stars + 16 bezels + 16-facet girdle + zigzag pavilion
     (8 mains / 16 lower-girdles) + point culet. Emerald/Cushion use the same
     brilliant map on a rounded-rect outline (reads as radiant-style). */
  function gemGeometry(shape) {
    var conf = {
      Round:    { out: function (t) { return 1; }, sx: 1, sz: 1 },
      Oval:     { out: function (t) { return 1; }, sx: 0.78, sz: 1.16 },
      Pear:     { out: function (t) { var s = Math.max(0, Math.sin(t)); return 1 - 0.62 * Math.pow(s, 1.35) + 0.62 * Math.pow(s, 6); }, sx: 1, sz: 1.18 },
      Marquise: { out: function (t) { var x = Math.cos(t) / 0.72, z = Math.sin(t); return Math.pow(Math.pow(Math.abs(x), 1.5) + Math.pow(Math.abs(z), 1.5), -1 / 1.5); }, sx: 1, sz: 1.34 },
      Cushion:  { out: function (t) { var x = Math.cos(t), z = Math.sin(t); return 0.98 * Math.pow(Math.pow(Math.abs(x), 3.2) + Math.pow(Math.abs(z), 3.2), -1 / 3.2); }, sx: 1, sz: 1 },
      Emerald:  { out: function (t) { var x = Math.cos(t), z = Math.sin(t); return Math.pow(Math.pow(Math.abs(x), 6) + Math.pow(Math.abs(z), 6), -1 / 6); }, sx: 1.32, sz: 0.84 }
    }[shape] || { out: function () { return 1; }, sx: 1, sz: 1 };

    var TABLE_R = 0.58, CROWN_H = 0.30, STAR_R = 0.79;
    var GIR_TOP = 0.0, GIR_BOT = -0.03, PAV_Y = -0.875;
    var crownY = function (r) { return CROWN_H * (1 - r) / (1 - TABLE_R); };
    var pavY = function (r) { return GIR_BOT + (PAV_Y - GIR_BOT) * (1 - r); };
    function pt(angDeg, rho, y) {
      var t = angDeg * Math.PI / 180, o = conf.out(t), r = rho * o;
      return [r * Math.cos(t) * conf.sx, y, r * Math.sin(t) * conf.sz];
    }

    var pos = [], nrm = [];
    function facet(tag, verts) {
      var nx = 0, ny = 0, nz = 0, i, a, b;
      for (i = 0; i < verts.length; i++) {
        a = verts[i]; b = verts[(i + 1) % verts.length];
        nx += (a[1] - b[1]) * (a[2] + b[2]);
        ny += (a[2] - b[2]) * (a[0] + b[0]);
        nz += (a[0] - b[0]) * (a[1] + b[1]);
      }
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      var cx = 0, cy = 0, cz = 0;
      for (i = 0; i < verts.length; i++) { cx += verts[i][0]; cy += verts[i][1]; cz += verts[i][2]; }
      cx /= verts.length; cy /= verts.length; cz /= verts.length;
      var radial = Math.sqrt(cx * cx + cz * cz), flip;
      if (radial > 0.03) flip = (nx * cx + nz * cz) < 0;
      else flip = (tag === 'table' ? ny < 0 : ny > 0);
      if (flip) { nx = -nx; ny = -ny; nz = -nz; verts = verts.slice().reverse(); }
      for (var k = 1; k < verts.length - 1; k++) {
        var tri = [verts[0], verts[k], verts[k + 1]];
        for (i = 0; i < 3; i++) { pos.push(tri[i][0], tri[i][1], tri[i][2]); nrm.push(nx, ny, nz); }
      }
    }

    var Tb = [], S = [], M = [], Hh = [], i2;
    for (i2 = 0; i2 < 8; i2++) {
      Tb.push(pt(22.5 + 45 * i2, TABLE_R, CROWN_H));      // table octagon vertex
      S.push(pt(45 * i2, STAR_R, crownY(STAR_R)));        // star apex
      M.push(pt(45 * i2, 1, GIR_TOP));                    // girdle main
      Hh.push(pt(22.5 + 45 * i2, 1, GIR_TOP));            // girdle half
    }
    var GT16 = [], GB16 = [], Q16 = [];
    for (i2 = 0; i2 < 16; i2++) {
      GT16.push(pt(22.5 * i2, 1, GIR_TOP));
      GB16.push(pt(22.5 * i2, 1, GIR_BOT));
      var rq = (i2 % 2 === 0) ? 0.55 : 0.45;              // pavilion zigzag: mains deep, LGs shallow
      Q16.push(pt(22.5 * i2, rq, pavY(rq)));
    }
    var TC = [0, CROWN_H, 0], CUL = [0, PAV_Y, 0];

    for (i2 = 0; i2 < 8; i2++) {
      var k1 = (i2 + 1) % 8;
      facet('table', [TC, Tb[i2], Tb[k1]]);
      facet('crown', [Tb[i2], Tb[k1], S[k1]]);                     // star
      facet('crown', [Tb[i2], S[k1], M[k1], Hh[i2]]);              // bezel (right)
      facet('crown', [Tb[i2], Hh[i2], M[i2], S[i2]]);              // bezel (left)
    }
    for (i2 = 0; i2 < 16; i2++) {
      var j1 = (i2 + 1) % 16;
      facet('girdle', [GT16[i2], GT16[j1], GB16[j1], GB16[i2]]);
      facet('pav', [GB16[i2], GB16[j1], Q16[j1], Q16[i2]]);        // mains + lower-girdles
      facet('pav', [Q16[i2], Q16[j1], CUL]);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geo.computeBoundingSphere();
    return geo;
  }
  function buildStone() {
    if (T.gemGeo) { try { T.gemGeo.dispose(); } catch (e) {} }
    var geo = gemGeometry(state.shape);
    T.gemGeo = geo;
    var turned = (state.shape === 'Oval' || state.shape === 'Pear' || state.shape === 'Marquise' || state.shape === 'Emerald');
    var ms = { Round: [1, 1], Oval: [0.78, 1.16], Pear: [1, 1.18], Emerald: [1.32, 0.84], Marquise: [1, 1.34], Cushion: [1, 1] }[state.shape] || [1, 1];
    T.units.forEach(function (u) {
      while (u.stone.children.length) u.stone.remove(u.stone.children[0]);
      var m = new THREE.Mesh(geo, T.gemMat);
      m.onBeforeRender = function (renderer, scene, camera) { updateGemUniforms(m, camera); };
      u.stone.add(m);
      u.stone.scale.set(1, 1, 1);
      u.stone.rotation.y = turned ? Math.PI / 2 : 0;
      u.mount.scale.set(ms[0], 1, ms[1]);
      u.mount.rotation.y = u.stone.rotation.y;
    });
  }
  function updateGemUniforms(mesh, camera) {
    var u = T.gemMat.uniforms;
    var v = T.tmpV || (T.tmpV = new THREE.Vector3());
    v.copy(camera.position);
    mesh.worldToLocal(v);
    u.uCam.value.copy(v);
    var e = mesh.matrixWorld.elements, m = u.uRot.value.elements;
    for (var col = 0; col < 3; col++) {
      var x = e[col * 4], y = e[col * 4 + 1], z = e[col * 4 + 2];
      var l = Math.sqrt(x * x + y * y + z * z) || 1;
      m[col * 3] = x / l; m[col * 3 + 1] = y / l; m[col * 3 + 2] = z / l;
    }
  }

  function hideGemFallback() {
    if (!canvas || !canvas.parentElement) return;
    var img = canvas.parentElement.querySelector('img[aria-hidden="true"]');
    if (img) img.style.display = 'none';
  }

  function init3d() {
    if (T.inited || !canvas || typeof THREE === 'undefined') return;
    T.inited = true;
    hideGemFallback();
    var disposables = T.disposables;
    function track(res) { disposables.push(res); return res; }
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    // Linear HDR pipeline: everything renders un-tonemapped into the scene
    // target; the composite pass applies bloom + ACES + sRGB once at the end.
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputEncoding = THREE.LinearEncoding;
    var scene = new THREE.Scene();
    var gemEnv = track(studioEnv('gem')), metalEnv = track(studioEnv('metal'));
    var pmrem = new THREE.PMREMGenerator(renderer);
    var metalIBL = track(pmrem.fromEquirectangular(metalEnv).texture);
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 1.55, 9.0);
    camera.lookAt(0, -0.2, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6b6e74, 0.3));
    var key = new THREE.DirectionalLight(0xffffff, 0.5); key.position.set(3, 6, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0xfff2da, 0.28); rim.position.set(-5, 2, -4); scene.add(rim);

    /* Diamond: per-facet flat normals; each fragment refracts into the stone
       (IOR 2.417), totally-internally reflects off the analytic pavilion cone
       (up to 2 bounces), exits through the table plane — three IOR samples per
       fragment split the spectrum, which is the "fire". Fresnel adds the
       surface reflection; env holds the pinpoint sources that scintillate. */
    T.gemMat = track(new THREE.ShaderMaterial({
      uniforms: {
        uEnv: { value: gemEnv },
        uCam: { value: new THREE.Vector3() },
        uRot: { value: new THREE.Matrix3() },
        uDirect: { value: 0 }
      },
      vertexShader: [
        'varying vec3 vPos;', 'varying vec3 vNrm;',
        'void main() {',
        '  vPos = position;', '  vNrm = normal;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uEnv;', 'uniform vec3 uCam;', 'uniform mat3 uRot;', 'uniform float uDirect;',
        'varying vec3 vPos;', 'varying vec3 vNrm;',
        'const float F0 = 0.172;',
        'const float PAV_M = 1.183;',   // pavilion cone slope (radius per unit y)
        'const float PAV_Y0 = -0.875;', // pavilion cone apex
        'vec3 env(vec3 d) {',
        '  vec3 w = normalize(uRot * d);',
        '  float u = atan(w.z, w.x) / 6.2831853 + 0.5;',
        '  float v = acos(clamp(w.y, -1.0, 1.0)) / 3.14159265;',
        '  return pow(texture2D(uEnv, vec2(u, v)).rgb, vec3(2.2)) * 2.4;',
        '}',
        'vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }',
        'vec3 refrPath(vec3 I, vec3 N, float eta) {',
        '  vec3 T = refract(I, N, eta);',
        '  vec3 E = vPos + T * 0.002;',
        '  float m2 = PAV_M * PAV_M;',
        '  for (int i = 0; i < 2; i++) {',
        '    float a = dot(T.xz, T.xz) - m2 * T.y * T.y;',
        '    float b = 2.0 * (dot(E.xz, T.xz) - m2 * T.y * (E.y - PAV_Y0));',
        '    float cc = dot(E.xz, E.xz) - m2 * (E.y - PAV_Y0) * (E.y - PAV_Y0);',
        '    float disc = b * b - 4.0 * a * cc;',
        '    if (disc <= 0.0 || abs(a) < 1e-6) break;',
        '    float sq = sqrt(disc);',
        '    float t = (-b - sq) / (2.0 * a);',
        '    if (t <= 0.002) t = (-b + sq) / (2.0 * a);',
        '    if (t <= 0.002) break;',
        '    vec3 H = E + T * t;',
        '    if (H.y > 0.05) break;',
        '    vec3 gn = normalize(vec3(H.x, -m2 * (H.y - PAV_Y0), H.z));',
        '    if (dot(gn, T) > 0.0) gn = -gn;',
        '    T = reflect(T, gn);',   // diamond pavilion angles exceed the critical angle: TIR
        '    E = H + T * 0.002;',
        '  }',
        '  vec3 outR = refract(T, vec3(0.0, 1.0, 0.0), 1.0 / eta);',
        '  if (dot(outR, outR) < 0.5) outR = reflect(T, vec3(0.0, -1.0, 0.0));',
        '  return outR;',
        '}',
        'void main() {',
        '  vec3 N = normalize(vNrm);',
        '  vec3 V = normalize(uCam - vPos);',
        '  vec3 I = -V;',
        '  float cosI = clamp(dot(N, V), 0.0, 1.0);',
        '  float F = F0 + (1.0 - F0) * pow(1.0 - cosI, 5.0);',
        '  vec3 refl = env(reflect(I, N));',
        '  vec3 refr;',
        '  refr.r = env(refrPath(I, N, 1.0 / 2.395)).r;',   // dispersion: per-channel IOR
        '  refr.g = env(refrPath(I, N, 1.0 / 2.417)).g;',
        '  refr.b = env(refrPath(I, N, 1.0 / 2.445)).b;',
        '  vec3 col = mix(refr, refl, F) * 1.15;',
        '  vec3 L = normalize(vec3(0.45, 0.75, 0.5));',     // virtual key light glint
        '  col += pow(max(dot(normalize(uRot * reflect(I, N)), L), 0.0), 240.0) * 2.2 * vec3(1.0, 0.97, 0.9);',
        '  if (uDirect > 0.5) col = pow(aces(col), vec3(1.0 / 2.2));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    }));
    T.metalMat = track(new THREE.MeshStandardMaterial({
      color: 0xcf9a3a, metalness: 1, roughness: 1,
      roughnessMap: track(roughNoise()),
      envMapIntensity: 0.75, envMap: metalIBL
    }));

    var root = new THREE.Group(); scene.add(root);
    var carat = new THREE.Group(); root.add(carat);
    var up = new THREE.Vector3(0, 1, 0);
    function makeUnit() {
      var u = { grp: new THREE.Group(), mount: new THREE.Group(), stone: new THREE.Group() };
      u.grp.add(u.mount); u.grp.add(u.stone);
      var girdle = new THREE.Mesh(track(new THREE.TorusGeometry(1.06, 0.04, 12, 64)), T.metalMat);
      girdle.rotation.x = Math.PI / 2; girdle.position.y = 0.02; u.mount.add(girdle);
      var basket = new THREE.Mesh(track(new THREE.TorusGeometry(0.52, 0.05, 12, 48)), T.metalMat);
      basket.rotation.x = Math.PI / 2; basket.position.y = -0.55; u.mount.add(basket);
      for (var i = 0; i < 4; i++) {
        var a = Math.PI / 4 + i * Math.PI / 2;
        var base = new THREE.Vector3(Math.cos(a) * 0.62, -0.56, Math.sin(a) * 0.62);
        var tip = new THREE.Vector3(Math.cos(a) * 1.07, 0.3, Math.sin(a) * 1.07);
        var dir = tip.clone().sub(base), len = dir.length();
        var prong = new THREE.Mesh(track(new THREE.CylinderGeometry(0.038, 0.06, len, 10)), T.metalMat);
        prong.position.copy(base).addScaledVector(dir, 0.5);
        prong.quaternion.setFromUnitVectors(up, dir.normalize());
        u.mount.add(prong);
        var bead = new THREE.Mesh(track(new THREE.SphereGeometry(0.05, 10, 8)), T.metalMat);
        bead.position.set(Math.cos(a) * 1.0, 0.32, Math.sin(a) * 1.0);
        u.mount.add(bead);
      }
      u.post = new THREE.Group(); // earring post (hidden unless earrings)
      var stem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 10)), T.metalMat);
      stem.rotation.x = Math.PI / 2; stem.position.set(0, -0.1, -0.75); u.post.add(stem);
      var back = new THREE.Mesh(track(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 18)), T.metalMat);
      back.rotation.x = Math.PI / 2; back.position.set(0, -0.1, -1.2); u.post.add(back);
      u.grp.add(u.post);
      u.bail = new THREE.Mesh(track(new THREE.TorusGeometry(0.2, 0.05, 10, 32)), T.metalMat); // pendant bail
      u.bail.position.y = 0.72; u.grp.add(u.bail);
      return u;
    }
    T.units = [makeUnit(), makeUnit()];
    var piece = new THREE.Group(); carat.add(piece);
    T.units.forEach(function (u) { piece.add(u.grp); });
    var band = new THREE.Mesh(track(new THREE.TorusGeometry(1.42, 0.125, 32, 96)), T.metalMat);
    band.scale.set(1, 1, 0.9); band.position.y = -1.95; piece.add(band);
    var pts = [[-3.3, 2.7], [-2.5, 1.7], [-1.6, 0.95], [-0.8, 0.5], [-0.26, 0.33], [0, 0.3], [0.26, 0.33], [0.8, 0.5], [1.6, 0.95], [2.5, 1.7], [3.3, 2.7]]
      .map(function (p) { return new THREE.Vector3(p[0], p[1], 0); });
    var chain = new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.035, 8)), T.metalMat);
    piece.add(chain);
    var bangle = new THREE.Group();
    var hoop = new THREE.Mesh(track(new THREE.TorusGeometry(1.9, 0.15, 28, 110)), T.metalMat);
    hoop.scale.set(1, 0.92, 1); bangle.add(hoop);
    bangle.rotation.x = -1.02; bangle.position.y = -0.62; piece.add(bangle);
    T.band = band; T.chain = chain; T.bangle = bangle;
    var sh = document.createElement('canvas'); sh.width = sh.height = 128;
    var sc = sh.getContext('2d');
    var sg = sc.createRadialGradient(64, 64, 4, 64, 64, 62);
    sg.addColorStop(0, 'rgba(20,18,16,0.42)'); sg.addColorStop(0.6, 'rgba(20,18,16,0.16)'); sg.addColorStop(1, 'rgba(20,18,16,0)');
    sc.fillStyle = sg; sc.fillRect(0, 0, 128, 128);
    var shadowTex = track(new THREE.CanvasTexture(sh));
    var shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(5.6, 5.6)),
      track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; root.add(shadow);
    T.root = root; T.shadow = shadow; T.pmrem = pmrem;
    T.renderer = renderer; T.scene = scene; T.camera = camera;

    /* Post pipeline: scene → HDR target (MSAA x4 + half-float when supported),
       bright-pass, two separable gaussian iterations at half res, composite
       (bloom + ACES + vignette + sRGB). Falls back to direct rendering. */
    var POST_VS = 'precision highp float;\nattribute vec3 position;\nvarying vec2 vUv;\nvoid main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    var BRIGHT_FS = 'precision highp float;\nuniform sampler2D tSrc;\nvarying vec2 vUv;\nvoid main() {\n  vec3 c = texture2D(tSrc, vUv).rgb;\n  float l = max(c.r, max(c.g, c.b));\n  gl_FragColor = vec4(c * smoothstep(0.85, 1.9, l), 1.0);\n}';
    var BLUR_FS = 'precision highp float;\nuniform sampler2D tSrc;\nuniform vec2 uDir;\nvarying vec2 vUv;\nvoid main() {\n  vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;\n  vec2 o1 = uDir * 1.3846154;\n  vec2 o2 = uDir * 3.2307692;\n  c += (texture2D(tSrc, vUv + o1).rgb + texture2D(tSrc, vUv - o1).rgb) * 0.3162162;\n  c += (texture2D(tSrc, vUv + o2).rgb + texture2D(tSrc, vUv - o2).rgb) * 0.0702703;\n  gl_FragColor = vec4(c, 1.0);\n}';
    var COMP_FS = 'precision highp float;\nuniform sampler2D tScene;\nuniform sampler2D tBloom;\nvarying vec2 vUv;\nvec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }\nvoid main() {\n  vec4 s = texture2D(tScene, vUv);\n  vec3 b = texture2D(tBloom, vUv).rgb;\n  vec3 col = aces((s.rgb + b * 0.45) * 1.05);\n  vec2 d = vUv - 0.5;\n  col *= 1.0 - 0.20 * smoothstep(0.3, 0.85, dot(d, d) * 2.0);\n  float a = max(s.a, max(b.r, max(b.g, b.b)) * 0.4);\n  gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(1.0 / 2.2)), a);\n}';
    T.post = false;
    try {
      var gl2 = renderer.capabilities.isWebGL2;
      var dbg = gl2 ? renderer.extensions.get('WEBGL_debug_renderer_info') : null;
      var gpuName = dbg ? String(renderer.getContext().getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
      var softGL = /SwiftShader|llvmpipe|Software/i.test(gpuName);
      var halfFloat = gl2 && !softGL && (renderer.extensions.get('EXT_color_buffer_float') || renderer.extensions.get('EXT_color_buffer_half_float'));
      var rtType = halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;
      var pw = Math.max(2, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2))) || 600;
      var ph = Math.max(2, Math.round(canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 2))) || 600;
      T.rtScene = track(new THREE.WebGLRenderTarget(pw, ph, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: rtType, depthBuffer: true, stencilBuffer: false }));
      if (gl2 && !softGL) T.rtScene.samples = 4;
      T.rtA = track(new THREE.WebGLRenderTarget(pw >> 1, ph >> 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: rtType, depthBuffer: false }));
      T.rtB = track(new THREE.WebGLRenderTarget(pw >> 1, ph >> 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: rtType, depthBuffer: false }));
      var pgeo = track(new THREE.BufferGeometry());
      pgeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      T.matBright = track(new THREE.RawShaderMaterial({ uniforms: { tSrc: { value: null } }, vertexShader: POST_VS, fragmentShader: BRIGHT_FS, depthTest: false, depthWrite: false }));
      T.matBlur = track(new THREE.RawShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: POST_VS, fragmentShader: BLUR_FS, depthTest: false, depthWrite: false }));
      T.matComp = track(new THREE.RawShaderMaterial({ uniforms: { tScene: { value: null }, tBloom: { value: null } }, vertexShader: POST_VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false }));
      T.postScene = new THREE.Scene();
      T.postMesh = new THREE.Mesh(pgeo, T.matComp);
      T.postMesh.frustumCulled = false;
      T.postScene.add(T.postMesh);
      T.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      T.post = true;
    } catch (err) {
      // fallback: straight to canvas with built-in tonemapping/encoding
      T.post = false;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputEncoding = THREE.sRGBEncoding;
      T.gemMat.uniforms.uDirect.value = 1;
    }
    sync3d();

    var onPD = function (e) {
      T.dragging = true; canvas.style.cursor = 'grabbing';
      T.px = e.clientX; T.py = e.clientY;
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
    };
    var onPM = function (e) {
      if (!T.dragging) return;
      T.tRy = (T.tRy || 0) + (e.clientX - T.px) * 0.009;
      T.tRx = (T.tRx == null ? 0.12 : T.tRx) + (e.clientY - T.py) * 0.006;
      T.tRx = Math.max(-0.4, Math.min(0.7, T.tRx));
      T.px = e.clientX; T.py = e.clientY;
    };
    var onPU = function (e) {
      T.dragging = false; canvas.style.cursor = 'grab';
      if (e && canvas.releasePointerCapture) { try { canvas.releasePointerCapture(e.pointerId); } catch (err) {} }
    };
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      var fn = { pointerdown: onPD, pointermove: onPM, pointerup: onPU, pointercancel: onPU, pointerleave: onPU }[type];
      var opts = (type === 'pointermove') ? { passive: true } : false;
      canvas.addEventListener(type, fn, opts);
      T.disposables.push({ dispose: function () { canvas.removeEventListener(type, fn, opts); } });
    });
    var fit = function () {
      var w = canvas.clientWidth || 300, h = canvas.clientHeight || 300, dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (T.rtScene) {
        var pw2 = Math.max(2, Math.round(w * dpr)), ph2 = Math.max(2, Math.round(h * dpr));
        T.rtScene.setSize(pw2, ph2);
        T.rtA.setSize(pw2 >> 1, ph2 >> 1);
        T.rtB.setSize(pw2 >> 1, ph2 >> 1);
      }
    };
    fit();
    if (typeof ResizeObserver !== 'undefined') { T.ro = new ResizeObserver(fit); T.ro.observe(canvas); }
    var onVis = function () { T.pageHidden = document.hidden; };
    document.addEventListener('visibilitychange', onVis);
    T.onVis = onVis;
    // don't burn GPU while the vitrine is scrolled out of view
    if ('IntersectionObserver' in window) {
      T.inView = true;
      T.ioV = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { T.inView = en.isIntersecting; });
      }, { threshold: 0 });
      T.ioV.observe(canvas);
      // generous margin: fully skip renderer.render while the canvas is far offscreen
      T.visible = true;
      T.ioVis = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { T.visible = en.isIntersecting; });
      }, { rootMargin: '2000px' });
      T.ioVis.observe(canvas);
    }
    var tick = function () {
      T.raf = requestAnimationFrame(tick);
      if (T.pageHidden) return;
      if (!T.dragging && !REDUCE) T.tRy = (T.tRy || 0) + 0.0038;
      T.ry = (T.ry || 0) + ((T.tRy || 0) - (T.ry || 0)) * 0.08;
      T.rx = (T.rx == null ? 0.12 : T.rx) + ((T.tRx == null ? 0.12 : T.tRx) - (T.rx == null ? 0.12 : T.rx)) * 0.08;
      T.root.rotation.y = T.ry; T.root.rotation.x = T.rx;
      if (T.inView === false || T.visible === false) return;
      if (!T.post) { renderer.render(scene, camera); return; }
      renderer.setRenderTarget(T.rtScene);
      renderer.render(scene, camera);
      var pm = T.postMesh;
      pm.material = T.matBright; T.matBright.uniforms.tSrc.value = T.rtScene.texture;
      renderer.setRenderTarget(T.rtA); renderer.render(T.postScene, T.postCam);
      var bw = T.rtA.width, bh = T.rtA.height;
      for (var i = 0; i < 2; i++) {
        pm.material = T.matBlur;
        T.matBlur.uniforms.tSrc.value = T.rtA.texture; T.matBlur.uniforms.uDir.value.set(1 / bw, 0);
        renderer.setRenderTarget(T.rtB); renderer.render(T.postScene, T.postCam);
        T.matBlur.uniforms.tSrc.value = T.rtB.texture; T.matBlur.uniforms.uDir.value.set(0, 1 / bh);
        renderer.setRenderTarget(T.rtA); renderer.render(T.postScene, T.postCam);
      }
      pm.material = T.matComp;
      T.matComp.uniforms.tScene.value = T.rtScene.texture;
      T.matComp.uniforms.tBloom.value = T.rtA.texture;
      renderer.setRenderTarget(null);
      renderer.render(T.postScene, T.postCam);
    };
    tick();
  }

  function teardown3d() {
    if (!T.inited) return;
    T.inited = false;
    if (T.raf) cancelAnimationFrame(T.raf);
    if (T.ro) T.ro.disconnect();
    if (T.ioV) { T.ioV.disconnect(); T.ioV = null; }
    if (T.ioVis) { T.ioVis.disconnect(); T.ioVis = null; }
    if (T.onVis) { document.removeEventListener('visibilitychange', T.onVis); T.onVis = null; }
    if (T.gemGeo) { try { T.gemGeo.dispose(); } catch (e) {} T.gemGeo = null; }
    T.disposables.forEach(function (d) { try { d.dispose(); } catch (e) {} });
    T.disposables = [];
    if (T.pmrem) { try { T.pmrem.dispose(); } catch (e) {} }
    if (T.renderer) T.renderer.dispose();
    T.renderer = null;
  }
  window.addEventListener('pagehide', teardown3d);

  function apply3d() {
    if (!T.inited) return;
    var hex = { 'Yellow gold 18K': 0xcf9a3a, 'White gold 18K': 0xd6dadd, 'Rose gold 18K': 0xc9875f }[state.metal] || 0xcf9a3a;
    T.metalMat.color.setHex(hex);
    var sc2 = { '0.50 ct': 0.8, '0.75 ct': 0.9, '1.00 ct': 1.0, '1.50 ct': 1.12, '2.00 ct': 1.24, '3.00 ct +': 1.38 }[state.carat] || 1;
    var piece = state.piece;
    var A = T.units[0], B = T.units[1];
    T.band.visible = false; T.chain.visible = false; T.bangle.visible = false;
    A.grp.visible = true; B.grp.visible = false;
    A.post.visible = false; B.post.visible = false; A.bail.visible = false; B.bail.visible = false;
    A.grp.rotation.set(0, 0, 0); B.grp.rotation.set(0, 0, 0);
    if (piece === 'Ring') {
      T.band.visible = true;
      A.grp.position.set(0, 0, 0); A.grp.scale.setScalar(0.74 * sc2);
      T.root.position.y = 1.0;
      T.shadow.position.y = -2.1; T.shadow.scale.set(1, 1, 1);
    } else if (piece === 'Earrings') {
      B.grp.visible = true; A.post.visible = true; B.post.visible = true;
      var es = 0.62 * sc2;
      A.grp.position.set(-1.12, 0.06, 0); A.grp.scale.setScalar(es); A.grp.rotation.z = 0.05;
      B.grp.position.set(1.12, -0.06, 0); B.grp.scale.setScalar(es); B.grp.rotation.z = -0.05;
      T.root.position.y = 0.15;
      T.shadow.position.y = -1.0 * es - 0.2; T.shadow.scale.set(1.15, 1.15, 1);
    } else if (piece === 'Necklace') {
      var ns = 0.56 * sc2;
      A.bail.visible = true;
      A.grp.position.set(0, 0.28 - 0.86 * ns, 0); A.grp.scale.setScalar(ns);
      T.chain.visible = true;
      T.root.position.y = -0.2;
      T.shadow.position.y = A.grp.position.y - 1.15 * ns; T.shadow.scale.set(0.62, 0.62, 1);
    } else { // Bracelet
      T.bangle.visible = true;
      var bs = 0.55 * sc2;
      A.grp.position.set(0, 0.46, 1.04); A.grp.scale.setScalar(bs);
      T.root.position.y = 0.5;
      T.shadow.position.y = -1.42; T.shadow.scale.set(1.2, 1.2, 1);
    }
  }
  function sync3d() {
    if (!T.inited) return;
    var ap = T.applied || {};
    if (state.shape !== ap.shape) buildStone();
    if (state.shape !== ap.shape || state.metal !== ap.metal || state.carat !== ap.carat || state.piece !== ap.piece) apply3d();
    T.applied = { shape: state.shape, metal: state.metal, carat: state.carat, piece: state.piece };
  }

  // Lazy init: only build the GL context when the vitrine approaches the viewport
  if (canvas) {
    if ('IntersectionObserver' in window) {
      var io3d = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { io3d.disconnect(); init3d(); } });
      }, { rootMargin: '500px' });
      io3d.observe(canvas);
    } else {
      init3d();
    }
  }

  /* =============== Bespoke step preview =============== */
  (function stepPreview() {
    var rows = document.querySelectorAll('#bespoke .steprow');
    if (!rows.length) return;
    var imgs = [
      './assets/62fcf51a5af938d09097fef234df9264.jpg', // i. consultation
      './assets/095ceb89323f55673081b1ccaeea85ec.jpg', // ii. design
      './assets/681c3a2e_2x.jpg',                      // iii. stone
      './assets/4abf3bfc068edd0986a8feedaec01787.jpg', // iv. approval
      './assets/51a1bfa060fcfc483869971c1b324090.jpg'  // v. presentation
    ];
    var HOVER = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    var pv = document.createElement('div');
    pv.className = 'step-preview';
    pv.setAttribute('aria-hidden', 'true');
    var pvImg = document.createElement('img');
    pvImg.alt = '';
    pv.appendChild(pvImg);

    var loaded = {};
    function preload(i) {
      if (loaded[i]) return;
      loaded[i] = true;
      var im = new Image();
      im.src = imgs[i];
    }
    function preloadAll() { for (var i = 0; i < imgs.length; i++) preload(i); }
    if ('requestIdleCallback' in window) requestIdleCallback(preloadAll);
    else window.addEventListener('load', preloadAll);

    var current = -1;
    function show(i) {
      preload(i);
      if (current === i) return;
      current = i;
      pvImg.src = imgs[i];
      pv.classList.add('is-in');
    }
    function hide() {
      pv.classList.remove('is-in');
      current = -1;
    }

    if (HOVER && !REDUCE) {
      document.body.appendChild(pv);
      var tx = 0, ty = 0, x = 0, y = 0, raf = null;
      var PW = 232, PH = 300;
      function clamp() {
        tx = Math.max(8, Math.min(window.innerWidth - PW - 8, tx));
        ty = Math.max(8, Math.min(window.innerHeight - PH - 8, ty));
      }
      function tick() {
        raf = null;
        if (current === -1 || !pv.classList.contains('is-in')) return; // never run while hidden
        x += (tx - x) * 0.22;
        y += (ty - y) * 0.22;
        pv.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick);
      }
      function schedule() {
        if (raf || current === -1 || !pv.classList.contains('is-in')) return;
        raf = requestAnimationFrame(tick);
      }
      rows.forEach(function (row, i) {
        row.addEventListener('mouseenter', function (e) {
          tx = e.clientX + 28; ty = e.clientY - 100;
          clamp();
          if (current === -1) { x = tx; y = ty; pv.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
          show(i);
          schedule();
        });
        row.addEventListener('mousemove', function (e) {
          tx = e.clientX + 28; ty = e.clientY - 100;
          clamp();
          schedule();
        }, { passive: true });
        row.addEventListener('mouseleave', function () {
          hide();
          if (raf) { cancelAnimationFrame(raf); raf = null; }
        });
      });
    } else {
      // Touch / no-hover / reduced-motion: tap toggles a preview anchored inside the row
      var openRow = null;
      rows.forEach(function (row, i) {
        row.addEventListener('click', function () {
          if (openRow === row) { hide(); openRow = null; return; }
          if (openRow && pv.parentNode === openRow) openRow.removeChild(pv);
          pv.classList.add('is-anchored');
          row.appendChild(pv);
          show(i);
          openRow = row;
        });
      });
    }
  })();

  /* =============== Collection rail walkthrough =============== */
  (function rail() {
    var section = document.getElementById('collection');
    var el = section && section.querySelector('.rail');
    if (!el) return;
    var prev = (section && section.querySelector('.rail-prev')) || document.querySelector('.rail-prev');
    var next = (section && section.querySelector('.rail-next')) || document.querySelector('.rail-next');
    var GAP = 30;

    function step() {
      var card = el.querySelector('.card');
      return card ? card.offsetWidth + GAP : el.clientWidth * 0.8;
    }
    function go(dir) {
      el.scrollBy({ left: dir * step(), behavior: REDUCE ? 'auto' : 'smooth' });
    }
    function setState(btn, off) {
      if (!btn) return;
      btn.classList.toggle('disabled', off);
      btn.setAttribute('aria-disabled', off ? 'true' : 'false');
      btn.style.opacity = off ? '.35' : '';
      btn.style.pointerEvents = off ? 'none' : '';
    }
    function update() {
      var max = el.scrollWidth - el.clientWidth;
      setState(prev, el.scrollLeft <= 4);
      setState(next, el.scrollLeft >= max - 4 || max <= 4);
    }

    if (prev) prev.addEventListener('click', function () { go(-1); update(); });
    if (next) next.addEventListener('click', function () { go(1); update(); });
    el.addEventListener('scroll', function () {
      if (rafP) return;
      rafP = requestAnimationFrame(function () { rafP = null; update(); });
    }, { passive: true });
    var rafP = null;
    window.addEventListener('resize', update);
    update();
    // re-check once images settle, since scrollWidth grows as cards load
    window.addEventListener('load', update);

    // Keyboard stepping: only while focus is inside the collection section,
    // so global arrow-key scroll is never hijacked.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (!section.contains(e.target)) return;
      var rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      e.preventDefault();
      go(e.key === 'ArrowLeft' ? -1 : 1);
      update();
    });
  })();
})();
