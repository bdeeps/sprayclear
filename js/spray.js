// Shared parts for SprayClear: the trigger-pump sums, the nozzle and drop models, liquids, a generic
// cut-away trigger sprayer, and chart boards. Chart and 3D helpers follow PerfumeClear's.
//
// Sources and status of every number here:
//  - Piston 12 mm, stroke 9 mm, lever 3:1, spring 5 N, friction 3 N, 0.5 mm orifice: ASSUMED typical sizes,
//    chosen so one stroke gives about 1 mL. Retailer specs (The Cary Company trigger sprayer guide) list
//    general-purpose triggers at about 0.6 to 1.2 mL per stroke; fine-mist triggers about 0.2 to 0.25 mL.
//  - Exit speed v = sqrt(2P/rho): Bernoulli, the same sum as PerfumeClear js/chapters/bottle.js, which
//    has a 5 mm piston, 4 N spring, 0.25 mm hole, Cd 0.3, 800 kg/m3 (20 N gives 8.2 bar, 45 m/s).
//  - Discharge coefficient 0.3 for a pressure-swirl nozzle: PerfumeClear. 0.75 for a plain jet: typical.
//  - Viscous loss: Hagen-Poiseuille through a 2 mm long, 0.5 mm passage, in series with the nozzle.
//  - Drop size in a spray: Lefebvre's correlation for pressure-swirl atomisers,
//    SMD = 2.25 sigma^0.25 mu^0.25 mdot^0.25 dP^-0.5 rhoAir^-0.25 (Atomization and Sprays, 1989).
//    Quoted from memory; the source could not be opened. Use as a labelled trend, not a spec.
//  - Cone: Rizk and Lefebvre's empirical form, 2theta = 6 K^-0.15 (dP d^2 rho / mu^2)^0.11, K = 0.5 assumed.
//    Film: Rizk and Lefebvre, t = 3.66 (d mdot mu / (rho dP))^0.25. Same caveat.
//  - Plain jet: Rayleigh's drop, 1.89 times the jet's diameter; fastest wave 4.51 diameters long.
//  - Drag: sphere, Cd = 24/Re + 6/(1 + sqrt Re) + 0.4 (White), as SprinklerClear js/sprinkler.js fly().
//  - Evaporation: d-squared law, K = 8 D (rho_surface - rho_air) / rho_liquid, with the surface at the
//    wet-bulb temperature (Stull 2011) and Magnus vapour pressure.
//  - Liquid properties: handbook values at about 20 C from memory; the oil and gel are illustrative.
import { THREE, M, box, beam, sphere, arrow, clamp, lerp, rod, spring, tube, torus } from './kit.js';

export const TAU = Math.PI * 2;
export const RHO_AIR = 1.18, MU_AIR = 1.84e-5, G = 9.81, ATM = 101325, BAR = 1e5;

// ---------------------------------------------------------------- the pump
export const PUMP = { d: 0.012, stroke: 0.009, lever: 3, spring: 5, friction: 3, crack: 0.3e5, eta: 0.95, airDead: 0.3, tube: 1.7, tubeH: 0.18 };
PUMP.A = Math.PI * PUMP.d * PUMP.d / 4;                 // m2, 113 mm2
PUMP.V = PUMP.A * PUMP.stroke * PUMP.eta * 1e6;         // mL per stroke, about 0.97
export const pressureOf = (F) => Math.max(0, F * PUMP.lever - PUMP.spring - PUMP.friction) / PUMP.A;   // Pa above the air
export const minForce = () => (PUMP.spring + PUMP.friction + PUMP.crack * PUMP.A) / PUMP.lever;
export const suctionPa = () => (PUMP.spring - PUMP.friction) / PUMP.A;    // what the spring alone can pull
export const liftPa = (h = PUMP.tubeH) => 997 * G * h;
export const primePulls = () => Math.ceil((PUMP.tube + PUMP.airDead) / (PUMP.V * 0.8));
export const bottleDrop = (n, air = 100) => ATM * (1 - air / (air + n * PUMP.V));   // Boyle: no vent, Pa below the air

