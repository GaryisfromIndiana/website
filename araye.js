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
  // Enable smooth scroll only after initial load settles
  setTimeout(function () {
    document.documentElement.classList.add('js-loaded');
  }, 100);

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =============== Motion =============== */
  (function motion() {
    function showAll() {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      document.querySelectorAll('.curve-path').forEach(function (el) { el.classList.add('in'); });
      document.querySelectorAll('.rail .card').forEach(function (el) { el.classList.add('is-active'); });
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

      var rail = document.querySelector('.rail');
      if (rail) {
        var io3 = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.target.classList.toggle('is-active', en.isIntersecting); });
        }, { root: rail, threshold: 0.6 });
        document.querySelectorAll('.rail .card').forEach(function (el) { io3.observe(el); });
      }
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
  var T = { stoneGeoList: [], disposables: [], inited: false, applied: null, dragging: false };
  var canvas = document.getElementById('gem-canvas');

  function studioEnv(kind) {
    var W = 1024, H = 512;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    function panel(x, y, w, h, col, a) {
      c.globalAlpha = (a || 1) * 0.35; c.fillStyle = col; c.fillRect(x - 8, y - 8, w + 16, h + 16);
      c.globalAlpha = a || 1; c.fillRect(x, y, w, h); c.globalAlpha = 1;
    }
    if (kind === 'metal') {
      // silk box: bright, broad, soft — for liquid gold
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fff8ea'); g.addColorStop(0.36, '#c9b188'); g.addColorStop(0.66, '#6e5a38'); g.addColorStop(1, '#1d150a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      panel(60, 40, 280, 110, '#ffffff'); panel(440, 30, 180, 140, '#fffdf4', 0.95);
      panel(720, 50, 230, 100, '#ffeec8'); panel(240, 215, 560, 40, '#fff3da', 0.75);
      c.globalAlpha = 0.7; c.fillStyle = '#241a0c'; c.fillRect(0, 320, W, 80); c.globalAlpha = 1;
      panel(80, 298, 180, 16, '#ffdf9e', 0.7); panel(640, 298, 200, 16, '#fff6e0', 0.6);
    } else {
      // diamond box: black field, hard white panels above, pinpoints all round
      var g2 = c.createLinearGradient(0, 0, 0, H);
      g2.addColorStop(0, '#17181b'); g2.addColorStop(0.5, '#0a0b0d'); g2.addColorStop(1, '#040405');
      c.fillStyle = g2; c.fillRect(0, 0, W, H);
      panel(0, 6, W, 34, '#ffffff', 0.95);
      panel(60, 70, 190, 60, '#ffffff'); panel(300, 55, 60, 180, '#ffffff');
      panel(420, 90, 220, 44, '#ffffff'); panel(690, 60, 70, 190, '#ffffff');
      panel(800, 100, 180, 48, '#fff3dc'); panel(150, 190, 120, 34, '#ffffff', 0.9);
      panel(520, 200, 140, 30, '#ffffff', 0.9); panel(900, 210, 90, 26, '#ffffff', 0.85);
      for (var i = 0; i < 72; i++) {
        var x = (i * 131 + 17) % W, y = 24 + ((i * 67) % 420), s = 5 + (i % 4) * 3;
        panel(x, y, s, s, i % 6 === 0 ? '#ffe9c4' : '#ffffff');
      }
      c.fillStyle = '#eceef0'; c.globalAlpha = 0.65; c.fillRect(0, 296, W, 30); c.globalAlpha = 1;
    }
    var tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }
  function flat(geo) { var g = geo.toNonIndexed(); g.computeVertexNormals(); geo.dispose(); return g; }
  function pinch(geo, fn) {
    var p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var z = p.getZ(i), r = fn(Math.max(-1, Math.min(1, z)));
      p.setX(i, p.getX(i) * r.x); p.setZ(i, z * r.z);
    }
    p.needsUpdate = true;
    return geo;
  }
  function stoneGeos(shape) {
    var seg = 16, th0 = 0;
    if (shape === 'Cushion' || shape === 'Emerald') { seg = 8; th0 = Math.PI / 8; }
    if (shape === 'Emerald') {
      var geos = [];
      [[0.60, 0.74, 0.14, 0.50], [0.74, 0.88, 0.14, 0.36], [0.88, 1.0, 0.13, 0.225]].forEach(function (s) {
        geos.push({ g: new THREE.CylinderGeometry(s[0], s[1], s[2], seg, 1, false, th0), y: s[3] });
      });
      geos.push({ g: new THREE.CylinderGeometry(1.0, 1.0, 0.1, seg, 1, false, th0), y: 0.11 });
      [[1.0, 0.82, 0.2, -0.04], [0.82, 0.56, 0.28, -0.28], [0.56, 0.1, 0.36, -0.6]].forEach(function (s) {
        geos.push({ g: new THREE.CylinderGeometry(s[0], s[1], s[2], seg, 1, false, th0), y: s[3] });
      });
      return { geos: geos, sx: 1.28, sz: 0.84 };
    }
    var crown = new THREE.CylinderGeometry(0.56, 1.0, 0.34, seg, 1, false, th0);
    var girdle = new THREE.CylinderGeometry(1.0, 1.0, 0.08, seg, 1, false, th0);
    var pav = new THREE.CylinderGeometry(1.0, 0.02, 0.92, seg, 1, false, th0);
    var sx = 1, sz = 1;
    if (shape === 'Oval') { sx = 0.78; sz = 1.16; }
    if (shape === 'Cushion') { sx = 1.02; sz = 1.02; }
    if (shape === 'Pear') {
      var fnP = function (z) { return { x: z > 0 ? 1 - 0.82 * Math.pow(z, 1.5) : 1, z: 1.18 }; };
      pinch(crown, fnP); pinch(girdle, fnP); pinch(pav, fnP);
    }
    if (shape === 'Marquise') {
      var fnM = function (z) { return { x: 1 - 0.78 * Math.pow(Math.abs(z), 1.6), z: 1.3 }; };
      pinch(crown, fnM); pinch(girdle, fnM); pinch(pav, fnM);
    }
    return { geos: [{ g: crown, y: 0.25 }, { g: girdle, y: 0.04 }, { g: pav, y: -0.46 }], sx: sx, sz: sz };
  }
  function buildStone() {
    T.stoneGeoList.forEach(function (g) { g.dispose(); });
    var spec = stoneGeos(state.shape);
    var flats = spec.geos.map(function (s) { return { g: flat(s.g), y: s.y }; });
    T.stoneGeoList = flats.map(function (f) { return f.g; });
    var turned = (state.shape === 'Oval' || state.shape === 'Pear' || state.shape === 'Marquise' || state.shape === 'Emerald');
    T.units.forEach(function (u) {
      while (u.stone.children.length) u.stone.remove(u.stone.children[0]);
      flats.forEach(function (f) {
        var mirror = new THREE.Mesh(f.g, T.facetMat); mirror.position.y = f.y; u.stone.add(mirror);
        var fire = new THREE.Mesh(f.g, T.fireMat); fire.position.y = f.y; fire.scale.setScalar(1.001); u.stone.add(fire);
      });
      u.stone.scale.set(spec.sx, 1, spec.sz);
      u.stone.rotation.y = turned ? Math.PI / 2 : 0;
      u.mount.scale.set(spec.sx, 1, spec.sz);
      u.mount.rotation.y = u.stone.rotation.y;
    });
  }

  function init3d() {
    if (T.inited || !canvas || typeof THREE === 'undefined') return;
    T.inited = true;
    var disposables = T.disposables;
    function track(res) { disposables.push(res); return res; }
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    var scene = new THREE.Scene();
    var gemEnv = track(studioEnv('gem')), metalEnv = track(studioEnv('metal'));
    var pmrem = new THREE.PMREMGenerator(renderer);
    var gemIBL = track(pmrem.fromEquirectangular(gemEnv).texture);
    var metalIBL = track(pmrem.fromEquirectangular(metalEnv).texture);
    var refrRT = track(new THREE.WebGLCubeRenderTarget(512));
    refrRT.fromEquirectangularTexture(renderer, gemEnv);
    refrRT.texture.mapping = THREE.CubeRefractionMapping;
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 1.55, 9.0);
    camera.lookAt(0, -0.2, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6b6e74, 0.3));
    var key = new THREE.DirectionalLight(0xffffff, 0.5); key.position.set(3, 6, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0xfff2da, 0.28); rim.position.set(-5, 2, -4); scene.add(rim);
    // gem: mirror-facet core + additive refraction shell = sparkle and depth
    T.facetMat = track(new THREE.MeshStandardMaterial({ color: 0xf2f4f8, metalness: 1, roughness: 0.03, envMapIntensity: 1.8, envMap: gemIBL, flatShading: true }));
    T.fireMat = track(new THREE.MeshBasicMaterial({ envMap: refrRT.texture, refractionRatio: 0.93, color: 0xffffff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    T.metalMat = track(new THREE.MeshStandardMaterial({ color: 0xcf9a3a, metalness: 1, roughness: 0.18, envMapIntensity: 1.0, envMap: metalIBL }));
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
      canvas.addEventListener(type, fn);
      T.disposables.push({ dispose: function () { canvas.removeEventListener(type, fn); } });
    });
    var fit = function () {
      var w = canvas.clientWidth || 300, h = canvas.clientHeight || 300, dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    fit();
    if (typeof ResizeObserver !== 'undefined') { T.ro = new ResizeObserver(fit); T.ro.observe(canvas); }
    var onVis = function () { T.pageHidden = document.hidden; };
    document.addEventListener('visibilitychange', onVis);
    T.onVis = onVis;
    var tick = function () {
      T.raf = requestAnimationFrame(tick);
      if (T.pageHidden) return;
      if (!T.dragging && !REDUCE) T.tRy = (T.tRy || 0) + 0.0038;
      T.ry = (T.ry || 0) + ((T.tRy || 0) - (T.ry || 0)) * 0.08;
      T.rx = (T.rx == null ? 0.12 : T.rx) + ((T.tRx == null ? 0.12 : T.tRx) - (T.rx == null ? 0.12 : T.rx)) * 0.08;
      T.root.rotation.y = T.ry; T.root.rotation.x = T.rx;
      renderer.render(scene, camera);
    };
    tick();
  }

  function teardown3d() {
    if (!T.inited) return;
    T.inited = false;
    if (T.raf) cancelAnimationFrame(T.raf);
    if (T.ro) T.ro.disconnect();
    if (T.onVis) { document.removeEventListener('visibilitychange', T.onVis); T.onVis = null; }
    T.stoneGeoList.forEach(function (g) { try { g.dispose(); } catch (e) {} });
    T.stoneGeoList = [];
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
        x += (tx - x) * 0.22;
        y += (ty - y) * 0.22;
        pv.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick);
      }
      function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
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
        });
        row.addEventListener('mouseleave', hide);
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
})();
