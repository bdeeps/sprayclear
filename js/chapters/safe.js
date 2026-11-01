// Chapter 6: safe use and a short history. A film of liquid on a surface dries while a label's contact time runs.
// Drying model: wetTime() in spray.js. The label time is yours to set; real labels differ by product.
// Sources: CDC "Cleaning and disinfecting with bleach" (never mix bleach or any disinfectant with other cleaners or
// disinfectants); New Jersey Department of Health hazard alert (bleach with ammonia makes chloramine gases);
// WHO COVID-19 cleaning Q&A (spraying people is not recommended); EPA "Introduction to pesticide labels" (the label
// is the law); India's Insecticides Act 1968 (registration); Plastic Waste Management Rules 2016 (India).
import { THREE, M, box } from '../kit.js';
import { makeSprayer, LIQ, wetTime, PUMP, COL, board, panelBg, title, wrap, rng, placeBoards, inReel, isPhone, link, clamp, dots, rrect } from '../spray.js';

const VIEW = { pos: [1, 5.2, 10.5], target: [1, 4, 0] };
const TALL = { pos: [0.6, 8, 9.4], target: [0.6, 7, 0] };
const RULES = [
  ['Never mix cleaning products', 'Bleach with ammonia or acids gives off toxic gas. CDC: never mix bleach or any disinfectant with other cleaners.'],
  ['Label every refill', 'A clear bottle of unknown liquid is a hazard, above all around children. Keep the name and the directions.'],
  ['Eyes and breathing', 'Follow the label: aim away from faces, ventilate, keep away from children. WHO: do not spray disinfectant on people.'],
  ['Pesticides: the label rules', 'EPA: "the label is the law". In India, use registered products as approved (CIBRC, Insecticides Act 1968).'],
];
const LINE = [['1888', 'DeVilbiss atomiser'], ['1927', 'Rotheim files his US can patent'], ['1941', 'Goodhue and Sullivan: the bug bomb'], ['1949', 'Abplanalp\'s crimp-on valve'], ['Late 60s', 'Trigger sprayers appear'], ['1974', 'Molina and Rowland warn on CFCs'], ['1987', 'Montreal Protocol']];

