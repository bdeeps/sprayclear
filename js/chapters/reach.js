// Chapter 4: how far and how fine. Side view of a room, 1 unit = 0.25 m. Drops fly with SprinklerClear's drag
// equation, and shrink by the d-squared evaporation law. Each drop flies alone in the sums; a real cloud drags
// air along with it, so it carries further than its smallest drops alone would.
import { THREE, M, approach } from '../kit.js';
import { makeSprayer, nozzle, pressureOf, LIQ, liqOpts, evapK, flight, COL, TAU, board, panelBg, title, bars, rng, placeBoards, inReel, isPhone, link, clamp, mistCloud } from '../spray.js';

const SC = 4;      // scene units per metre
const H0 = 1.1;    // the nozzle is 1.1 m above the floor
const SIZES = [20, 50, 100, 200, 500, 1000];
const CLR = { 20: 0xf59ee6, 50: 0xc49bff, 100: 0x6fb6ff, 200: 0x5ce1a9, 500: 0xf2c14e, 1000: 0xff7a59 };
const VIEW = { pos: [8.2, 8.3, 20], target: [8.2, 8, 0] };
const TALL = { pos: [8.3, 8.2, 17.7], target: [8.3, 8, 0] };

export default {
  id: 'reach',
  short: 'How far, how fine',
  title: 'How far and how fine',
  subtitle: 'Big drops carry. Fine drops stop within a hand or two, hang in the air and start to vanish.',
  view: VIEW,
  learn: `<p>Every drop leaves at about the same speed, then air drag brakes it. Drag depends on a drop's <b>surface</b>, while its momentum depends on its <b>volume</b>, so small drops lose speed fast. A 1 mm drop can fly several metres. A 50 µm drop stops within a hand's length and then drifts down slowly, taking about 14 seconds to fall a metre if it lasts that long. That is the same sum ${link('sprinklerclear', 'SprinklerClear', 'jet')} uses for sprinkler drops, and why ${link('showerclear', 'ShowerClear')} drops feel so different from a mist.</p>
    <p>Small drops also <b>evaporate</b> quickly, since the time to dry goes with size squared. In warm, dry air a 50 µm water drop lasts only a few seconds: it may never land. That is pleasant for cooling your face, but it also means fine mist from a chemical stays in the air you breathe, so read the label.</p>
    <p><b>Thin liquids.</b> Soap lowers surface tension, so a soapy cleaner breaks up a little finer than water. A <b>liquid sanitiser</b> has about a third of water's surface tension, but it is also twice as thick, and the two nearly cancel: the model gives drops only about 4% finer. It does evaporate many times faster.</p>
    <p><b>Thick liquids.</b> Cooking oil is about 65 times thicker than water. It loses speed in the nozzle's tiny passages, and the sheet is too sluggish to tear cleanly, so it spits coarse strings. A thick <b>gel</b> just oozes out as a rope. Gel products use different pumps, and oil misters use air pressure or a special nozzle.</p>
    <p class="tip"><b>Try it:</b> change the setting from spray to stream and see the flight lines stretch. Then try dry air against damp air.</p>`,
  terms: [
    { t: 'Drag', d: 'The push of air against a moving object. On a small drop, it is large compared with the drop\'s momentum.' },
    { t: 'Terminal speed', d: 'The steady speed at which drag balances a falling drop\'s weight. About 7 mm/s for a 15 µm drop, 4 m/s for a 1 mm one.' },
    { t: 'Viscosity', d: 'How thick a liquid is, how much it resists flowing. Water is about 1 mPa·s, cooking oil about 65.' },
    { t: 'Relative humidity', d: 'How much water the air holds, as a share of the most it could hold at that temperature.' },
  ],
  defaults: { liq: 'water', swirl: 1, force: 20, rh: 50 },
  controls: [
    { key: 'liq', type: 'seg', label: 'Liquid', options: liqOpts, fmt: (v) => LIQ[v].n },
    { key: 'swirl', type: 'seg', label: 'Nozzle', options: [{ v: 1, label: 'Spray' }, { v: 0, label: 'Stream' }] },
    { key: 'force', type: 'range', label: 'How hard you squeeze', min: 5, max: 40, step: 1, ends: ['5 N', '40 N'], fmt: (v) => v.toFixed(0) + ' N' },
    { key: 'rh', type: 'range', label: 'Humidity at 30 °C', min: 10, max: 95, step: 5, ends: ['dry', 'humid'], fmt: (v) => v + '%' },
  ],
  quiz: [
    { q: 'Why does a small drop stop so much sooner than a big one?', options: ['It is lighter so gravity pulls less', 'It has more surface for its weight, so drag slows it quickly', 'It is colder', 'It leaves the nozzle slower'], answer: 1, why: 'Halve a drop\'s width and its momentum falls 8 times, but its drag only falls about 4 times.' },
    { q: 'If a drop is half as wide, how long does it take to evaporate?', options: ['Half as long', 'A quarter as long', 'The same', 'Twice as long'], answer: 1, why: 'The d-squared law: the square of the diameter shrinks at a steady rate, so the time goes with size squared.' },
    { q: 'Why will cooking oil not mist in a trigger sprayer?', options: ['Oil is too heavy', 'It is many times thicker than water, so the sheet is too sluggish to tear into fine drops', 'Oil reacts with plastic', 'Oil has no surface tension'], answer: 1, why: 'Viscosity slows the flow in the tiny passages and damps the ripples that would break the sheet up.' },
  ],
  reel: [
    { ms: 5200, caption: 'Spray: 60 micron drops stop within a hand or two of the nozzle, then hang and evaporate.', set: { liq: 'water', swirl: 1, force: 20, rh: 50 }, view: TALL, spin: 0 },
    { ms: 5000, caption: 'Stream: the same squeeze makes one millimetre drops that fly several metres.', set: { liq: 'water', swirl: 0, force: 20, rh: 50 }, view: TALL, spin: 0 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const S = makeSprayer({ h: 9 }); const scale = 0.16;
    const holder = new THREE.Group(); holder.scale.setScalar(scale * SC / 4 * 1.25); root.add(holder); holder.add(S.g);
    const ny = H0 * SC, kk = holder.scale.x;
    holder.position.set(-3.2 * kk, ny - (S.lift + 1.0) * kk, 0);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, ny - 1.5, 12), M.metal(0x8d97ab)); stand.position.set(-0.4, (ny - 1.5) / 2, 0); root.add(stand);
    // ruler
    const rule = new THREE.Mesh(new THREE.BoxGeometry(24, 0.04, 0.2), M.matte(0x5c6680)); rule.position.set(12, 0.02, 0.8); root.add(rule);
    const ticks = []; for (let m = 0; m <= 6; m++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.25), M.matte(0xaab6cc)); t.position.set(m * SC, 0.12, 0.8); root.add(t); ticks.push(stage.label(m + ' m', [m * SC, -0.45, 0.8])); }
    const rnd = rng(9), mist = mistCloud(root, 520, 0.045, 0xbfe4ff, rnd);
    const lines = SIZES.map((d) => { const mat = new THREE.LineBasicMaterial({ color: CLR[d], transparent: true, opacity: 0.8 }); const geo = new THREE.BufferGeometry(); const l = new THREE.Line(geo, mat); l.frustumCulled = false; root.add(l); return l; });
    const lbl = SIZES.map((d) => stage.label(`${d >= 1000 ? d / 1000 + ' mm' : d + ' µm'}`, [0, 0, 0], root));
    let res = [], key = '', K = 0, n = null, sw = 1;
    const bA = board(root, 8.6, 5.4, 520, 326, (g, w, h) => {
      panelBg(g, w, h); title(g, 'What each drop size does');
      const col = (c) => '#' + c.toString(16).padStart(6, '0');
      bars(g, res.map((r) => ({ label: r.d >= 1000 ? '1 mm' : r.d + ' µm', value: Math.max(r.x, 0.005), color: col(CLR[r.d]), text: `${r.x < 1 ? (r.x * 100).toFixed(0) + ' cm' : r.x.toFixed(1) + ' m'}, ${r.dried ? 'dries' : 'lands'} ${fmt(r.t)}` })), { y: 46, w: 510, rowH: 42, labelW: 70, max: 16, font: 17 });
    }, [14.85, 12.8, 0]);
    function fmt(t) { return t < 10 ? t.toFixed(1) + ' s' : Math.round(t) + ' s'; }
    let hold = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05));
        const liq = LIQ[s.liq]; sw = approach(sw, s.swirl, 10, dt);
        n = nozzle(pressureOf(s.force), liq, s.swirl); K = evapK(liq, 30, s.rh);
        const k2 = `${s.liq}|${s.swirl}|${s.force}|${s.rh}`;
        if (k2 !== key) {
          key = k2;
          res = SIZES.map((d, i) => {
            const path = [], half = (s.swirl ? n.cone / 2 : 0), r = flight(d, n.v, s.swirl ? half * 0.5 : 0, H0, K, liq.rho, path);
            lines[i].geometry.dispose(); const arr = path.map((v, j) => (j % 3 === 1 ? v * SC : j % 3 === 0 ? v * SC : 0)); lines[i].geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
            lbl[i].position.set(r.x * SC + 0.15, r.y * SC + 0.9, 0); lbl[i].visible = d !== 20 && d !== 100;
            return { d, x: r.x, t: r.t, dried: r.dried, y: r.y };
          });
          bA.redraw();
        }
        // puffs: squirt for a moment every 3 s
        hold = (hold + dt) % 3;
        if (hold < 0.5 && n.Re >= 50) {
          const half = (s.swirl ? n.cone / 2 : 1.2) * Math.PI / 180;
          for (let i = 0; i < 7; i++) {
            const a = rnd() * TAU, sh = half * (0.8 + 0.2 * rnd()), sz = s.swirl ? clamp(n.smd * Math.exp((rnd() - 0.5) * 1.8), 10, 800) : n.smd * (0.8 + 0.4 * rnd());
            mist.emit([0, ny, 0], [n.v * Math.cos(sh), n.v * Math.sin(sh) * Math.cos(a), n.v * Math.sin(sh) * Math.sin(a) * 0.4], sz);
          }
        }
        mist.step(dt, { scale: SC, K, rho: liq.rho, slow: 0.25, sz: (u) => 0.45 + Math.min(1.8, Math.pow(u / 100, 0.6)) });
        placeBoards(stage, [bA], { tall: [[8.3, 16, 0]], tallScale: 1.9 });
        const nar = stage.host.clientWidth < 560 && !inReel();
        if (nar) bA.mesh.visible = false;
        stage.setShift(0, nar ? -0.1 : 0);
      },
      readout(s) {
        const liq = LIQ[s.liq], m = nozzle(pressureOf(s.force), liq, s.swirl), K2 = evapK(liq, 30, s.rh);
        const rel = nozzle(pressureOf(s.force), LIQ.water, s.swirl).smd;
        const tMean = K2 > 0 ? (m.smd * 1e-6) ** 2 / K2 : Infinity;
        return `<div class="big">${liq.n}: ${m.regime}</div>
          <div class="row"><span>Speed at the hole</span><b>${m.v.toFixed(m.v < 3 ? 1 : 0)} m/s</b></div>
          <div class="row"><span>Typical drop (SMD)</span><b>${m.Re < 50 ? 'none' : m.smd.toFixed(0) + ' µm'}</b></div>
          <div class="row"><span>Against water</span><b>${m.Re < 50 ? 'no drops' : Math.round((m.smd / rel) * 100) + '% of its size'}</b></div>
          <div class="row"><span>That drop dries in</span><b>${!isFinite(tMean) ? 'does not dry' : tMean < 60 ? tMean.toFixed(1) + ' s' : Math.round(tMean / 60) + ' min'}</b></div>
          ${isPhone() ? '' : '<small>Each drop alone in still air at 30 °C. A real spray drags air along, so the cloud goes further. Dots enlarged, time slowed.</small>'}`;
      },
    };
  },
};
