// Chapter 3: jet to mist. A much enlarged cross-section of the nozzle (drawn about 40 times life size).
// Models are in js/spray.js: Bernoulli speed, Rizk-Lefebvre film and cone, Lefebvre drop size, Rayleigh jet.
import { THREE, M, approach, rod } from '../kit.js';
import { nozzle, pressureOf, LIQ, liqOpts, COL, TAU, board, panelBg, title, axes, line, dot, rng, placeBoards, inReel, isPhone, link, clamp, lerp, dots, PUMP } from '../spray.js';

const VIEW = { pos: [0.8, 4.2, 9.5], target: [0.8, 3.7, 0] };
const TALL = { pos: [1, 6.5, 10], target: [1, 6, 0] };

export default {
  id: 'mist',
  short: 'Jet to mist',
  title: 'From a jet to a mist',
  subtitle: 'Pressure gives the speed. Spin makes a thin cone. The cone tears into threads, and the threads pinch into drops.',
  view: VIEW,
  learn: `<p>Liquid under pressure speeds up as it reaches the hole. <b>Bernoulli's</b> rule gives the speed: v = √(2P/ρ). At 4.6 bar water can reach about <b>30 m/s</b>, over 100 km/h, the same sum as ${link('perfumeclear', 'PerfumeClear', 'bottle')} and ${link('bernoulliclear', 'BernoulliClear')}.</p>
    <p>Speed alone makes a <b>jet</b>. To make a mist, the nozzle first spins the liquid. It enters the <b>swirl chamber</b> from the side, so it whirls against the wall and leaves an air core in the middle. Out of the hole it flies outward as well as forward, making a <b>hollow cone</b>: a sheet about as thick as two hairs at the hole, thinning as it spreads until it is thinner than one.</p>
    <p>A thin fast sheet cannot last. The <b>Weber number</b> compares the liquid's push with <b>surface tension</b>, the skin that wants to keep it together. When it is high, ripples grow and tear the sheet into threads, called <b>ligaments</b>. Then surface tension does its other job: a thread is unstable and pinches into a row of beads. That is the <b>Rayleigh–Plateau instability</b>, the same thing that breaks up the stream from a tap (${link('tapclear', 'TapClear')}).</p>
    <p>Twist the cap to <b>stream</b> and the swirl ports are bypassed. The liquid leaves as a straight jet 0.5 mm wide, and it breaks into big drops about 1.9 times its width, far away. So: stream goes far with big drops; spray covers a wide patch with small ones.</p>
    <p class="tip"><b>Try it:</b> slide the nozzle from stream to spray. Then squeeze harder and see the drops shrink, and try the thick liquids.</p>`,
  terms: [
    { t: 'Swirl chamber', d: 'The tiny room behind the hole where side-entering liquid spins and an air core forms.' },
    { t: 'Hollow cone', d: 'The spray shape a swirl nozzle makes: a thin spreading sheet, with little liquid in the middle.' },
    { t: 'Ligament', d: 'A thread of liquid torn from the sheet, just before it breaks into drops.' },
    { t: 'Weber number', d: 'A ratio of how hard the moving liquid pushes against how strongly surface tension holds it together.' },
    { t: 'Surface tension', d: 'The pull between molecules at a liquid\'s surface that makes it act like a stretched skin.' },
    { t: 'Rayleigh–Plateau instability', d: 'Why a thread of liquid cannot stay a thread: it pinches into beads, since that lowers its surface area.' },
    { t: 'SMD', d: 'Sauter mean diameter: a drop size with the same volume-to-surface ratio as the whole spray. Engineers use it to describe a spray in one number.' },
  ],
  defaults: { swirl: 1, force: 20, liq: 'water', on: true },
  controls: [
    { key: 'swirl', type: 'range', label: 'Twist the nozzle', min: 0, max: 1, step: 0.01, ends: ['stream', 'spray'], fmt: (v) => (v < 0.1 ? 'stream' : v > 0.9 ? 'spray' : 'between (real caps click to one or the other)') },
    { key: 'force', type: 'range', label: 'How hard you squeeze', min: 5, max: 40, step: 1, ends: ['5 N', '40 N'], fmt: (v) => v.toFixed(0) + ' N' },
    { key: 'liq', type: 'seg', label: 'Liquid', options: liqOpts, fmt: (v) => LIQ[v].n },
    { key: 'on', type: 'toggle', label: 'Nozzle open (off = sealed)' },
  ],
  quiz: [
    { q: 'What does the swirl chamber do?', options: ['It heats the liquid', 'It spins the liquid so it leaves as a thin hollow cone', 'It stores air', 'It filters out dirt'], answer: 1, why: 'Liquid enters from the side and whirls. Leaving the hole, it spreads out as a thin sheet that tears up easily.' },
    { q: 'Why does a thread of liquid break into beads?', options: ['Gravity cuts it', 'Surface tension squeezes it into a shape with less surface', 'The air freezes it', 'It runs out of liquid'], answer: 1, why: 'A sphere has less surface than a thread holding the same liquid. Any small ripple grows until the thread pinches: the Rayleigh–Plateau instability.' },
    { q: 'What happens to the spray when you squeeze harder?', options: ['Drops get smaller', 'Drops get bigger', 'Nothing changes', 'It turns into a stream'], answer: 0, why: 'More pressure means faster liquid and a thinner sheet, so it tears into finer drops. In the model, doubling the pressure shrinks the drops by about a quarter.' },
  ],
  reel: [
    { ms: 5600, caption: 'At 4.6 bar water leaves at up to 30 m/s, and a swirl chamber spins it into a thin hollow cone.', set: { force: 20, liq: 'water', on: true }, anim: { swirl: [0, 1] }, view: TALL, spin: 0 },
    { ms: 5000, caption: 'The sheet tears into threads, and surface tension pinches the threads into drops about 60 microns wide.', set: { swirl: 1, force: 20, liq: 'water', on: true }, view: TALL, spin: 0.1 },
  ],
  build({ stage }) {
    let inst = { s: null };
    const root = new THREE.Group(); stage.root.add(root);
    const g = new THREE.Group(); g.position.set(-2.1, 2.1, 0); root.add(g);
    // Bore on the +x axis: chamber from x = -1.6 to 0, tapering to a hole at x = 0.3.
    // Lathe around +x, cut open towards the viewer.
    const prof = [[1.0, -1.7], [1.0, -0.1], [0.38, 0.28], [0.2, 0.42], [0.2, 0.5]].map(([r, x]) => new THREE.Vector2(r, x));
    const lathe = new THREE.LatheGeometry(prof, 56, Math.PI * 0.35, Math.PI * 1.3); lathe.rotateZ(-Math.PI / 2);
    const inner = new THREE.Mesh(lathe, M.clear(0xdce6f4, 0.32)); g.add(inner);
    const outerProf = [[1.28, -2.0], [1.28, 0.0], [0.7, 0.42], [0.7, 0.62]].map(([r, x]) => new THREE.Vector2(r, x));
    const og = new THREE.LatheGeometry(outerProf, 56, Math.PI * 0.35, Math.PI * 1.3); og.rotateZ(-Math.PI / 2);
    g.add(new THREE.Mesh(og, M.clear(0xa7b4c8, 0.2)));
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.035, 8, 40), M.plastic(0x9aa4b6)); lip.rotation.y = Math.PI / 2; lip.position.x = 0.5; g.add(lip);
    // back plate with the ports
    const plate = rod(-2.0, -1.72, 1.0, 1.0, M.plastic(0x4fd0c0, { transparent: true, opacity: 0.55 }), 40); g.add(plate);
    // side-entering ports, drawn as curved tubes coming in tangentially
    const portM = M.plastic(0x4fd0c0, { transparent: true, opacity: 0.45 });
    const ports = [0, 1, 2].map((i) => { const a = i / 3 * TAU + 0.6, c = Math.cos(a), sn = Math.sin(a), t = [-sn, c]; const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.9), portM); m.position.set(-1.7, c * 0.72, sn * 0.72); m.lookAt(new THREE.Vector3(-1.7, c * 0.72 + t[0], sn * 0.72 + t[1]).add(g.position)); return m; });
    ports.forEach((p) => g.add(p));
    const straight = rod(-2.0, -1.0, 0.2, 0.2, M.clear(0x6fb6ff, 0.5), 16); g.add(straight);
    // water spiralling in the chamber
    const N = 110, spin = dots(N, 0.05, 0x8fd0ff, 6); g.add(spin);
    const sp = Array.from({ length: N }, (_, i) => ({ u: i / N, a: i * 2.4, r: 0.8 + 0.1 * Math.sin(i) }));
    // the sheet: a surface of revolution with a growing ripple
    const NX = 42, NA = 48;
    const shGeo = new THREE.BufferGeometry(); const pos = new Float32Array((NX + 1) * (NA + 1) * 3); shGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const idx = []; for (let i = 0; i < NX; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } shGeo.setIndex(idx);
    const shMat = new THREE.MeshStandardMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.5, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const sheet = new THREE.Mesh(shGeo, shMat); sheet.frustumCulled = false; g.add(sheet);
    // ligaments and drops
    const MAXL = 90, lig = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.03, 0.34, 3, 8), new THREE.MeshStandardMaterial({ color: 0xa8dcff, roughness: 0.15 }), MAXL); lig.frustumCulled = false; g.add(lig);
    const rnd = rng(21), MAXD = 420, dr = dots(MAXD, 0.045, 0xb9e4ff, 8, true); g.add(dr);
    const D = Array.from({ length: MAXD }, () => ({ on: false, p: [0, 0, 0], v: [0, 0, 0], s: 1 }));
    let next = 0;
    const o = new THREE.Object3D(), U = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3();
    const LL = Array.from({ length: MAXL }, () => ({ a: rnd() * TAU, off: rnd(), l: rnd() }));
    let kS = 1, hole = 1, t = 0, cur = nozzle(pressureOf(20));
    const bA = board(root, 3.8, 2.7, 500, 355, (gx, w, h) => {
      panelBg(gx, w, h); title(gx, 'Drop size', 'µm against squeeze');
      const liq = LIQ[inst.s?.liq || 'water'], sw = inst.s?.swirl ?? 1;
      const ax = axes(gx, w, h, { x0: 70, y0: h - 42, y1: 52, x1: w - 18, xMin: 5, xMax: 40, yMin: 10, yMax: 1200, yLog: true, xTicks: [10, 20, 30, 40], yTicks: [10, 100, 1000], xFmt: (v) => v + ' N', yFmt: (v) => v + '', xLabel: '' });
      const pts = []; for (let F = 5; F <= 40; F += 1) { const n = nozzle(pressureOf(F), liq, sw); if (n.P > 0) pts.push([F, clamp(n.smd, 10, 1200)]); }
      line(gx, pts, ax.X, ax.Y, COL.cold, 4);
      const fp = inst.s?.force ?? 20, n = nozzle(pressureOf(fp), liq, sw); dot(gx, ax.X(fp), ax.Y(clamp(n.smd, 10, 1200)), COL.hot, 9);
    }, [4.05, 6.35, 0]);
    const lb = {
      ch: stage.label('<b>swirl chamber</b>', [-0.7, -1.6, 0], g, 'hot'), core: stage.label('air core', [-0.6, 0.0, 0], g), ports: stage.label('side ports', [-1.6, 1.5, 0], g),
      sheet: stage.label('<b>thin sheet</b>', [1.5, 1.35, 0], g, 'hot'), lig: stage.label('threads (ligaments)', [3.1, 2.05, 0], g), drops: stage.label('<b>drops</b>', [4.8, 2.7, 0], g, 'hot'), jet: stage.label('<b>straight jet</b>', [2.0, 0.55, 0], g, 'hot'),
    };
    let rd = 0;
    inst = {
      s: null,
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); t += dt; inst.s = s;
        kS = approach(kS, s.swirl, 8, dt); hole = approach(hole, s.on ? 1 : 0, 10, dt);
        const liq = LIQ[s.liq], n = nozzle(pressureOf(s.force), liq, kS); cur = n;
        const flow = n.P > 0 && s.on ? 1 : 0, half = n.cone / 2 * Math.PI / 180;
        const col = new THREE.Color(liq.col); shMat.color.copy(col); lig.material.color.copy(col).lerp(new THREE.Color(0xffffff), 0.25);
        // spiralling water: more swirl means tighter circles at the wall, an air core in the middle
        const pace = flow * clamp(n.v / 30, 0.03, 1.3);
        sp.forEach((q, i) => {
          q.u += dt * 0.35 * pace; if (q.u > 1) q.u -= 1;
          const x = lerp(-1.7, 0.42, q.u), R = x < -0.1 ? 0.92 : lerp(0.92, 0.17, (x + 0.1) / 0.52);
          const core = lerp(0.04, R * 0.9 * q.r, Math.max(0.0, kS));
          q.a += dt * pace * lerp(0, 14 / Math.max(0.35, R), kS);
          spin.place(i, x, core * Math.cos(q.a), core * Math.sin(q.a), flow ? 1 : 0.0001);
        }); spin.done();
        // sheet length shortens at high speed; thread and drop region follow
        const rope = n.Re < 50, cone = Math.max(rope ? 0.02 : 0.02, half);
        const Lb = (rope ? 7 : lerp(6.8, clamp(3.0 - 0.03 * n.v, 1.7, 3.0), Math.pow(kS, 0.5))) * (flow ? 1 : 0.02);
        const x0 = 0.5, r0 = lerp(0.1, 0.17, kS), amp = lerp(0.02, 0.05, kS) * (rope ? 0.2 : 1);
        for (let i = 0; i <= NX; i++) {
          const u = i / NX, xx = u * Lb, R0 = r0 + xx * Math.tan(cone);
          for (let j = 0; j <= NA; j++) {
            const a = j / NA * TAU, grow = Math.pow(u, 1.8);
            const ripple = (rope ? 0 : amp) * grow * (2 + 10 * kS * u) * Math.sin(xx * 9 / Math.max(0.5, 0.5 + 0.5 * (1 - kS)) - t * 26 * pace);
            const varicose = (1 - kS) * 0.05 * grow * Math.sin(xx * 6 - t * 20 * pace);
            const R = Math.max(0.005, R0 + ripple * kS + varicose);
            const id = (i * (NA + 1) + j) * 3;
            pos[id] = x0 + xx + (1 - kS) * ripple * 0.1; pos[id + 1] = R * Math.cos(a); pos[id + 2] = R * Math.sin(a);
          }
        }
        shGeo.attributes.position.needsUpdate = true; shGeo.computeVertexNormals(); sheet.visible = flow > 0;
        // ligaments, torn from the end of the sheet; a jet makes none
        const Rend = r0 + Lb * Math.tan(cone), nl = flow && kS > 0.3 && !rope ? Math.round(MAXL * clamp(kS, 0, 1)) : 0;
        for (let i = 0; i < MAXL; i++) {
          const q = LL[i];
          if (i >= nl) { o.position.set(0, -99, 0); o.scale.setScalar(0.0001); o.updateMatrix(); lig.setMatrixAt(i, o.matrix); continue; }
          q.l += dt * pace * 1.6; if (q.l > 1) { q.l -= 1; q.a = rnd() * TAU; }
          const ex = Lb + q.l * 1.0 + q.off * 0.25, R = r0 + ex * Math.tan(cone);
          v3.set(Math.cos(cone), Math.sin(cone) * Math.cos(q.a) * 0.3 + 0.75 * Math.sin(q.a * 3), Math.sin(cone) * Math.sin(q.a) * 0.3 - 0.75 * Math.cos(q.a * 3)).normalize();
          o.position.set(x0 + ex, R * Math.cos(q.a), R * Math.sin(q.a)); o.quaternion.setFromUnitVectors(U, v3); const w = 1 - 0.4 * q.l; o.scale.set(w, 1 - 0.25 * q.l, w); o.updateMatrix(); lig.setMatrixAt(i, o.matrix);
        }
        lig.instanceMatrix.needsUpdate = true; lig.count = MAXL;
        // drops: sized from the model (log scale on screen)
        const sc = clamp(Math.pow(n.smd / 60, 0.55), 0.8, 4.4);
        if (flow && !rope) {
          const rate = lerp(8, 18, kS) * clamp(n.Q * 1e6, 0.2, 1.5);
          for (let i = 0; i < rate * dt * 60 / 8; i++) {
            const a = rnd() * TAU, q = D[next]; next = (next + 1) % MAXD;
            const ex = Lb + 1.0 + rnd() * 0.3, R = r0 + ex * Math.tan(cone), sp2 = 1.4 + clamp(n.v / 30, 0.1, 1.2) * 2.2;
            q.on = true; q.p = [x0 + ex, R * Math.cos(a), R * Math.sin(a)];
            q.v = [sp2 * Math.cos(cone), sp2 * Math.sin(cone) * Math.cos(a), sp2 * Math.sin(cone) * Math.sin(a)]; q.s = sc * (0.6 + 0.8 * rnd() * rnd());
          }
        }
        D.forEach((q, i) => {
          if (q.on) { const f = Math.exp(-dt * 0.9 / Math.max(0.4, sc * 0.5)); q.v[0] *= f; q.v[1] = q.v[1] * f - dt * 0.8; q.v[2] *= f; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; if (q.p[0] > 7.9 || q.p[1] < -1.0 || Math.abs(q.p[1]) > 5) q.on = false; }
          dr.place(i, q.p[0], q.p[1], q.p[2], q.on ? q.s : 0.0001);
        }); dr.done();
        lb.jet.visible = kS < 0.2; lb.lig.visible = kS > 0.3 && !rope; lb.sheet.visible = kS > 0.3 && !rope; lb.core.visible = kS > 0.5; lb.ports.visible = kS > 0.5;
        lb.sheet.position.set(1.5, -(0.3 + 1.0 * Math.tan(cone)) - 0.45, 0); lb.lig.position.set(0.5 + Lb + 0.7, -(r0 + (Lb + 0.7) * Math.tan(cone)) - 0.4, 0); lb.drops.position.set(0.5 + Lb + 2.4, r0 + 1.0, 0);
        placeBoards(stage, [bA], { tall: [[1, 10.5, 0]], tallScale: 2.5 });
        if (stage.host.clientWidth < 560 && !inReel()) { bA.mesh.visible = false; stage.setShift(0, -0.22); lb.ports.visible = lb.core.visible = false; } else stage.setShift(0, 0);
        rd += dt; if (rd > 0.15) { rd = 0; bA.redraw(); }
      },
      readout(s) {
        const liq = LIQ[s.liq], n = nozzle(pressureOf(s.force), liq, s.swirl);
        if (!s.on) return '<div class="big">Nozzle off</div><small>The cap blocks the path, so nothing can leak if the bottle tips or the trigger is knocked.</small>';
        return `<div class="big">${n.regime[0].toUpperCase() + n.regime.slice(1)}</div>
          <div class="row"><span>Pressure</span><b>${(n.P / 1e5).toFixed(1)} bar</b></div>
          <div class="row"><span>Speed at the hole</span><b>${n.v.toFixed(n.v < 3 ? 1 : 0)} m/s</b></div>
          <div class="row"><span>Cone angle</span><b>${n.cone.toFixed(0)}°</b></div>
          <div class="row"><span>Typical drop (SMD)</span><b>${n.Re < 50 ? 'none' : n.smd.toFixed(0) + ' µm'}</b></div>
          <div class="row"><span>Film at the hole</span><b>${n.film.toFixed(0)} µm</b></div>
          <div class="row"><span>Weber number</span><b>${Math.round(n.We).toLocaleString('en-IN')}</b></div>
          ${isPhone() ? '' : '<small>Nozzle drawn huge; true hole 0.5 mm. Textbook formulas with assumed sizes: a guide, not a measurement.</small>'}`;
      },
    };
    void PUMP;
    return inst;
  },
};
