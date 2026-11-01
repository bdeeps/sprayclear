// Chapter 1: a generic trigger sprayer taken apart. Scale: 1 unit = 15 mm.
import { THREE, M, exploder, approach } from '../kit.js';
import { makeSprayer, PUMP, link, inReel } from '../spray.js';

const VIEW = { pos: [0.9, 6.0, 15.5], target: [0.6, 5.6, 0] };
const TALL = { pos: [0.5, 6, 9.4], target: [0.5, 5.2, 0] };

export default {
  id: 'anatomy',
  short: 'Inside a sprayer',
  title: 'Inside a trigger sprayer',
  subtitle: 'About a dozen small parts: a piston, a spring, two one-way valves and a nozzle that spins water.',
  view: VIEW,
  learn: `<p>A plant mister, a glass cleaner bottle and a barber's water sprayer all share one small machine. It screws onto the bottle, and it has no battery or stored gas. All the energy comes from your finger.</p>
    <p>Your <b>trigger</b> is a lever. It pushes a <b>piston</b> into a small <b>cylinder</b>, and a <b>spring</b> pushes it back. Two tiny balls act as <b>check valves</b>, one-way gates: one lets liquid in from the <b>dip tube</b>, the other lets it out towards the <b>nozzle</b>.</p>
    <p>At the front, a <b>swirl chamber</b> spins the liquid before it leaves, and the <b>nozzle cap</b> you twist chooses spray, stream or off. A small <b>air vent</b> lets air into the bottle to replace what you spray. The <b>filter</b> at the foot of the tube stops bits from jamming the balls, and the <b>gasket</b> seals the screw cap.</p>
    <p>A fine perfume pump is the same idea made tiny: see ${link('perfumeclear', 'PerfumeClear', 'bottle')}. The soft valve and air vent on a water bottle are in ${link('sipperclear', 'SipperClear')}.</p>
    <p class="tip"><b>Try it:</b> slide "Take it apart", then squeeze the trigger slider and watch the piston slide into the cylinder.</p>`,
  terms: [
    { t: 'Dip tube', d: 'The thin tube that reaches from the pump to the bottom of the bottle.' },
    { t: 'Check valve', d: 'A one-way gate. Here, a small ball that flow lifts off its seat in one direction and presses shut in the other.' },
    { t: 'Piston', d: 'A plug that slides in a cylinder, changing the space inside.' },
    { t: 'Swirl chamber', d: 'A tiny room just behind the nozzle hole where liquid enters from the side and spins.' },
    { t: 'Air vent', d: 'A small hole that lets air into the bottle to take the place of the liquid sprayed.' },
    { t: 'Gasket', d: 'A soft ring squeezed between cap and bottle neck to seal them.' },
  ],
  defaults: { explode: 0.45, pull: 0 },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'pull', type: 'range', label: 'Squeeze the trigger', min: 0, max: 1, step: 0.01, ends: ['released', 'full pull'], fmt: (v) => (v * PUMP.stroke * 1000).toFixed(1) + ' mm of piston' },
  ],
  quiz: [
    { q: 'Where does the energy for a trigger spray come from?', options: ['A gas stored in the bottle', 'Your finger', 'A tiny battery', 'The liquid itself'], answer: 1, why: 'A trigger sprayer stores nothing. Each stroke is powered by your squeeze, and the spring stores just enough of it to pull the piston back.' },
    { q: 'What are the two small balls for?', options: ['They mix the liquid', 'They are one-way valves', 'They make the clicking noise', 'They weigh the tube down'], answer: 1, why: 'Each ball sits on a seat. Flow one way lifts it, flow the other way presses it shut.' },
    { q: 'Why does the bottle need an air vent?', options: ['To cool the liquid', 'To let air replace the liquid sprayed, so the bottle does not collapse', 'To make the mist finer', 'To let the smell out'], answer: 1, why: 'Every millilitre that leaves must be replaced. Without air coming in, the pressure in the bottle drops and the walls dent inward.' },
  ],
  reel: [
    { ms: 5600, caption: 'A trigger sprayer is a tiny hand pump: a piston, a spring, two one-way balls and a nozzle that spins water.', set: { pull: 0 }, anim: { explode: [0, 0.7] }, view: TALL, spin: 0.2 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const S = makeSprayer({ h: 6, r: 2.0 }); root.add(S.g);
    const P = S.P, Y = S.lift;
    const ex = exploder([
      { obj: P.shroud, off: [0, 2.2, -4] }, { obj: P.trigger, off: [3.6, -0.8, 0] }, { obj: P.piston, off: [3.2, 3.0, 0] }, { obj: P.nozzle, off: [4.2, 0.8, 0] }, { obj: P.swirl, off: [2.6, 2.6, 0] },
      { obj: P.spring, off: [-3.4, 2.6, 0] }, { obj: P.cylinder, off: [-3.2, 1.2, 0] }, { obj: P.chAir, off: [-3.2, 1.2, 0] }, { obj: P.chLiq, off: [-3.2, 1.2, 0] }, { obj: P.outlet, off: [-1, 4.5, 0] }, { obj: P.outLiq, off: [-1, 4.5, 0] }, { obj: P.outBall, off: [-1, 5.0, 0] }, { obj: P.outSeat, off: [-1, 4.7, 0] },
      { obj: P.inletTube, off: [-4.4, -0.8, 0] }, { obj: P.inLiq, off: [-4.4, -0.8, 0] }, { obj: P.inBall, off: [-4.4, -0.2, 0] }, { obj: P.inSeat, off: [-4.4, -0.6, 0] },
      { obj: P.vent, off: [3.0, -1.2, 0] }, { obj: P.cap, off: [0, 0.9, 0] }, { obj: P.gasket, off: [0, 0.35, 0] },
      { obj: P.dip, off: [4.8, -0.5, 0] }, { obj: P.dipLiq, off: [4.8, -0.5, 0] }, { obj: P.filter, off: [4.8, -0.5, 0] },
    ]);
    const lb = (html, o, off, hot) => { const l = stage.label(html, off, o, hot ? 'hot' : ''); return l; };
    const L = [
      lb('<b>nozzle cap</b>', P.nozzle, [1.0, 0.45, 0], true), lb('swirl chamber', P.swirl, [1.6, 0.9, 0]), lb('<b>trigger</b>', P.trigger, [1.25, -2.2, 0], true),
      lb('<b>piston</b>', P.piston, [1.2, 0.8, 0], true), lb('return spring', P.spring, [-0.3, 0.75, 0]), lb('cylinder', P.cylinder, [-1.1, -0.9, 0]),
      lb('<b>outlet valve</b>', P.outBall, [-2.0, 0.55, 0], true), lb('<b>inlet valve</b>', P.inBall, [-2.4, 0.0, 0], true), lb('air vent', P.vent, [1.35, -1.25, 0]),
      lb('screw cap', P.cap, [-2.6, -0.65, 0]), lb('gasket', P.gasket, [-2.6, -0.65, 0]), lb('dip tube', P.dip, [0.95, -3.2, 0]), lb('filter', P.filter, [0.75, 0.1, 0]), lb('bottle', P.bottle, [2.8, -4.4, 0]),
    ];
    let k = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        k = approach(k, s.explode, 6, dt); ex(k);
        S.set({ pull: s.pull, inOpen: false, outOpen: s.pull > 0.04 && s.pull < 0.98, chFill: 1, dipFill: 1, outFill: 1 });
        // set() moves the piston, so add its exploded offset back
        P.piston.position.add(new THREE.Vector3(3.2, 3.0, 0).multiplyScalar(k * k * (3 - 2 * k)));
        P.piston.position.x += 0;
        P.trigger.position.set(2.2 + 3.6 * k * k * (3 - 2 * k), 0.72 - 0.8 * k * k * (3 - 2 * k), 0);
        P.inBall.position.x = S.NECK - 4.4 * k * k * (3 - 2 * k); P.outBall.position.x = S.NECK - 1 * k * k * (3 - 2 * k);
        const e = k * k * (3 - 2 * k);
        P.inBall.position.y += -0.2 * e; P.outBall.position.y += 5.0 * e;
        const nar = stage.host.clientWidth < 560;
        const apart = k > 0.3;
        [1, 4, 5, 8, 10].forEach((i) => { L[i].visible = !nar && apart; });
        L[12].visible = !nar;
        stage.setShift(0, nar && !inReel() ? -0.2 : 0);
        void Y;
      },
      readout: (s) => `<div class="big">One stroke, about ${PUMP.V.toFixed(1)} mL</div>
        <div class="row"><span>Piston</span><b>${(PUMP.d * 1000).toFixed(0)} mm wide</b></div>
        <div class="row"><span>Piston travel</span><b>${(s.pull * PUMP.stroke * 1000).toFixed(1)} of ${(PUMP.stroke * 1000).toFixed(0)} mm</b></div>
        <div class="row"><span>Trigger lever</span><b>${PUMP.lever} to 1</b></div>
        <small>A generic model. Makers list about 0.6 to 1.2 mL per stroke.</small>`,
    };
  },
};
void M;