export default {
  id: 'safe',
  short: 'Safe use, history',
  title: 'Safe use and a short history',
  subtitle: 'A spray is only as useful as how you use it: wet for long enough, never mixed, always labelled.',
  view: VIEW,
  learn: `<p><b>Contact time.</b> Disinfectants do not work on touch. The label says how long the surface must <b>stay wet</b>, and this differs by product. Spray and wipe at once and you may have only cleaned it. US EPA and CDC material on labels says the same: follow the directions, including the wet time. Wipe dirt away first when the label says so.</p>
    <p><b>Never mix cleaning products.</b> Bleach with ammonia or with acids gives off toxic gas. That is all you need to know: do not combine them, even to get something "stronger". The CDC says never to mix bleach or any disinfectant with other cleaners or disinfectants.</p>
    <p><b>Refills.</b> Label a refilled bottle with what it holds, keep it away from children, and never put a chemical in a food or drink bottle. Do not spray cleaners towards eyes or breathe the mist. The WHO does not recommend spraying people with disinfectant under any circumstances.</p>
    <p><b>Plant misters.</b> Iowa State University Extension says misting is not an effective way to raise humidity: the leaves dry quickly. A humidifier or grouped plants do better.</p>
    <p><b>Plastic.</b> Bottles are often PET or HDPE and many trigger heads are polypropylene, with metal springs inside, so a whole sprayer is hard to recycle. Refilling it saves throwing away a working pump. In India, the Plastic Waste Management Rules, 2016 set out how plastic waste is handled.</p>
    <p class="tip"><b>Try it:</b> change the product and the number of sprays, and see whether the surface stays wet for the label time. See the history page for the full story, from atomisers to the Montreal Protocol.</p>`,
  terms: [
    { t: 'Contact time', d: 'How long a disinfectant has to stay wet on a surface to do what the label claims. Also called dwell time.' },
    { t: 'CFCs', d: 'Chlorofluorocarbons, once used as aerosol propellants. They damage the ozone layer and are now phased out.' },
    { t: 'Montreal Protocol', d: 'The 1987 treaty to phase out substances that deplete the ozone layer.' },
  ],
  defaults: { base: 'water', sprays: 3, label: 5, rh: 50 },
  controls: [
    { key: 'base', type: 'seg', label: 'Product is mostly', options: [{ v: 'water', label: 'Water' }, { v: 'sanitiser', label: 'Alcohol' }] },
    { key: 'sprays', type: 'range', label: 'Sprays on a 30 cm square', min: 1, max: 8, step: 1, ends: ['1', '8'], fmt: (v) => v + ' sprays' },
    { key: 'label', type: 'range', label: 'Time on the label (example)', min: 1, max: 10, step: 1, ends: ['1 min', '10 min'], fmt: (v) => v + ' min', hint: 'An example only. Your product\'s own label gives the real time.' },
    { key: 'rh', type: 'range', label: 'Humidity at 30 °C', min: 20, max: 90, step: 5, ends: ['dry', 'humid'], fmt: (v) => v + '%' },
    { key: 'go', type: 'buttons', label: 'Your move', items: [{ label: 'Spray again', act: (s, inst) => inst.again() }] },
  ],
  quiz: [
    { q: 'What does "contact time" on a disinfectant label mean?', options: ['How long the bottle lasts', 'How long the surface must stay wet for the claim to hold', 'How far to hold the nozzle', 'How long to shake it'], answer: 1, why: 'Disinfectants need time. If the surface dries or is wiped early, it may not reach what the label promises.' },
    { q: 'What should you do with two cleaners to make them stronger?', options: ['Mix them equally', 'Mix a little', 'Never mix them', 'Mix them outdoors'], answer: 2, why: 'Some combinations give off toxic gas. Official advice is simple: never mix them.' },
    { q: 'Which treaty set out the phase-out of ozone-harming chemicals such as CFCs?', options: ['The Kyoto Protocol', 'The Montreal Protocol', 'The Paris Agreement', 'The Geneva Convention'], answer: 1, why: 'The Montreal Protocol was opened for signature on 16 September 1987. CFC propellants had already been banned from most US aerosols in 1978.' },
  ],
  reel: [
    { ms: 5000, caption: 'Give a disinfectant its contact time, never mix cleaners, and label every refill.', set: { base: 'water', sprays: 3, label: 5, rh: 50 }, act: (s, i) => i.again(), view: TALL, spin: 0 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const AREA = 0.09;
    const tile = box(5.4, 0.2, 3.6, M.plastic(0xc9d1dd, { roughness: 0.5 })); tile.position.set(-1.4, 0.1, -0.4); root.add(tile);
    const film = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.2), new THREE.MeshStandardMaterial({ color: 0x8fc8ff, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.2, depthWrite: false })); film.rotation.x = -Math.PI / 2; film.position.set(-1.4, 0.215, -0.4); root.add(film);
    const rnd = rng(3), DN = 240, dr = dots(DN, 0.09, 0xcfe8ff, 10, true); root.add(dr);
    const dp = Array.from({ length: DN }, () => [(-1.4 + (rnd() - 0.5) * 5), 0.25, -0.4 + (rnd() - 0.5) * 3.2, 0.4 + 1.1 * rnd()]);
    const S = makeSprayer({ h: 5, r: 1.7 }); const hold = new THREE.Group(); hold.scale.setScalar(0.45); hold.add(S.g); hold.rotation.z = -0.5; hold.position.set(-3.1, 2.5, 0.4); root.add(hold);
    const clockLbl = stage.label('', [-1.4, 0.6, 1.5], root, 'hot');
    let age = 0, wet = 1;
    const bA = board(root, 4.45, 4.07, 520, 476, (g, w, h) => {
      panelBg(g, w, h); title(g, 'From official advice');
      RULES.forEach(([a, b], i) => { const y = 52 + i * 105; rrect(g, 12, y, w - 24, 98, 10); g.fillStyle = 'rgba(255,255,255,.07)'; g.fill(); g.font = 'bold 21px sans-serif'; g.fillStyle = i === 0 ? COL.hot : COL.gold; g.fillText(a, 24, y + 26); g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; wrap(g, b, 24, y + 49, w - 48, 20); });
    }, [4.4, 6.45, 0]);
    const bB = board(root, 4.45, 2.46, 520, 288, (g, w, h) => {
      panelBg(g, w, h); title(g, 'How sprays got here');
      LINE.forEach(([y, n], i) => { const yy = 66 + i * 32; g.font = 'bold 20px sans-serif'; g.fillStyle = COL.cold; g.fillText(y, 20, yy); g.font = '19px sans-serif'; g.fillStyle = COL.text; g.fillText(n, 104, yy); });
    }, [4.4, 3.0, 0]);
    const model = (s) => wetTime(LIQ[s.base], s.sprays * PUMP.V * 0.8, AREA, 30, s.rh);
    const inst = {
      again() { age = 0; },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05));
        const m = model(s); age += dt * 40;              // the clock runs 40 times too fast
        if (age > Math.max(m.t, s.label * 60) * 1.2 + 80) age = 0;
        wet = clamp(1 - age / m.t, 0, 1);
        film.material.opacity = 0.05 + 0.5 * wet; film.visible = wet > 0;
        dp.forEach((q, i) => { const r = wet * q[3] * clamp(Math.pow(s.sprays / 3, 0.33), 0.5, 1.5); dr.place(i, q[0], q[1], q[2], i < 120 + s.sprays * 15 && r > 0.03 ? r : 0.0001); }); dr.done();
        const lab = s.label * 60, ok = m.t >= lab;
        clockLbl.element.innerHTML = `${Math.floor(Math.min(age, lab) / 60)}:${String(Math.floor(Math.min(age, lab) % 60)).padStart(2, '0')} of ${s.label}:00 ${age >= lab ? (ok ? ': still wet' : ': dried early') : wet <= 0 ? ': already dry' : ''}`;
        placeBoards(stage, [bA, bB], { tall: [[0.6, 11.6, 0], null], tallScale: 1.95 });
        const nar = stage.host.clientWidth < 560 && !inReel(); if (nar) { bA.mesh.visible = bB.mesh.visible = false; } stage.setShift(0, nar ? -0.18 : 0);
      },
      readout(s) {
        const m = model(s), ok = m.t >= s.label * 60;
        const fmt = (t) => t < 90 ? Math.round(t) + ' s' : (t / 60).toFixed(1) + ' min';
        return `<div class="big">${ok ? 'Stays wet long enough' : 'Dries too soon: follow the label'}</div>
          <div class="row"><span>Film on the surface</span><b>${m.film.toFixed(0)} µm</b></div>
          <div class="row"><span>Stays wet for about</span><b>${fmt(m.t)}</b></div>
          <div class="row"><span>Label's time (example)</span><b>${s.label} min</b></div>
          ${isPhone() ? '' : '<small>A rough drying model at 30 °C, sped up. Not a dose or advice: your label decides.</small>'}`;
      },
    };
    void link;
    return inst;
  },
};
