// Chapter 2: the pump stroke. A slow-motion cut-away with a trigger you pull. The bottle and tube are drawn
// short; the sums use an 18 cm, 3.5 mm tube (1.7 mL).
// P = (F x lever - spring - friction) / piston area. Volume = area x stroke x 0.95. Priming: the pump
// removes about 80% of a stroke of air each pull (trapped air re-expands). Vent off: Boyle's law on 100 mL.
import { THREE, M, approach, arrow } from '../kit.js';
import { makeSprayer, PUMP, pressureOf, minForce, suctionPa, liftPa, primePulls, bottleDrop, nozzle, LIQ, COL, board, panelBg, title, axes, line, dashH, stream, rng, placeBoards, inReel, isPhone, link, clamp, TAU, mistCloud } from '../spray.js';

const VIEW = { pos: [3.6, 5.3, 13.4], target: [3.6, 5.0, 0] };
const TALL = { pos: [1.2, 10, 11], target: [1.2, 9.5, 0] };

export default {
  id: 'stroke',
  short: 'The pump stroke',
  title: 'The pump stroke',
  subtitle: 'Squeeze: the pressure shuts one ball and opens the other. Let go: the spring pulls and the air outside pushes liquid up.',
  view: VIEW,
  learn: `<p>A trigger sprayer is a <b>positive-displacement pump</b>: each stroke shoves out a fixed amount of liquid, however fast you go. It does <b>not</b> work by air blowing across a tube. That is its cousin, the old perfume bulb.</p>
    <p><b>Squeeze.</b> The lever multiplies your finger's force about 3 times and drives the piston. A 20 N squeeze becomes 60 N. Take away about 8 N for the spring and friction, spread the rest over a 113 mm² piston, and you get about <b>4.6 bar</b>, more than a car tyre's air. That pressure presses the <b>inlet ball</b> shut and lifts the <b>outlet ball</b>, so the only way out is the nozzle.</p>
    <p><b>Let go.</b> The spring pushes the piston back. The cylinder's pressure falls below the air's. The outlet ball drops shut. Nothing sucks the water up: the <b>air pressing on the liquid in the bottle pushes it</b> up the tube, past the inlet ball, as in ${link('pressureclear', 'PressureClear')}. Lifting 18 cm takes under 2 kPa, a very small pull.</p>
    <p><b>Why the first pulls do nothing.</b> A dry pump is full of air. Air squashes like a spring, and the tube holds nearly 2 mL of it, so it takes about three pulls to move it out. That is <b>priming</b>.</p>
    <p><b>The vent.</b> As the piston goes in, its skirt uncovers a small hole in many designs, and air slips into the bottle. Block it and the bottle's pressure falls with every pull until the walls dent inward, the same reason a bottle needs a vent in ${link('sipperclear', 'SipperClear')}.</p>
    <p class="tip"><b>Try it:</b> empty the pump, pull slowly and count the pulls before water reaches the nozzle. Then turn off the vent.</p>`,
  terms: [
    { t: 'Positive-displacement pump', d: 'A pump that moves a fixed amount of liquid each stroke by squeezing a closed space.' },
    { t: 'Priming', d: 'Getting the air out of a pump and tube so it holds liquid and can build pressure.' },
    { t: 'Lever ratio', d: 'How many times a lever multiplies force: here, about 3, since the finger is 3 times as far from the pivot as the piston rod.' },
    { t: 'Bar', d: 'A unit of pressure. 1 bar is about the pressure of the air around you.' },
    { t: 'Atmospheric pressure', d: 'The weight of the air pressing on everything, about 101 kPa at sea level. It is what actually lifts the liquid.' },
  ],
  defaults: { force: 20, slow: 0.35, auto: true, pull: 0, vent: true },
  controls: [
    { key: 'force', type: 'range', label: 'How hard you squeeze', min: 2, max: 40, step: 1, ends: ['2 N', '40 N'], fmt: (v) => v.toFixed(0) + ' N', hint: '10 N is about the weight of a 1 kg bag of sugar.' },
    { key: 'slow', type: 'range', label: 'Slow motion', min: 0.1, max: 1, step: 0.05, ends: ['very slow', 'quicker'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'auto', type: 'toggle', label: 'Keep pumping' },
    { key: 'pull', type: 'range', label: 'Pull it yourself (turn off "Keep pumping")', min: 0, max: 1, step: 0.01, ends: ['released', 'full pull'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'vent', type: 'toggle', label: 'Air vent open' },
    { key: 'go', type: 'buttons', label: 'Your move', items: [{ label: 'Empty the pump', act: (s, inst) => inst.empty() }, { label: 'Fresh bottle', act: (s, inst) => inst.fresh() }] },
  ],
  quiz: [
    { q: 'What pushes the liquid up the dip tube when you let go?', options: ['A spring in the tube', 'The air pressing on the liquid in the bottle', 'The liquid\'s own lift', 'Air blowing across the top'], answer: 1, why: 'The spring lowers the pressure in the cylinder, and then the higher pressure of the air in the bottle pushes the liquid up past the inlet ball.' },
    { q: 'You squeeze with 20 N on a 3 to 1 lever. About what force reaches the piston before spring and friction?', options: ['7 N', '20 N', '60 N', '600 N'], answer: 2, why: 'A lever multiplies force by its ratio: 20 × 3 = 60 N. The finger moves 3 times as far in exchange.' },
    { q: 'Why does a new sprayer need a few pulls before it sprays?', options: ['The spring has to warm up', 'The pump first has to move out the air in the tube and cylinder', 'The nozzle is blocked with wax', 'The bottle has to fill with air'], answer: 1, why: 'Air squashes easily and the pump only moves about a millilitre per pull, so it takes a few pulls to replace nearly 2 mL of air with liquid.' },
  ],
  reel: [
    { ms: 5600, caption: 'A dry pump only moves air, so the first few pulls just draw water up the tube. That is priming.', set: { force: 20, slow: 0.5, auto: true, vent: true }, act: (s, i) => i.empty(), view: TALL, spin: 0 },
    { ms: 5600, caption: 'Squeeze: a 3 to 1 lever turns 20 newtons into about 4.6 bar, which shuts the inlet ball and opens the outlet.', set: { force: 20, slow: 0.3, auto: true, vent: true }, act: (s, i) => i.fresh(), view: TALL, spin: 0 },
    { ms: 5200, caption: 'Let go: the spring lowers the pressure, and the air on the bottle\'s liquid pushes about 1 mL up the tube.', set: { force: 20, slow: 0.22, auto: true, vent: true }, view: TALL, spin: 0 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const S = makeSprayer({ h: 3.4, r: 1.75, level: 0.75 }); root.add(S.g);
    const rnd = rng(11), Y = S.lift;
    const mist = mistCloud(root, 220, 0.05, 0xa8d8ff, rnd);
    const arm = (a, b) => [[a[0], a[1], 0], [b[0], b[1], 0]];
    const upTube = stream(S.g, 14, 0.055, [...arm([S.NECK, S.dipY1], [S.NECK, -1.0]), [S.NECK, -0.45, 0], [S.NECK + 0.0, -0.1, 0]], { jitter: 0.015, seed: 3, color: 0xdff2ff });
    const toNoz = stream(S.g, 16, 0.055, [[S.NECK, 0.2, 0], [S.NECK, 0.7, 0], [S.NECK + 0.15, 1.0, 0], [1.2, 1.0, 0], [3.1, 1.0, 0]], { jitter: 0.015, seed: 5, color: 0xdff2ff });
    const air = stream(S.g, 10, 0.05, [[1.05, -0.5, 0.2], [0.85, -0.44, 0], [0.72, -0.62, 0], [0.42, -0.85, 0], [0.38, -1.5, 0]], { jitter: 0.01, seed: 7, color: 0xffd98a });
    const fA = arrow(0xffb547, 1, 0.3, 0.06); fA.rotation.z = Math.PI / 2; root.add(fA);
    const fB = arrow(0xff7a59, 1, 0.3, 0.06); fB.rotation.z = Math.PI / 2; fB.position.set(1.0, Y, 0.9); root.add(fB);
    const lab = {
      inV: stage.label('inlet: <b>shut</b>', [-1.75, -0.7, 0.3], S.g),
      outV: stage.label('outlet: <b>shut</b>', [-1.75, 0.72, 0.3], S.g),
      cy: stage.label('cylinder', [0.25, -0.75, 0.6], S.g),
      vent: stage.label('air vent', [1.3, -1.0, 0.3], S.g),
      fin: stage.label('finger', [3.0, -2.3, 0], S.g, 'hot'),
    };
    let k = 0, pk = 0, phase = 'rest', wait = 0.5, pulls = 0, airLeft = 0, chFill = 1, bottleN = 0, Pc = 0, down = false, F = 20, t = 0;
    const hist = [];
    const bA = board(root, 5, 3.2, 500, 320, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Cylinder pressure', 'bar above air');
      const top = Math.max(2, pressureOf(F) / 1e5 * 1.25);
      const ax = axes(g, w, h, { x0: 46, y0: h - 22, y1: 54, x1: w - 14, xMax: 8, yMin: -0.5, yMax: top, xTicks: [], yTicks: [0, Math.round(top / 2), Math.round(top)].filter((v, i, a) => a.indexOf(v) === i), yFmt: (v) => v, xLabel: '' });
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(ax.x0, ax.Y(0)); g.lineTo(ax.x1, ax.Y(0)); g.stroke(); g.setLineDash([]);
      g.font = '15px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('the air around you', ax.x1 - 130, ax.Y(0) + 15);
      const now = hist.length ? hist[hist.length - 1][0] : 0;
      line(g, hist.map(([a, p]) => [8 - (now - a), p]).filter(([x]) => x >= 0), ax.X, ax.Y, COL.hot, 4);
      void 0;
    }, [8.6, 8.9, 0]);
    const bB = board(root, 5, 3.2, 500, 320, (g, w, h) => {
      panelBg(g, w, h); title(g, 'The sum');
      const Fp = F * PUMP.lever, P = pressureOf(F);
      g.font = '24px sans-serif'; const rows = [
        ['Your squeeze', F.toFixed(0) + ' N'], [`× lever of ${PUMP.lever}`, Fp.toFixed(0) + ' N'], ['− spring and friction', (PUMP.spring + PUMP.friction) + ' N'],
        ['÷ piston area', '113 mm²'], ['= pressure', (P / 1e5).toFixed(1) + ' bar'], ['One stroke', PUMP.V.toFixed(2) + ' mL'],
      ];
      rows.forEach(([a, b], i) => { const y = 78 + i * 43; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(a, 28, y); g.fillStyle = i === 4 ? COL.hot : COL.text; g.font = 'bold 24px sans-serif'; g.fillText(b, w - 30 - g.measureText(b).width, y); g.font = '24px sans-serif'; });
    }, [8.6, 1.5, 0]);
    let rd = 0;
    const inst = {
      empty() { airLeft = PUMP.tube + PUMP.airDead; chFill = 0; pulls = 0; },
      fresh() { airLeft = 0; chFill = 1; pulls = 0; bottleN = 0; },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); t += dt; F = s.force;
        const can = F > minForce();
        if (s.auto) {
          const r = s.slow;
          if (phase === 'rest') { wait -= dt * r * 2.6; if (wait <= 0) phase = 'in'; }
          else if (phase === 'in') { k += dt * r * 2.2 * (can ? 1 : 0.15); if (k >= 1) { k = 1; phase = 'out'; } if (!can && k > 0.12) { k = 0.12; phase = 'out'; } }
          else if (phase === 'out') { k -= dt * r * 1.6; if (k <= 0) { k = 0; phase = 'rest'; wait = 0.5; } }
        } else k = approach(k, s.pull, 7, dt);
        const dk = (k - pk), comp = dk > 1e-4, suck = dk < -1e-4;
        if (pk < 0.9 && k >= 0.9) pulls++;
        const primed = airLeft <= 0;
        // Fill: on the way out, air or liquid comes in; on the way in, it is pushed out.
        if (suck) {
          const moved = -dk * PUMP.V;
          if (airLeft > 0) { airLeft = Math.max(0, airLeft - moved * 0.8); if (airLeft <= PUMP.airDead * 0.5) chFill = Math.min(1, chFill + -dk * 1.2); }
          else chFill = Math.min(1, chFill + -dk * 1.4);
          if (s.vent === false) bottleN += -dk * 0; else bottleN = 0;
        }
        if (comp && !s.vent) bottleN += dk;
        const P = pressureOf(F);
        const target = comp ? (primed ? P : Math.min(P, 0.4e5) * 0.6) : suck ? -suctionPa() : 0;
        Pc = approach(Pc, target, 16, dt); if (comp || suck) down = comp; else down = false;
        hist.push([t, Pc / 1e5]); if (hist.length > 320) hist.shift();
        S.set({ pull: k, inOpen: suck, outOpen: comp && (primed ? P > PUMP.crack : true), chFill: primed ? 1 : chFill, dipFill: 1 - clamp((airLeft - PUMP.airDead) / PUMP.tube, 0, 1), outFill: primed ? 1 : 0 });
        // the bottle dents when the vent is shut
        const dP = s.vent ? 0 : bottleDrop(bottleN), dent = clamp(dP / 15000, 0, 1);
        S.P.bottle.scale.set(1 - 0.16 * dent, 1, 1 - 0.22 * dent); S.P.liquid.scale.x = 1 - 0.16 * dent; S.P.liquid.scale.z = 1 - 0.22 * dent;
        S.P.vent.material.opacity = s.vent ? 0.75 : 0.15;
        const speed = s.slow;
        upTube.step(suck ? dt : 0, 1.0 * speed + 0.4, suck ? 1 : 0, () => new THREE.Color(primed ? 0xdff2ff : 0xffe8b8));
        toNoz.step(comp ? dt : 0, 1.6 * speed + 0.4, comp ? 1 : 0, () => new THREE.Color(primed ? 0xdff2ff : 0xffe8b8));
        air.step(suck && s.vent ? dt : 0, 0.8, suck && s.vent ? 1 : 0);
        // the mist: real speeds would be a blur, so it is shown slowed
        if (comp && primed && P > PUMP.crack) {
          const noz = nozzle(P, LIQ.water, 1), half = noz.cone / 2 * Math.PI / 180;
          for (let i = 0; i < 4; i++) { const a = rnd() * TAU, sh = half * (0.85 + 0.15 * rnd()); const v = noz.v * 0.32; mist.emit([3.3, Y + 1.0, 0], [v * Math.cos(sh), v * Math.sin(sh) * Math.cos(a), v * Math.sin(sh) * Math.sin(a)], 60 + 200 * rnd() * rnd()); }
        }
        mist.step(dt, { scale: 1, slow: 0.35, floor: 0, sz: (u) => 0.5 + Math.min(1, u / 200) });
        // arrows: finger on the trigger, piston force
        const fing = F / 40;
        fA.set(0.5 + 1.6 * fing); fA.visible = comp || (k > 0.05 && !suck); fA.position.set(3.4 + 1.6 * fing, Y - 1.6 + (0.5) * k, 0.65); fA.position.x = 2.2 + 0.9 + 1.6 * fing - 1.45 * k;
        fB.set(0.5 + 2.2 * fing); fB.visible = comp; fB.position.x = 1.2 + 2.2 * fing - 0.6 * k;
        lab.inV.element.innerHTML = suck ? 'inlet: <b>open</b>' : 'inlet: <b>shut</b>';
        lab.outV.element.innerHTML = comp ? 'outlet: <b>open</b>' : 'outlet: <b>shut</b>';
        lab.fin.position.set(3.0 - 1.4 * k, -2.3 + 0.6 * k, 0);
        placeBoards(stage, [bA, bB], { tall: [[1.2, 16.7, 0], [1.2, 10.2, 0]], tallScale: 2 });
        if (stage.host.clientWidth < 560 && !inReel()) { bA.mesh.visible = bB.mesh.visible = false; lab.cy.visible = lab.vent.visible = false; stage.setShift(0, -0.2); } else { lab.cy.visible = lab.vent.visible = true; stage.setShift(0, 0); }
        pk = k;
        rd += dt; if (rd > 0.08) { rd = 0; bA.redraw(); bB.redraw(); }
        inst._p = { primed, airLeft, bottleN, comp, suck, pulls, dP };
      },
      readout(s) {
        const p = inst._p || { primed: true, airLeft: 0, pulls: 0, dP: 0 }, P = pressureOf(s.force), n = nozzle(P);
        const weak = s.force <= minForce();
        return `<div class="big">${weak ? 'Too gentle to open the outlet' : p.primed ? `${(P / 1e5).toFixed(1)} bar in the cylinder` : 'Priming: moving air'}</div>
          <div class="row"><span>At the piston</span><b>${(s.force * PUMP.lever).toFixed(0)} N</b></div>
          <div class="row"><span>One stroke</span><b>${PUMP.V.toFixed(2)} mL</b></div>
          ${weak ? '' : `<div class="row"><span>A full stroke lasts</span><b>${n.stroke.toFixed(2)} s</b></div>`}
          <div class="row"><span>${p.primed ? 'Pulls so far' : 'Air left in the pump'}</span><b>${p.primed ? p.pulls : p.airLeft.toFixed(1) + ' mL'}</b></div>
          <div class="row"><span>Spring pulls / lift needs</span><b>${(suctionPa() / 1000).toFixed(0)} / ${(liftPa() / 1000).toFixed(1)} kPa</b></div>
          ${s.vent ? `<div class="row"><span>Pulls to prime</span><b>about ${primePulls()}</b></div>` : `<div class="row"><span>Bottle below the air</span><b>${(p.dP / 1000).toFixed(1)} kPa</b></div>`}
          ${isPhone() ? '' : `<small>Typical sizes, bottle drawn short. Needs at least ${minForce().toFixed(0)} N.</small>`}`;
      },
    };
    void M; void dashH;
    return inst;
  },
};