// ---------------------------------------------------------------- liquids
// rho kg/m3, sigma N/m, mu Pa.s, evap = how much faster than water it evaporates (sanitiser: estimated).
export const LIQ = {
  water: { n: 'Water', short: 'Water', rho: 997, sigma: 0.072, mu: 0.001, evap: 1, col: 0x6fb6ff },
  cleaner: { n: 'Soapy cleaner', short: 'Soapy', rho: 1000, sigma: 0.035, mu: 0.0012, evap: 1, col: 0x7fe0c0 },
  sanitiser: { n: 'Liquid sanitiser (70% alcohol)', short: 'Sanitiser', rho: 870, sigma: 0.025, mu: 0.0022, evap: 8, col: 0xc9d8ff },
  oil: { n: 'Cooking oil', short: 'Oil', rho: 920, sigma: 0.032, mu: 0.065, evap: 0, col: 0xf2c14e },
  gel: { n: 'Thick gel', short: 'Gel', rho: 1000, sigma: 0.05, mu: 2, evap: 0.5, col: 0xa8f0d8 },
};
export const liqOpts = Object.entries(LIQ).map(([v, m]) => ({ v, label: m.short }));

// ---------------------------------------------------------------- the nozzle
const D0 = 0.0005, L0 = 0.002, A0 = Math.PI * D0 * D0 / 4;
// s = swirl: 0 straight jet ("stream"), 1 full swirl ("spray").
export function nozzle(P, liq = LIQ.water, s = 1) {
  const Cd = lerp(0.75, 0.3, s), a = 0.5 * liq.rho / (Cd * A0 * Cd * A0), b = 128 * liq.mu * L0 / (Math.PI * Math.pow(D0, 4));
  const Q = P > 0 ? (-b + Math.sqrt(b * b + 4 * a * P)) / (2 * a) : 0;     // solve a Q^2 + b Q = P
  const vIdeal = Math.sqrt(2 * P / liq.rho), Qinv = Cd * A0 * vIdeal, v = Qinv > 0 ? vIdeal * Q / Qinv : 0;
  const mdot = liq.rho * Q, Re = liq.rho * v * D0 / liq.mu, Oh = liq.mu / Math.sqrt(liq.rho * liq.sigma * D0);
  const We = liq.rho * v * v * D0 / liq.sigma;
  const film = P > 0 ? 3.66 * Math.pow(D0 * mdot * liq.mu / (liq.rho * P), 0.25) : 0;
  const coneRaw = P > 0 ? 6 * Math.pow(0.5, -0.15) * Math.pow(P * D0 * D0 * liq.rho / (liq.mu * liq.mu), 0.11) : 0;
  const cone = Math.min(90, coneRaw * s * (Re < 50 ? Re / 50 : 1));        // full angle, degrees
  const rayleigh = 1.89 * D0 * 1e6;                                        // um
  const lef = P > 0 ? 2.25 * Math.pow(liq.sigma, 0.25) * Math.pow(liq.mu, 0.25) * Math.pow(mdot, 0.25) * Math.pow(P, -0.5) * Math.pow(RHO_AIR, -0.25) * 1e6 : rayleigh;
  // Lefebvre's rule holds only while the flow is turbulent. Below Re about 1000 the factor shows the trend: coarser.
  const fine = Math.min(rayleigh * 1.3, lef * Math.sqrt(1 + 1000 / Math.max(Re, 1)));
  const smd = Math.exp(lerp(Math.log(rayleigh), Math.log(fine), Math.pow(s, 0.7)));
  const regime = P <= 0 ? 'no flow' : Re < 50 ? 'a slow rope, no drops' : Re < 1000 ? 'coarse strings and blobs' : s < 0.15 ? 'a straight jet' : s < 0.6 ? 'a narrow, coarse spray' : 'a hollow cone of fine drops';
  return { P, vIdeal, v, Q, mdot, Re, Oh, We, film: film * 1e6, cone, smd, regime, stroke: Q > 0 ? PUMP.V * 1e-6 / Q : Infinity };
}

