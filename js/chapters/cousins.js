// Chapter 5: the cousins. Bernoulli suction: dP = 1/2 rhoAir v^2 must beat rho g h. Stored-pressure cans: a
// liquefied gas keeps its vapour pressure until it runs out (held at an illustrative 3.5 bar above the air),
// a compressed gas follows Boyle's law. Pump-up sprayer: Boyle's law on the air pocket; BIS documents give an
// average working pressure about 300 kPa and FAO says the safety valve should hold it under 5 bar.
import { THREE, M, rod, beam, tube, sphere } from '../kit.js';
import { speedForLift, COL, TAU, board, panelBg, title, axes, line, dot, rng, placeBoards, inReel, isPhone, link, clamp, lerp, stream, puffs } from '../spray.js';

const VIEW = { pos: [1.2, 4.4, 10.5], target: [1.2, 4, 0] };
const TALL = { pos: [1, 7, 8.85], target: [1, 6.5, 0] };
const LIFT = 0.05;
const P0_LIQ = 3.5, P0_GAS = 9, HEAD = 1 / 3;     // bar above the air, illustrative; the can starts a third full of gas
const canP = (u) => ({ liq: u < 0.97 ? P0_LIQ : P0_LIQ * (1 - (u - 0.97) / 0.03), gas: (P0_GAS + 1) * HEAD / (HEAD + (1 - HEAD) * u) - 1 });
const pumpP = (u) => 4 * 0.3 / (0.3 + 0.7 * u) - 1;   // 3 bar above air (4 absolute), 30% of the tank air at the start