// ---------------------------------------------------------------- drops in air
const psat = (T) => 610.94 * Math.exp(17.625 * T / (T + 243.04));         // Pa, Magnus
const rhoV = (p, T) => p * 0.018015 / (8.314 * (T + 273.15));             // kg/m3
export function wetBulb(T, RH) { const r = RH; return T * Math.atan(0.151977 * Math.sqrt(r + 8.313659)) + Math.atan(T + r) - Math.atan(r - 1.676331) + 0.00391838 * Math.pow(r, 1.5) * Math.atan(0.023101 * r) - 4.686035; }
export function evapK(liq, T = 30, RH = 50) {            // m2/s: d^2 falls this fast
  const Tw = wetBulb(T, RH), drho = Math.max(0, rhoV(psat(Tw), Tw) - rhoV(psat(T) * RH / 100, T));
  return 8 * 2.5e-5 * drho / 997 * liq.evap;
}
// One drop thrown from h0 with speed v: returns reach, time and whether it dried out first.
export function flight(dum, v, elevDeg, h0, K, rhoL = 997, path = null) {
  const e = elevDeg * Math.PI / 180; let vx = v * Math.cos(e), vy = v * Math.sin(e), x = 0, y = h0, t = 0, d = dum * 1e-6, dt = 0.002;
  if (path) path.push(0, h0, 0);
  while (t < 300) {
    const sp = Math.hypot(vx, vy), Re = Math.max(1e-6, RHO_AIR * sp * d / MU_AIR), Cd = 24 / Re + 6 / (1 + Math.sqrt(Re)) + 0.4;
    const k = 0.75 * RHO_AIR / (rhoL * d) * Cd * sp, f = 1 / (1 + k * dt);
    vx *= f; vy = (vy - G * dt) * f; x += vx * dt; y += vy * dt; t += dt;
    const d2 = d * d - K * dt; if (d2 <= 25e-12) { if (path) path.push(x, y, 0); return { x, t, dried: true, y }; }
    d = Math.sqrt(d2);
    if (y <= 0) { if (path) path.push(x, 0, 0); return { x, t, dried: false, y: 0, d: d * 1e6 }; }
    if (path && Math.round(t / dt) % 10 === 0) path.push(x, y, 0);
    dt = t < 0.2 ? 0.002 : 0.01;
  }
  return { x, t, dried: false, y };
}
// A film of liquid on a surface drying (mass transfer k = 0.005 m/s in still indoor air, an assumed figure).
export function wetTime(liq, mL, areaM2, T = 30, RH = 50) {
  const film = mL * 1e-6 * liq.rho / areaM2, flux = 0.005 * rhoV(psat(T), T) * (1 - RH / 100) * (liq.evap / 1) * (997 / 997);
  return { film: film / liq.rho * 1e6, t: flux > 0 ? film / flux : Infinity };
}
export const speedForLift = (h) => Math.sqrt(2 * 997 * G * h / RHO_AIR);   // Bernoulli: the blowing speed that lifts water h metres

// ---------------------------------------------------------------- cut-away sprayer (1 unit = 15 mm)
// Head axes: +x towards the nozzle, y up, cylinder axis at y = 0. Bottle axis at x = -0.3. A plain generic shape.
const NECK = -0.3, SW = 0.6;
export function makeSprayer({ h = 9, r = 2.2, liq = 0x6fb6ff, level = 0.72 } = {}) {
  const g = new THREE.Group(), lift = 1.15 + h;
  g.position.y = lift;
  const P = {};
  const add = (name, o, parent = g) => { P[name] = o; parent.add(o); return o; };
  const liqMat = new THREE.MeshStandardMaterial({ color: liq, transparent: true, opacity: 0.55, roughness: 0.12, depthWrite: false });
  const inMat = new THREE.MeshStandardMaterial({ color: liq, transparent: true, opacity: 0.85, roughness: 0.15 });

  // bottle: a plain cylinder with a shoulder
  const base = -lift;
  const bottle = new THREE.Group(); bottle.position.x = NECK;
  const prof = [[0.02, base], [r - 0.12, base], [r, base + 0.14], [r, -2.6], [r - 0.28, -2.15], [0.95, -1.55], [0.85, -1.35], [0.85, -0.85]].map(([a, b]) => new THREE.Vector2(a, b));
  bottle.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 56), M.clear(0xdff2ff, 0.2)));
  add('bottle', bottle);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.07, r - 0.07, 1, 48), liqMat); body.geometry.translate(0, 0.5, 0);
  body.position.set(NECK, base + 0.07, 0); body.scale.y = (h - 1.0) * level; body.renderOrder = 1; P.liquid = body; bottle.position.x = NECK; g.add(body);
  // cap and gasket
  const cap = new THREE.Group();
  const capMat = M.plastic(0x59627a, { transparent: true, opacity: 0.62, depthWrite: false });
  const capM = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.62, 40, 1, true), capMat); capM.position.set(NECK, -0.72, 0); cap.add(capM);
  const capT = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.08, 40), capMat); capT.position.set(NECK, -0.42, 0); cap.add(capT);
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; if (Math.sin(a) > 0.35) continue; const b = box(0.04, 0.56, 0.06, M.plastic(0x6e7890)); b.position.set(NECK + 1.1 * Math.cos(a), -0.72, 1.1 * Math.sin(a)); b.rotation.y = -a; cap.add(b); }
  add('cap', cap);
  const gasket = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.07, 10, 40), M.matte(0xe9d58f)); gasket.rotation.x = Math.PI / 2; gasket.position.set(NECK, -0.84, 0); add('gasket', gasket);
  // dip tube and filter
  const dipY0 = -0.95, dipY1 = base + 0.5;
  const dip = beam([NECK, dipY0, 0], [NECK, dipY1, 0], 0.13, M.clear(0xffffff, 0.4)); add('dip', dip);
  const dipLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 1, 12), inMat); dipLiq.geometry.translate(0, 0.5, 0); dipLiq.position.set(NECK, dipY1, 0); dipLiq.scale.y = dipY0 - dipY1; g.add(dipLiq); P.dipLiq = dipLiq;
  const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.4, 12, 2, false), new THREE.MeshStandardMaterial({ color: 0xcfd6e2, wireframe: true })); filter.position.set(NECK, dipY1 - 0.15, 0); add('filter', filter);

  // the housing: a side profile, extruded, see-through
  const sh = new THREE.Shape();
  sh.moveTo(-1.05, -0.38); sh.lineTo(1.2, -0.38); sh.lineTo(1.75, 0.3); sh.lineTo(2.5, 0.62); sh.lineTo(2.85, 0.68); sh.lineTo(2.85, 1.3); sh.quadraticCurveTo(1.2, 1.62, -0.75, 1.38); sh.quadraticCurveTo(-1.2, 1.25, -1.2, 0.8); sh.closePath();
  const shGeo = new THREE.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }); shGeo.translate(0, 0, -0.75);
  const shroudMat = M.clear(0xaab6cc, 0.13); const shroud = new THREE.Mesh(shGeo, shroudMat); shroud.renderOrder = 3; add('shroud', shroud);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(shGeo, 25), new THREE.LineBasicMaterial({ color: 0xaab6cc, transparent: true, opacity: 0.4 })); shroud.add(edges);

  // cylinder, closed at the back
  const wall = M.clear(0xffffff, 0.3);
  const cyl = new THREE.Group(); cyl.add(rod(-0.45, 1.1, 0.46, 0.46, wall, 32, true)); const back = rod(-0.5, -0.45, 0.46, 0.46, M.plastic(0xc4ccda)); cyl.add(back); add('cylinder', cyl);
  const chLiq = rod(0, 1, 0.42, 0.42, inMat, 24); chLiq.position.set(-0.45, 0, 0); chLiq.geometry.translate(-0.5 + 0.5, 0, 0); chLiq.castShadow = false; g.add(chLiq); P.chLiq = chLiq;
  const chAir = rod(0, 1, 0.42, 0.42, M.clear(0xdfe8f5, 0.16), 24); chAir.position.set(-0.45, 0, 0); g.add(chAir); P.chAir = chAir;
  // return spring in the chamber
  const coil = spring(0, 1, 0.27, 0.028, 5, M.metal(0xd7dbe2)); coil.position.set(-0.45, 0, 0); g.add(coil); P.spring = coil;
  // piston: a skirted cup and its long plunger rod
  const piston = new THREE.Group();
  piston.add(rod(0.45, 1.05, 0.42, 0.42, M.plastic(0xff8f6b, { roughness: 0.35 }), 32));
  [0.5, 0.98].forEach((x) => { const o = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 32), M.matte(0x22252e)); o.rotation.y = Math.PI / 2; o.position.x = x; piston.add(o); });
  piston.add(rod(1.05, 1.86, 0.13, 0.13, M.plastic(0xff8f6b, { roughness: 0.35 }), 16));
  add('piston', piston);

  // passages
  const passMat = M.clear(0xffffff, 0.34);
  const inlet = beam([NECK, -1.0, 0], [NECK, -0.44, 0], 0.17, passMat); add('inletTube', inlet);
  const inLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.56, 12), inMat); inLiq.position.set(NECK, -0.72, 0); g.add(inLiq); P.inLiq = inLiq;
  const outMat = M.clear(0xffffff, 0.34);
  const outTube = new THREE.Group();
  outTube.add(beam([NECK, 0.44, 0], [NECK, 1.0, 0], 0.17, outMat), rod(NECK, 2.72, 0.17, 0.17, outMat, 16, true)); outTube.children[1].position.y = 1.0;
  add('outlet', outTube);
  const outLiq = new THREE.Group(); const u1 = beam([NECK, 0.44, 0], [NECK, 1.0, 0], 0.13, inMat), u2 = rod(NECK, 2.7, 0.13, 0.13, inMat, 12); u2.position.y = 1.0; outLiq.add(u1, u2); g.add(outLiq); P.outLiq = outLiq;
  // check valves: two balls on seats
  const seatMat = M.plastic(0x8d97ab);
  const inSeat = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 20), seatMat); inSeat.rotation.x = Math.PI / 2; inSeat.position.set(NECK, -0.78, 0); add('inSeat', inSeat);
  const outSeat = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 20), seatMat); outSeat.rotation.x = Math.PI / 2; outSeat.position.set(NECK, 0.56, 0); add('outSeat', outSeat);
  const ballMat = M.metal(0xf1f4f8, { roughness: 0.18 });
  const inBall = sphere(0.125, ballMat, 18); inBall.position.set(NECK, -0.68, 0); add('inBall', inBall);
  const outBall = sphere(0.125, ballMat, 18); outBall.position.set(NECK, 0.66, 0); add('outBall', outBall);
  // swirl insert and nozzle cap
  const swirl = rod(2.45, 2.72, 0.2, 0.2, M.plastic(0x4fd0c0), 16); swirl.position.y = 1.0; swirl.position.x += 0; add('swirl', swirl);
  const nozzleCap = new THREE.Group(); nozzleCap.position.set(2.86, 1.0, 0);
  const nb = rod(-0.14, 0.3, 0.36, 0.36, M.plastic(0x4b5570), 6); nozzleCap.add(nb);
  const hole = rod(0.3, 0.33, 0.07, 0.07, M.matte(0x101216), 12); nozzleCap.add(hole);
  add('nozzle', nozzleCap);
  // trigger: pivots near the barrel; its back face pushes the plunger
  const trig = new THREE.Group(); trig.position.set(2.2, 0.72, 0);
  const ts = new THREE.Shape(); ts.moveTo(-0.34, 0.12); ts.lineTo(0.22, 0.12); ts.quadraticCurveTo(0.38, -0.9, 0.2, -2.25); ts.quadraticCurveTo(0.42, -2.55, 0.1, -2.62); ts.quadraticCurveTo(-0.16, -2.0, -0.34, -1.3); ts.lineTo(-0.34, 0.12);
  const tg = new THREE.ExtrudeGeometry(ts, { depth: 0.9, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); tg.translate(0, 0, -0.45);
  const tm = new THREE.Mesh(tg, M.plastic(0x5b86d6, { roughness: 0.4, transparent: true, opacity: 0.85 })); tm.castShadow = true; trig.add(tm);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 12), M.metal(0xd7dbe2)); pin.rotation.x = Math.PI / 2; trig.add(pin);
  add('trigger', trig);
  // vent: the piston skirt covers this hole until the trigger is pulled
  const vent = tube([[0.85, -0.44, 0], [0.72, -0.62, 0], [0.42, -0.85, 0], [0.38, -1.25, 0]], 0.05, M.clear(0xffd98a, 0.75), false, 30); add('vent', vent);

  const setLiquid = (hex) => { liqMat.color.set(hex); inMat.color.set(hex); };
  const set = ({ pull = 0, inOpen = false, outOpen = false, chFill = 1, dipFill = 1, outFill = 1 }) => {
    const st = SW * clamp(pull, 0, 1);
    piston.position.x = -st;
    trig.rotation.z = -Math.atan(st / 0.72);
    const len = 0.45 - st + 0.45;                 // from the back wall to the piston face
    coil.scale.x = len; chLiq.scale.x = len * Math.max(0.001, chFill); chAir.scale.x = len;
    chLiq.visible = chFill > 0.02; chAir.visible = chFill < 0.98;
    inBall.position.y = inOpen ? -0.57 : -0.68; outBall.position.y = outOpen ? 0.78 : 0.66;
    dipLiq.scale.y = Math.max(0.001, (dipY0 - dipY1) * clamp(dipFill, 0, 1)); dipLiq.visible = dipFill > 0.01;
    inLiq.visible = dipFill >= 0.99; outLiq.visible = outFill > 0.5;
  };
  set({});
  return { g, P, set, setLiquid, lift, NOZZLE: [3.2, 1.0, 0], NECK, dipY1, dipY0, r, base, level };
}