export default {
  id: 'cousins',
  short: 'The cousins',
  title: 'The cousins',
  subtitle: 'A blown bulb, a can of stored pressure and a pump-up knapsack: three other ways to push a liquid out.',
  view: VIEW,
  learn: `<p><b>The bulb atomiser and the airbrush.</b> This is the one that really uses suction. Squeeze a rubber bulb and air rushes across the top of a thin tube standing in the liquid. Fast air has lower pressure (${link('bernoulliclear', 'BernoulliClear')}), and the air on the liquid below pushes it up the tube, where the blast tears it apart. Lifting water 5 cm takes air at about 29 m/s. Dr Allen DeVilbiss of Toledo, Ohio, patented his medical atomiser in 1888, and an airbrush is the same idea with a fine needle. A trigger sprayer uses no blown air at all.</p>
    <p><b>The aerosol can</b> stores its push. A <b>liquefied gas</b> propellant sits partly as liquid and partly as vapour. As the can empties, more liquid boils to refill the space, so the pressure stays steady until nearly the end. A can with a <b>compressed gas</b> such as nitrogen is different: the pressure falls as the gas expands. Every can is a small pressure vessel, which is why labels say never to heat or pierce it.</p>
    <p><b>The pump-up and knapsack sprayer</b> is the farmer's and gardener's version, seen in fields across India. You pump air by hand, and that air then pushes the liquid along a hose to a nozzle. Indian standards speak of about 3 bar in use. As the tank empties, the air expands and the pressure falls, so you pump again. Pesticide use should follow the label and approved directions: in India, products are registered through the Central Insecticides Board and Registration Committee.</p>
    <p class="tip"><b>Try it:</b> switch cousin, then slide "Used up" and compare the pressure lines. On the bulb, raise the air speed until liquid starts climbing.</p>`,
  terms: [
    { t: 'Bernoulli effect', d: 'In a smooth flow, where the air moves faster its pressure is lower.' },
    { t: 'Propellant', d: 'The gas in an aerosol can that stores the pressure and pushes the product out.' },
    { t: 'Vapour pressure', d: 'The pressure of a vapour in balance with its liquid. It depends on temperature, not on how much liquid is left.' },
    { t: 'Boyle\'s law', d: 'For a fixed amount of gas at steady temperature, pressure times volume stays constant.' },
    { t: 'Knapsack sprayer', d: 'A tank carried on the back, with a hand pump and a lance, used for crops and gardens.' },
  ],
  defaults: { cousin: 'bulb', air: 40, used: 0.2, kind: 'liq' },
  controls: [
    { key: 'cousin', type: 'seg', label: 'Cousin', options: [{ v: 'bulb', label: 'Bulb' }, { v: 'can', label: 'Can' }, { v: 'pack', label: 'Pump-up' }] },
    { key: 'air', type: 'range', label: 'Bulb: air speed', min: 0, max: 80, step: 1, ends: ['still', '80 m/s'], fmt: (v) => v.toFixed(0) + ' m/s' },
    { key: 'used', type: 'range', label: 'Can and pump-up: used up', min: 0, max: 1, step: 0.01, ends: ['full', 'empty'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'kind', type: 'seg', label: 'Can holds', options: [{ v: 'liq', label: 'Liquefied gas' }, { v: 'gas', label: 'Compressed gas' }] },
  ],
  quiz: [
    { q: 'Which of these uses air blowing over a tube to raise the liquid?', options: ['A trigger sprayer', 'A perfume bulb atomiser', 'An aerosol can', 'A knapsack sprayer'], answer: 1, why: 'The bulb blows fast, low-pressure air across a tube, and the air above the liquid pushes it up. Trigger sprayers use a piston and valves.' },
    { q: 'Why does a can with liquefied propellant keep steady pressure until nearly empty?', options: ['The valve controls it', 'More liquid boils to fill the space, so the vapour pressure holds', 'The can shrinks', 'The liquid gets warmer'], answer: 1, why: 'Vapour pressure depends on temperature, not how much liquid is left, as long as there is some liquid.' },
    { q: 'What happens to a pump-up sprayer\'s pressure as the tank empties?', options: ['It rises', 'It stays exactly the same', 'It falls, because the air expands', 'It becomes a vacuum at once'], answer: 2, why: 'Boyle\'s law: the same air fills a bigger space, so its pressure drops, until you pump again.' },
  ],
  reel: [
    { ms: 5000, caption: 'A perfume bulb is the true suction type: air at about 29 m/s across a tube lifts water 5 cm.', set: { cousin: 'bulb', used: 0.2 }, anim: { air: [15, 55] }, view: TALL, spin: 0 },
  ],
  build({ stage }) {
    let inst = { s: null };
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(5);
    const liqM = () => new THREE.MeshStandardMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0.6, roughness: 0.12, depthWrite: false });
    // --- bulb atomiser
    const A = new THREE.Group(); root.add(A);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.1, 40, 1, true), M.clear(0xdff2ff, 0.25)); jar.position.set(0, 1.05, 0); A.add(jar);
    const jarBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.08, 40), M.clear(0xdff2ff, 0.4)); jarBase.position.set(0, 0.04, 0); A.add(jarBase);
    const jL = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 1.3, 40), liqM()); jL.position.set(0, 0.73, 0); A.add(jL);
    A.add(beam([0, 0.25, 0], [0, 3.5, 0], 0.09, M.clear(0xffffff, 0.45)));
    const riseL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 12), new THREE.MeshStandardMaterial({ color: 0x6fb6ff, roughness: 0.2 })); riseL.geometry.translate(0, 0.5, 0); riseL.position.set(0, 1.38, 0); A.add(riseL);
    const air = rod(-3.4, 0.0, 0.18, 0.1, M.clear(0xffffff, 0.45), 20); air.position.y = 3.56; A.add(air);
    const bulb = sphere(0.95, M.matte(0xb96a5a)); bulb.position.set(-4.0, 3.56, 0); A.add(bulb);
    const airS = stream(A, 26, 0.05, [[-3.3, 3.56, 0], [-1.6, 3.56, 0], [0.0, 3.56, 0], [1.5, 3.7, 0]], { jitter: 0.04, seed: 4, color: 0xfff3c8 });
    const mistA = puffs(A, 180, 0.04, 0xbfe4ff, rnd);
    const LA = [stage.label('squeeze bulb', [-4.2, 4.85, 0], A), stage.label('<b>fast air: low pressure</b>', [-1.6, 4.35, 0], A, 'hot'), stage.label('air pushes liquid up', [1.6, 0.9, 0], A), stage.label('5 cm lift', [0.75, 2.5, 0], A)];
    // --- aerosol can (plain, cut open)
    const B = new THREE.Group(); root.add(B);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 5, 48, 1, true), M.clear(0xc8d2e0, 0.26)); can.position.y = 2.6; B.add(can);
    const canDome = new THREE.Mesh(new THREE.SphereGeometry(1.3, 40, 12, 0, TAU, 0, Math.PI / 2.6), M.clear(0xc8d2e0, 0.3)); canDome.scale.y = 0.45; canDome.position.y = 5.1; B.add(canDome);
    const canL = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.24, 1, 48), liqM()); canL.geometry.translate(0, 0.5, 0); canL.position.y = 0.14; B.add(canL);
    B.add(beam([0, 0.3, 0], [0, 5.5, 0], 0.07, M.clear(0xffffff, 0.5)));
    const valve = rod(-0.2, 0.2, 0.2, 0.2, M.metal(0xd7dbe2), 16); valve.rotation.z = Math.PI / 2; valve.position.y = 5.75; B.add(valve);
    const act = rod(0, 0.55, 0.12, 0.12, M.plastic(0x4b5570), 12); act.position.y = 6.0; B.add(act);
    const bub = puffs(B, 90, 0.05, 0xfff3c8, rnd);
    const mistB = puffs(B, 180, 0.04, 0xbfe4ff, rnd);
    const LB = [stage.label('<b>gas above: the stored push</b>', [-2.4, 5.0, 0], B, 'hot'), stage.label('product and propellant', [-2.1, 1.2, 0], B), stage.label('valve', [1.2, 6.5, 0], B)];
    // --- pump-up sprayer
    const C = new THREE.Group(); root.add(C);
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(1.35, 3.0, 8, 40), M.clear(0xd8e6d0, 0.26)); tank.position.y = 2.9; C.add(tank);
    const cL = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 1, 40), liqM()); cL.geometry.translate(0, 0.5, 0); cL.position.y = 0.72; C.add(cL);
    const rodP = beam([-0.5, 3.6, 0], [-0.5, 6.1, 0], 0.08, M.metal(0xc4ccda)); C.add(rodP);
    const hand = rod(-1.2, 0.2, 0.09, 0.09, M.plastic(0xff8f6b), 12); hand.position.set(-0.5, 6.1, 0); C.add(hand);
    C.add(beam([0.5, 1.0, 0], [0.5, 4.2, 0], 0.06, M.clear(0xffffff, 0.5)));
    C.add(tube([[0.5, 4.2, 0], [0.9, 4.8, 0], [2.0, 4.4, 0], [3.1, 2.2, 0], [4.0, 1.8, 0]], 0.06, M.matte(0x37405a), false, 50));
    C.add(rod(4.0, 6.3, 0.05, 0.05, M.metal(0xc4ccda), 10)); C.children[C.children.length - 1].position.y = 1.8;
    const lance = rod(6.3, 6.45, 0.09, 0.14, M.plastic(0x4b5570), 10); lance.position.y = 1.8; C.add(lance);
    const mistC = puffs(C, 180, 0.04, 0xbfe4ff, rnd);
    const LC = [stage.label('hand pump', [-1.9, 6.2, 0], C), stage.label('<b>squeezed air</b>', [-0.6, 5.2, 0], C, 'hot'), stage.label('liquid', [-1.9, 1.1, 0], C), stage.label('lance and nozzle', [5.4, 2.5, 0], C)];
    // --- charts
    const bA = board(root, 4.6, 3.1, 500, 337, (g, w, h) => {
      panelBg(g, w, h);
      const c = inst.s?.cousin || 'bulb', u = inst.s?.used ?? 0.2, K = inst.s?.kind || 'liq';
      if (c === 'bulb') {
        title(g, 'Suction against air speed', 'kPa below the air');
        const v0 = inst.s?.air ?? 40, top = 4.5;
        const ax = axes(g, w, h, { xMax: 80, yMax: top, xTicks: [0, 20, 40, 60, 80], yTicks: [0, 1, 2, 3, 4], xFmt: (v) => v + ' m/s', yFmt: (v) => v, xLabel: '' });
        const pts = []; for (let v = 0; v <= 80; v += 2) pts.push([v, 0.5 * 1.18 * v * v / 1000]); line(g, pts, ax.X, ax.Y, COL.cold, 4);
        const need = 997 * 9.81 * LIFT / 1000; g.strokeStyle = COL.hot; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(ax.x0, ax.Y(need)); g.lineTo(ax.x1, ax.Y(need)); g.stroke(); g.setLineDash([]);
        g.font = '17px sans-serif'; g.fillStyle = COL.hot; g.fillText('needed to lift water 5 cm', ax.x0 + 10, ax.Y(need) - 8);
        dot(g, ax.X(v0), ax.Y(Math.min(top, 0.5 * 1.18 * v0 * v0 / 1000)), COL.gold, 9);
      } else {
        title(g, 'Pressure as it empties', 'bar above the air');
        const ax = axes(g, w, h, { xMax: 1, yMax: 10, xTicks: [0, 0.5, 1], yTicks: [0, 2, 4, 6, 8, 10], xFmt: (v) => Math.round(v * 100) + '%', yFmt: (v) => v, xLabel: '' });
        const arr = (f) => { const a = []; for (let x = 0; x <= 1.001; x += 0.02) a.push([x, f(x)]); return a; };
        if (c === 'can') {
          line(g, arr((x) => canP(x).liq), ax.X, ax.Y, K === 'liq' ? COL.ok : 'rgba(92,225,169,.35)', K === 'liq' ? 5 : 3);
          line(g, arr((x) => canP(x).gas), ax.X, ax.Y, K === 'gas' ? COL.gold : 'rgba(242,193,78,.35)', K === 'gas' ? 5 : 3);
          g.font = '16px sans-serif'; g.fillStyle = COL.ok; g.fillText('liquefied gas', ax.X(0.05), ax.Y(P0_LIQ) - 8); g.fillStyle = COL.gold; g.fillText('compressed gas', ax.X(0.1), ax.Y(P0_GAS) + 2);
          dot(g, ax.X(u), ax.Y(K === 'liq' ? canP(u).liq : canP(u).gas), COL.hot, 9);
        } else {
          line(g, arr(pumpP), ax.X, ax.Y, COL.cold, 5); dot(g, ax.X(u), ax.Y(pumpP(u)), COL.hot, 9);
          g.font = '16px sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText('then pump again', ax.X(0.62), ax.Y(0.6) - 18);
        }
        g.font = '15px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('illustrative starting pressures', ax.x0 + 8, h - 14);
      }
    }, [4.55, 7.3, 0]);
    let rd = 0, tt = 0;
    inst = {
      s: null,
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); inst.s = s; tt += dt;
        const c = s.cousin; A.visible = c === 'bulb'; B.visible = c === 'can'; C.visible = c === 'pack';
        [...LA].forEach((l) => { l.visible = c === 'bulb'; }); LB.forEach((l) => { l.visible = c === 'can'; }); LC.forEach((l) => { l.visible = c === 'pack'; });
        // bulb: height reached: dP/(rho g), tube is 2.1 units = 5 cm above the liquid (1 unit about 2.4 cm)
        const dP = 0.5 * 1.18 * s.air * s.air, h = dP / (997 * 9.81), top = h >= LIFT;
        riseL.scale.y = Math.max(0.001, Math.min(1, h / LIFT) * 2.18);
        bulb.scale.setScalar(1 - 0.2 * clamp(s.air / 80, 0, 1) * (0.5 + 0.5 * Math.sin(tt * 5)));
        airS.step(s.air > 1 ? dt : 0, 0.3 + s.air / 60, clamp(s.air / 25, 0, 1));
        mistA.step(dt, c === 'bulb' && top ? 200 : 0, () => [0.1, 3.58, 0], () => { const a = rnd() * TAU, u = 3 + s.air / 14; return [u, u * 0.2 * rnd() * Math.cos(a), u * 0.2 * rnd() * Math.sin(a)]; }, 1.1, null, 1.6);
        // can
        const u = s.used;
        canL.scale.y = Math.max(0.02, 3.3 * (1 - u));
        const pCan = s.kind === 'liq' ? canP(u).liq : canP(u).gas;
        bub.step(dt, c === 'can' && s.kind === 'liq' && u < 0.97 ? 22 : 0, () => { const a = rnd() * TAU, r = rnd() * 1.05; return [r * Math.cos(a), 0.3 + rnd() * 0.5 * canL.scale.y, r * Math.sin(a)]; }, () => [0, 0.55, 0], 3 * (1 - u) + 0.8);
        mistB.step(dt, c === 'can' && pCan > 0.2 ? 90 + 40 * pCan : 0, () => [0.6, 6.0, 0], () => { const a = rnd() * TAU, v = 2.2 + pCan; return [v, v * 0.13 * rnd() * Math.cos(a), v * 0.13 * rnd() * Math.sin(a)]; }, 1.1, null, 1.5);
        // pump-up
        cL.scale.y = Math.max(0.03, 3.5 * (1 - u));
        const pp = pumpP(u); hand.position.y = 6.1 - 0.25 * Math.max(0, Math.sin(tt * 2));
        mistC.step(dt, c === 'pack' && pp > 0.2 ? 60 + 60 * pp : 0, () => [6.5, 1.8, 0], () => { const a = rnd() * TAU, v = 1 + pp; return [v, v * 0.2 * rnd() * Math.cos(a) - 0.2, v * 0.2 * rnd() * Math.sin(a)]; }, 1.1, null, 1.6);
        A.position.x = 0.8; B.position.x = 0.4; B.scale.setScalar(0.85); C.position.x = -2.2; C.scale.setScalar(0.85);
        placeBoards(stage, [bA], { tall: [[1, 11, 0]], tallScale: 1.95 });
        const nar = stage.host.clientWidth < 560 && !inReel(); if (nar) bA.mesh.visible = false; stage.setShift(0, nar ? -0.18 : 0);
        rd += dt; if (rd > 0.15) { rd = 0; bA.redraw(); }
      },
      readout(s) {
        if (s.cousin === 'bulb') { const dP = 0.5 * 1.18 * s.air * s.air, h = dP / (997 * 9.81) * 100; return `<div class="big">${h >= LIFT * 100 ? 'Liquid reaches the air and tears up' : 'Not fast enough yet'}</div><div class="row"><span>Suction</span><b>${(dP / 1000).toFixed(2)} kPa</b></div><div class="row"><span>Water lifted</span><b>${h.toFixed(1)} cm</b></div><div class="row"><span>Speed needed for 5 cm</span><b>${speedForLift(LIFT).toFixed(0)} m/s</b></div><small>½ρv² against ρgh, ignoring losses in the tube.</small>`; }
        if (s.cousin === 'can') { const p = s.kind === 'liq' ? canP(s.used).liq : canP(s.used).gas; return `<div class="big">${p.toFixed(1)} bar above the air</div><div class="row"><span>Holding</span><b>${s.kind === 'liq' ? 'liquefied gas' : 'compressed gas'}</b></div><div class="row"><span>Used up</span><b>${Math.round(s.used * 100)}%</b></div><small>${isPhone() ? '' : 'Illustrative pressures. Cans are sealed pressure vessels: follow the label, and never heat or pierce one.'}</small>`; }
        const p = pumpP(s.used); return `<div class="big">${p.toFixed(1)} bar above the air</div><div class="row"><span>Used up</span><b>${Math.round(s.used * 100)}%</b></div><div class="row"><span>Starting pressure here</span><b>3 bar</b></div><small>${isPhone() ? '' : 'Boyle\'s law on the air pocket, in a tank starting 30% air. Standards put use at about 3 bar, with a safety limit under 5 bar.'}</small>`;
      },
    };
    void lerp;
    return inst;
  },
};