// ---------------------------------------------------------------- chart and 3D helpers (as PerfumeClear)
export const COL = { hot: '#ff7a59', cold: '#6fb6ff', heat: '#ffb547', water: '#6fb6ff', steam: '#dfe8f5', oil: '#ff8fb1', gold: '#f2c14e', ok: '#5ce1a9', latent: '#c49bff', text: '#e8eef8', bad: '#ff5d5d', pink: '#f59ee6', copper: '#c7773f' };
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', xLog = false, yLog = false }) {
  const fx = xLog ? Math.log : (v) => v, fy = yLog ? Math.log : (v) => v;
  const X = (x) => x0 + ((fx(x) - fx(xMin)) / (fx(xMax) - fx(xMin))) * (x1 - x0);
  const Y = (y) => y0 - ((fy(y) - fy(yMin)) / (fy(yMax) - fy(yMin))) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function legend(g, items, x = 24, y = 50, font = 18) {
  g.font = `bold ${font}px sans-serif`;
  for (const [n, c] of items) { g.fillStyle = c; g.fillRect(x, y, 16, 16); g.fillStyle = COL.text; g.fillText(n, x + 22, y + 15); x += 36 + g.measureText(n).width; }
}
export function dashH(g, X0, X1, y, text = '', col = 'rgba(255,255,255,.5)') {
  g.strokeStyle = col; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X0, y); g.lineTo(X1, y); g.stroke(); g.setLineDash([]);
  if (text) { g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(text, X1 - g.measureText(text).width - 4, y - 8); }
}
// Horizontal bars with labels: rows [{ label, value, color, text }].
export function bars(g, rows, { x = 20, y = 64, w = 600, rowH = 52, labelW = 230, unit = (v) => v, max = null, font = 19 } = {}) {
  const mx = max ?? Math.max(1e-12, ...rows.map((r) => Math.abs(r.value))) * 1.15, span = w - labelW - 20;
  rows.forEach((r, i) => {
    const yy = y + i * rowH, L = clamp(Math.abs(r.value) / mx, 0, 1) * span;
    g.font = `bold ${font}px sans-serif`; g.fillStyle = r.lcol || r.color; g.fillText(r.label, x, yy + rowH * 0.5);
    g.globalAlpha = 0.9; g.fillStyle = r.color; g.fillRect(x + labelW, yy + 6, Math.max(2, L), rowH - 16); g.globalAlpha = 1;
    g.font = `${font - 1}px sans-serif`; g.fillStyle = '#fff'; const t = r.text ?? unit(r.value), tw = g.measureText(t).width;
    const inside = x + labelW + L + 8 + tw > w; if (inside) g.fillStyle = r.dark ? '#111' : '#fff';
    g.fillText(t, inside ? x + labelW + L - tw - 8 : x + labelW + L + 8, yy + rowH * 0.5 + 1);
  });
}
export function wrap(g, text, x, y, maxW, lh) {
  let ln = '';
  for (const wd of text.split(' ')) { if (g.measureText(ln + wd).width > maxW && ln) { g.fillText(ln.trim(), x, y); y += lh; ln = ''; } ln += wd + ' '; }
  if (ln.trim()) { g.fillText(ln.trim(), x, y); y += lh; }
  return y;
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------------------------------------------------------------- statistics
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- 3D pieces
// Dots, one instanced mesh, each with its own colour. lit = true gives shaded balls.
export function dots(n, r, color = 0xffffff, seg = 8, lit = false) {
  const mat = lit ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }) : new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { mesh.setColorAt(i, col); o.position.set(0, -99, 0); o.scale.setScalar(0.0001); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// Little puffs that drift from a source: step(dt, rate, at, vel, life, tint).
export function puffs(parent, n, r, color, rnd, lit = false) {
  const d = dots(n, r, color, 8, lit); parent.add(d);
  const P = Array.from({ length: n }, () => ({ life: 0, max: 1, p: [0, -99, 0], v: [0, 0, 0] }));
  let acc = 0;
  return {
    mesh: d, P,
    step(dt, rate, at, vel, life = 1.2, tint = null, drag = 0) {
      acc += rate * dt;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        if (q.life <= 0 && acc >= 1) { acc -= 1; q.life = q.max = life * (0.75 + 0.5 * rnd()); q.p = at(); q.v = vel(q.p); if (tint) d.tint(i, tint()); }
        if (q.life > 0) { q.life -= dt; const k = drag ? Math.exp(-drag * dt) : 1; q.v[0] *= k; q.v[1] *= k; q.v[2] *= k; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; }
        const k = q.life / q.max;
        d.place(i, q.p[0], q.p[1], q.p[2], q.life > 0 ? 0.35 + 0.65 * Math.sin(Math.PI * clamp(k, 0, 1)) : 0.0001);
      }
      if (acc > 20) acc = 20;
      d.done();
    },
    clear() { P.forEach((q) => { q.life = 0; }); acc = 0; },
  };
}
// Dots streaming along a path (a list of points). step(dt, speed, share, tintOf):
// share (0 to 1) is how many of the dots show; tintOf(i) picks each dot's colour.
export function stream(parent, n, r, pts, { jitter = 0.07, seed = 3, color = 0xffffff } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2);
  const d = dots(n, r, color); parent.add(d);
  const rnd = rng(seed), P = Array.from({ length: n }, () => ({ u: rnd(), o: [(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2], s: 0.7 + 0.6 * rnd() }));
  const v = new THREE.Vector3();
  return {
    mesh: d, curve,
    step(dt, speed = 0.2, share = 1, tintOf = null) {
      const show = Math.round(n * clamp(share, 0, 1));
      P.forEach((p, i) => {
        p.u += dt * speed * p.s; if (p.u > 1) p.u -= 1;
        curve.getPoint(p.u, v);
        const fade = Math.min(1, p.u * 12, (1 - p.u) * 12);
        d.place(i, v.x + p.o[0] * jitter, v.y + p.o[1] * jitter, v.z + p.o[2] * jitter, i < show ? fade : 0.0001);
        if (tintOf) d.tint(i, tintOf(i));
      });
      d.done();
    },
  };
}
// A shape turned on a lathe around the vertical (Y) axis from [radius, y] pairs. phi limits the sweep
// so a vessel can be cut open towards the viewer (+z is towards the camera; the default cut faces it).
export function latheY(profile, mat, { seg = 56, cut = 0 } = {}) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), seg, cut ? Math.PI * cut : 0, cut ? TAU - TAU * cut : TAU);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}
// A wall with thickness: outer profile up, inner profile back down.
export function shell(profile, th, mat, opts) {
  const inner = profile.slice().reverse().map(([r, y]) => [Math.max(0, r - th), y]);
  return latheY([...profile, ...inner], mat, opts);
}
// A ring of flickering flames. set(level 0..1), step(dt).
export function flames(parent, n, R, y, { color = 0xff9a3c, h = 0.5, r = 0.09, line = 0 } = {}) {
  const g = new THREE.Group(); parent.add(g);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false });
  const fs = [];
  for (let i = 0; i < n; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat); f.geometry.translate(0, h / 2, 0);
    if (line) f.position.set(-line / 2 + (line * (i + 0.5)) / n, y, R * (i % 2 ? 1 : -1) * 0.5);
    else { const a = (i / n) * TAU; f.position.set(Math.cos(a) * R, y, Math.sin(a) * R); }
    g.add(f); fs.push(f);
  }
  let tt = 0, lvl = 1;
  return { g, set(v) { lvl = v; }, step(dt) { tt += dt; fs.forEach((f, i) => { f.visible = lvl > 0.02; f.scale.set(1, (0.35 + 1.1 * lvl) * (0.8 + 0.35 * Math.sin(tt * 19 + i * 1.9)), 1); }); } };
}
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function flowArrow(color, r = 0.05, head = 0.28) {
  const a = arrow(color, 1, head, r);
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.05) a.visible = false;
  };
  return a;
}
export function edgesOf(mesh, color = 0x9fb4c8, opacity = 0.7) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale);
  return e;
}
// The shared camera and board layout. The readout covers the upper left of the stage, so models stay
// low on the left and the two chart boards stack on the right.
export const VIEW = { pos: [2.2, 5.0, 11.6], target: [2.2, 4.2, 0] };
// Square and 16:9 recordings have no readout to dodge, so they frame the model and boards centrally.
export const REEL_VIEW = { pos: [1.9, 3.9, 12.4], target: [1.9, 3.4, 0] };
// The portrait reel: boards stacked above the model.
export const TALL = { pos: [-0.4, 5.8, 8.4], target: [-0.4, 5.4, 0] };
export const BW = 4.6, BH = 2.65, B1 = [6.1, 5.9, 0], B2 = [6.1, 2.9, 0];
// On a phone-width stage: hide minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.19 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// True while the Glassbox studio records the reel: scenes then choose their own camera views.
export const inReel = () => document.body.classList.contains('gb-reel');
// Chart boards sit to the right of the model on screen. In a tall (portrait) reel they stack above
// the model instead. Square and 16:9 recordings keep the chapter's own side-by-side view.
export function reelBoards(boards, x = 0, stage = null, view = null) {
  const r = inReel(), wide = r && stage && stage.camera.aspect > 0.9;
  boards.forEach((b, i) => {
    if (!b.home) b.home = b.mesh.position.clone();
    if (r && !wide) { b.mesh.position.set(x, 10.9 - i * 4.05, 0); b.mesh.scale.setScalar(1.5); }
    else { b.mesh.position.copy(b.home); b.mesh.scale.setScalar(1); }
  });
  if (wide && view) { stage.controls.autoRotate = false; if (stage.home?.pos !== REEL_VIEW.pos) stage.setView(REEL_VIEW.pos, REEL_VIEW.target, 0.01); }
}
// On a phone the readout covers the top of the stage, so only one board is kept, low on the right.
export function phoneBoards(stage, boards, primary = 0) {
  const narrow = stage.host.clientWidth < 560 && !inReel();
  boards.forEach((b, i) => { b.mesh.visible = !narrow || i === primary; if (narrow && i === primary) b.mesh.position.set(...(b.phonePos || b.mesh.position.toArray())); });
}
export const isPhone = () => window.innerWidth < 560;
export const link = (slug, name, hash = '') => `<a href="https://glassbox.how/${slug}/${hash ? '#' + hash : ''}">${name}</a>`;
export { clamp, lerp, beam, box, sphere, M };

// Where boards sit: desk positions by default; in the tall reel, stacked at `tall`; on a phone only the
// first stays, at `phone`.
export function placeBoards(stage, boards, { tall = [], tallScale = 1, phone = null } = {}) {
  const reel = inReel(), portrait = reel && stage.camera.aspect < 0.9, narrow = !reel && stage.host.clientWidth < 560;
  boards.forEach((b, i) => {
    if (!b.home) b.home = b.mesh.position.clone();
    b.mesh.visible = true; b.mesh.scale.setScalar(1);
    if (portrait && tall[i] === null) b.mesh.visible = false;
    else if (portrait && tall[i]) { b.mesh.position.set(...tall[i]); b.mesh.scale.setScalar(tallScale); }
    else if (narrow) { b.mesh.visible = i === 0 && !!phone; if (phone && i === 0) b.mesh.position.set(...phone); }
    else b.mesh.position.copy(b.home);
  });
}
// A real-time cloud of drops. emit() takes position, velocity and drop size (um); drag and gravity are real
// but slowed by `slow`. Size on screen is exaggerated.
export function mistCloud(parent, n, r, color, rnd) {
  const d = dots(n, r, color, 6); parent.add(d);
  const P = Array.from({ length: n }, () => ({ on: false, p: [0, -99, 0], v: [0, 0, 0], d: 1e-4, age: 0 }));
  let next = 0;
  return {
    mesh: d, P,
    emit(p, v, dum) { const q = P[next]; next = (next + 1) % n; q.on = true; q.p = p.slice(); q.v = v.slice(); q.d = dum * 1e-6; q.d0 = dum; q.age = 0; },
    step(dt, { scale = 1, K = 0, rho = 997, floor = 0, slow = 1, sz = (u) => Math.min(2.2, Math.pow(u / 100, 0.5)) } = {}) {
      const h = dt * slow;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        if (!q.on) { d.place(i, 0, -99, 0, 0.0001); continue; }
        const sp = Math.hypot(q.v[0], q.v[1], q.v[2]), Re = Math.max(1e-6, RHO_AIR * sp * q.d / MU_AIR), Cd = 24 / Re + 6 / (1 + Math.sqrt(Re)) + 0.4;
        const k = 0.75 * RHO_AIR / (rho * q.d) * Cd * sp, f = 1 / (1 + k * h);
        q.v[0] *= f; q.v[1] = (q.v[1] - G * h) * f; q.v[2] *= f;
        q.p[0] += q.v[0] * h * scale; q.p[1] += q.v[1] * h * scale; q.p[2] += q.v[2] * h * scale;
        const d2 = q.d * q.d - K * h; if (d2 < 36e-12) q.on = false; else q.d = Math.sqrt(d2);
        q.age += dt; if (q.p[1] < floor || q.age > 14) q.on = false;
        d.place(i, q.p[0], q.p[1], q.p[2], q.on ? sz(q.d * 1e6) : 0.0001);
      }
      d.done();
    },
  };
}
