// tools/gen-chain-spine.mjs — emits the running spine for a How We Got Here chain zine.
//
//   node tools/gen-chain-spine.mjs <chain-zine>.html
//
// The zine is written with a <!--SPINE:N--> placeholder inside each spread's <div class="spine">,
// where N is the spread number; this script replaces every one of them and prints the joint tally.
//
// WHY THIS IS COMMITTED. Chains 1-6 hand-edited their spine across 11-15 copies and every one of
// them drifted. No. 50 fixed that with a generator and then threw it away, so No. 52 had to write
// one again — which is precisely the failure `check-contrast.mjs` records in its own history:
// a tool that has to be rebuilt from scratch is a tool nobody runs. Edit NODES for a new chain.
//
// It also tallies the joints, and that tally is load-bearing: on No. 52 it disagreed with the
// colophon and caught a miscount (three contested claimed, four actually tagged). Keep the count
// honest — see the note on the first node below.
//
// Unlike No. 50's spine, this one is NOT a plot of its own data — the chain's dates carry no
// plottable quantity, and on a linear year axis the four 1868 nodes land within two pixels of
// each other. So it is structural: ordinal steps, real years printed at the nodes. What it DOES
// keep from No. 50 is generation — chains 1-6 drifted their geometry across 11-15 hand-edited
// copies, and 17 hand-edited copies would drift the same way. Same fix, different reason.
//
// Two rails, because the chain is two threads that swap:
//   light      — what the blocked Sun told us (spectroscopy)
//   instrument — what we built so we would not have to wait (optics)
import fs from 'node:fs';

// CHAINS is keyed by zine filename. Before this, NODES was a single array edited in
// place per chain — which meant that the moment a new chain was built, the previous
// chain's spine could no longer be regenerated. That is the failure this file's own
// header warns about ("a tool that has to be rebuilt from scratch is a tool nobody
// runs"), one level up: not the tool being thrown away, but its data being overwritten.
// Add a new chain as a new key. Do not edit an existing one.
const CHAINS = {};

CHAINS['build-the-eclipse-zine.html'] = {
  rails: { light: 26, inst: 58, turn: 8 },
  railLabels: [['light', 29], ['built', 61]],
  aria: 'two rails — what the blocked Sun told us, and what we built so we would not have to wait',
  reuse: { 18: 17, 20: 19 },
  nodes: [
  // spread, year label, rail, joint tag on the edge ARRIVING at this node
  // Node 1 carries a tag for COUNTING only — it has no incoming edge, so edges() never reads it
  // (the loop starts at i=1 and uses b.joint). Without it the script's tally disagreed with the
  // tags actually printed on the spreads, which is the number a reader can check.
  { s: 2,  y: '1604', rail: 'inst',  joint: 'documented', t: 'the theory of the hole' },
  { s: 3,  y: '1860s', rail: 'inst', joint: 'documented', t: 'seven minutes, if you travel' },
  { s: 4,  y: '18 Aug 1868', rail: 'light', joint: 'documented', t: 'Guntur' },
  { s: 5,  y: '19 Aug 1868', rail: 'inst',  joint: 'documented', t: 'the next morning' },
  { s: 6,  y: '20 Oct 1868', rail: 'inst',  joint: 'documented', t: 'London, and one medal' },
  { s: 7,  y: '1868',  rail: 'light', joint: 'contested',  t: 'nobody flagged the line' },
  { s: 8,  y: '1870s', rail: 'light', joint: 'contested',  t: 'no bench, no element' },
  { s: 9,  y: '1869+', rail: 'light', joint: 'contested',  t: 'coronium · nebulium' },
  { s: 10, y: '1895',  rail: 'light', joint: 'documented', t: 'underfoot all along' },
  { s: 11, y: '1927-42', rail: 'light', joint: 'documented', t: 'the phantoms dissolve' },
  { s: 12, y: '1919',  rail: 'inst',  joint: 'documented', t: 'the Moon again' },
  { s: 13, y: '1919',  rail: 'inst',  joint: 'contested',  t: 'the plates set aside' },
  { s: 14, y: '1931',  rail: 'inst',  joint: 'documented', t: 'an eclipse to order' },
  { s: 15, y: '2009',  rail: 'inst',  joint: 'documented', t: 'whose call it was' },
  { s: 16, y: 'now',   rail: 'inst',  joint: 'documented', t: 'obstruction as payload' },
  { s: 17, y: '',      rail: 'turn',  joint: 'leap',       t: 'do not wait for the alignment' },
  { s: 19, y: '1972',  rail: 'turn',  joint: 'documented', t: 'somebody poured it themselves' },
  ],
};

CHAINS['everything-else-is-commentary-zine.html'] = {
  // Two rails, because this chain is two threads that keep swapping:
  //   proved    — what the mathematics actually established
  //   repeated  — what the sentence that travelled actually said
  // The four rail swaps are the argument: it crosses between them at 1975 (the title),
  // at 2007 (the careful revival), straight back for the dropped clause, and back again
  // for the field's ongoing dispute.
  rails: { proved: 26, repeated: 58, turn: 8 },
  railLabels: [['proved', 29], ['repeated', 61]],
  aria: 'two rails — what the mathematics established, and what the sentence that travelled said',
  reuse: {},
  nodes: [
  { s: 2,  y: '1871', rail: 'proved',   joint: 'documented', t: 'Darwin already had two levels' },
  { s: 3,  y: '1962-66', rail: 'proved', joint: 'documented', t: 'wrong, and correctly refuted' },
  { s: 4,  y: '1964', rail: 'proved',   joint: 'documented', t: "Hamilton's rule" },
  { s: 5,  y: '1970', rail: 'proved',   joint: 'documented', t: 'Price partitions it' },
  { s: 6,  y: '1975', rail: 'repeated', joint: 'documented', t: 'the title Maschler queried' },
  { s: 7,  y: '1976', rail: 'repeated', joint: 'documented', t: 'the correction was inside' },
  { s: 8,  y: '1979+', rail: 'repeated', joint: 'documented', t: 'he retracted it himself' },
  { s: 9,  y: '',     rail: 'repeated', joint: 'contested',  t: 'available, not proven causal' },
  { s: 10, y: '2007', rail: 'proved',   joint: 'documented', t: 'revived, carefully' },
  { s: 11, y: '2007', rail: 'repeated', joint: 'documented', t: 'the clause fell off — ours too' },
  { s: 12, y: '2010-11', rail: 'proved', joint: 'contested', t: 'still arguing, in Nature' },
  { s: 13, y: 'now',  rail: 'proved',   joint: 'contested',  t: 'one arithmetic, two ledgers' },
  { s: 14, y: '',     rail: 'turn',     joint: 'leap',       t: 'the level decides the repair' },
  ],
};

CHAINS['oblivious-to-encounter-zine.html'] = {
  // Two rails, and unlike the eclipse chain this one crosses ONCE. That single crossing
  // is the argument, so the two-rail form earns its keep even without repeated swaps:
  //   built  — what was engineered so it could be moved, repeated and scaled
  //   grown  — what only exists inside a relation, and so cannot be
  // Links 1-7 run entirely on `built`. Link 8 crosses to `grown` and stays there.
  // The turn is its own rail, as in every chain here.
  rails: { built: 26, grown: 58, turn: 8 },
  railLabels: [['built', 29], ['grown', 61]],
  aria: 'two rails \u2014 what was engineered to scale, and what only grows in relation',
  reuse: {},
  nodes: [
  // spread, year label, rail, joint tag on the edge ARRIVING at this node.
  // Node 1 carries a tag for COUNTING only \u2014 see the note on the eclipse chain above.
  { s: 2,  y: '1493',      rail: 'built', joint: 'documented', t: 'a crop that need not be bred' },
  { s: 3,  y: '16-17c',    rail: 'built', joint: 'documented', t: 'three things that could be moved' },
  { s: 4,  y: '17c',       rail: 'built', joint: 'documented', t: 'the land cut to the mill' },
  { s: 5,  y: '17c',       rail: 'built', joint: 'documented', t: 'industry before the homeland' },
  { s: 6,  y: '',          rail: 'built', joint: 'contested',  t: 'expanding without changing your mind' },
  { s: 7,  y: '',          rail: 'built', joint: 'documented', t: 'diversity that might change things' },
  { s: 8,  y: '1911',      rail: 'built', joint: 'documented', t: 'the same frame reaches the desk' },
  { s: 9,  y: '1950s-now', rail: 'grown', joint: 'documented', t: 'seventy years, no harvest' },
  { s: 10, y: '',          rail: 'grown', joint: 'documented', t: 'only a relation fruits' },
  { s: 11, y: 'mid-1970s', rail: 'grown', joint: 'documented', t: 'lost by abandonment' },
  { s: 12, y: '',          rail: 'turn',  joint: 'leap',       t: 'an accommodation is that diversity' },
  ],
};

const file0 = process.argv.slice(2).find(a => !a.startsWith('--'));
const key = file0 ? file0.replace(/^.*\//, '') : '';
CHAINS['the-name-was-already-the-verdict-zine.html'] = {
  // Two rails, and this chain crosses twice — out and back — because the whole argument is
  // that the same event has a maker's side and an institution's side:
  //   heard  — what a room, a listener or a musician did with the sound
  //   built  — what was engineered, named, legislated or enforced about it
  // Links 1-4 run on `heard`, 5-10 cross to `built`, 11-13 cross back. The two crossings are
  // the shape of the claim: the sound goes out into the apparatus and comes back renamed.
  rails: { heard: 26, built: 58, turn: 8 },
  railLabels: [['heard', 29], ['built', 61]],
  aria: 'two rails \u2014 what was heard, and what was built, named and enforced about it',
  reuse: {},
  nodes: [
  // spread, year label, rail, joint tag on the edge ARRIVING at this node.
  // Unlike the eclipse chain, node 1 here is Link 1 and its tag IS printed on the page
  // (spread 2 is the event rather than a link, and carries neither tag nor spine), so the
  // script's tally of 13 is exactly the number of tags a reader can count. Keep it that way.
  { s: 3,  y: '1957',  rail: 'heard', joint: 'documented', t: 'it was called Oddball' },
  { s: 4,  y: '1958',  rail: 'heard', joint: 'contested',  t: 'nobody agrees who named it' },
  { s: 5,  y: '1957',  rail: 'heard', joint: 'documented', t: 'a mic against an amp' },
  { s: 6,  y: '1958',  rail: 'heard', joint: 'documented', t: 'a pen through the tweeters' },
  { s: 7,  y: '1927',  rail: 'built', joint: 'documented', t: 'the ferry, and the blank page' },
  { s: 8,  y: '1580s', rail: 'built', joint: 'documented', t: 'twisted out of shape' },
  { s: 9,  y: '',      rail: 'built', joint: 'contested',  t: 'one reading, two names' },
  { s: 10, y: '1954',  rail: 'built', joint: 'documented', t: 'the hearings, and the Code' },
  { s: 11, y: '2012',  rail: 'built', joint: 'documented', t: 'the case notes, finally read' },
  { s: 12, y: '1958',  rail: 'built', joint: 'contested',  t: 'no line runs to this record' },
  { s: 13, y: '1958',  rail: 'heard', joint: 'documented', t: 'a word, a texture, a chart' },
  { s: 14, y: '2023',  rail: 'heard', joint: 'documented', t: 'inducted, eighteen years late' },
  { s: 15, y: 'now',   rail: 'heard', joint: 'leap',       t: 'read from outside' },
  ],
};

CHAINS['nobody-knows-where-the-dog-came-from-zine.html'] = {
  // Two rails, and this chain zigzags between them more than any other here — which is
  // the argument. The dog-origins dispute is not one field disagreeing with itself; it is
  // two methods that kept returning different answers about the same animal:
  //   bone    — what was dug up, measured, re-measured and reclassified
  //   genome  — what was sequenced, from living dogs and then from ancient ones
  // Five rail swaps in thirteen links. The truce (link 8) sits on `bone` because Larson
  // and Dobney's whole methodological claim was that morphometrics had to come back into
  // the room; everything after it runs on `genome`, which is where the field went.
  rails: { bone: 26, genome: 58, turn: 8 },
  railLabels: [['bone', 29], ['genome', 61]],
  aria: 'two rails \u2014 what was dug up and measured, and what was sequenced',
  reuse: {},
  nodes: [
  // spread, year label, rail, joint tag on the edge ARRIVING at this node.
  // As in No. 88, node 1 IS Link 1 and its tag is printed on the page (spread 2 is the
  // question rather than a link, and carries neither tag nor spine), so the script's
  // tally of 13 is exactly the number of link tags a reader can count. Keep it that way.
  { s: 3,  y: '1868', rail: 'bone',   joint: 'documented', t: 'Darwin concluded, not wondered' },
  { s: 4,  y: '1978', rail: 'bone',   joint: 'documented', t: 'a puppy under a hand' },
  { s: 5,  y: '1997', rail: 'genome', joint: 'documented', t: 'wolves \u2014 and co-authors' },
  { s: 6,  y: '2009', rail: 'genome', joint: 'contested',  t: 'south of the Yangtze' },
  { s: 7,  y: '2009', rail: 'bone',   joint: 'contested',  t: 'a skull in a drawer' },
  { s: 8,  y: '2015', rail: 'bone',   joint: 'contested',  t: 'measured again, in 3D' },
  { s: 9,  y: '2013', rail: 'genome', joint: 'contested',  t: 'Europe, says the other camp' },
  { s: 10, y: '2013', rail: 'bone',   joint: 'documented', t: 'the truce, and who paid for it' },
  { s: 11, y: '2016', rail: 'genome', joint: 'contested',  t: 'domesticated twice, possibly' },
  { s: 12, y: '2020', rail: 'genome', joint: 'documented', t: 'five lineages, one-way street' },
  { s: 13, y: '',     rail: 'genome', joint: 'leap',       t: 'why the street ran one way' },
  { s: 14, y: '2026', rail: 'genome', joint: 'documented', t: 'the oldest dog anyone has read' },
  { s: 15, y: 'now',  rail: 'turn',   joint: 'leap',       t: 'origin is not a prerequisite' },
  ],
};

const CHAIN = CHAINS[key];
if (!CHAIN) {
  console.error(`no chain config for ${key || '(no file given)'} — known: ${Object.keys(CHAINS).join(', ')}`);
  process.exit(1);
}
const NODES = CHAIN.nodes;
const REUSE = CHAIN.reuse;

const X0 = 64, X1 = 578, W = 620, H = 84;
const RAIL = CHAIN.rails;
const step = (X1 - X0) / (NODES.length - 1);
const x = i => +(X0 + i * step).toFixed(1);

// Edges: each node connects back to the previous node ON ANY rail, so the rail swaps are visible.
function edges(upto) {
  let d = '';
  for (let i = 1; i < NODES.length; i++) {
    const a = NODES[i - 1], b = NODES[i];
    const ya = RAIL[a.rail], yb = RAIL[b.rail];
    const xa = x(i - 1), xb = x(i);
    const dim = i > upto ? ' dim' : '';
    if (ya === yb) {
      d += `<path class="spine-track ${b.joint}${dim}" d="M${xa} ${ya} H${xb}"/>`;
    } else {
      // rail swap: step across with a short elbow so the change of thread is legible
      const mid = +(xa + step * 0.55).toFixed(1);
      d += `<path class="spine-track ${b.joint}${dim}" d="M${xa} ${ya} H${mid} V${yb} H${xb}"/>`;
    }
  }
  return d;
}

function spine(live) {
  const key = REUSE[live] ?? live;
  const i = NODES.findIndex(n => n.s === key);
  const n = NODES[i];
  const dots = NODES.map((m, j) => {
    if (j === i) return '';
    const cls = j > i ? 'spine-node dim' : 'spine-node';
    return `<circle class="${cls}" cx="${x(j)}" cy="${RAIL[m.rail]}" r="3.2"/>`;
  }).join('');
  const lx = x(i), ly = RAIL[n.rail];
  return [
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="`,
    `The chain so far, ${i + 1} of ${NODES.length}: ${CHAIN.aria}. `,
    `Live node: ${n.y ? n.y + ', ' : ''}${n.t}.">`,
    edges(i),
    ...CHAIN.railLabels.map(([t, yy]) => `<text class="spine-raillabel" x="0" y="${yy}">${t}</text>`),
    dots,
    `<circle class="spine-node live" cx="${lx}" cy="${ly}" r="4.4"/>`,
    `<circle class="spine-ring" cx="${lx}" cy="${ly}" r="8"/>`,
    `</svg>`,
    `<div class="spine-label">${i + 1} · ${n.y ? n.y + ' · ' : ''}${n.t}</div>`,
  ].join('');
}

const args = process.argv.slice(2);
const rebuild = args.includes('--rebuild');
const file = args.find(a => !a.startsWith('--'));
let html = fs.readFileSync(file, 'utf8');
let count = 0;

if (rebuild) {
  // Re-emit every spine in place. The spread number is read from the .spread-footer-right that
  // follows the spine block, so the mapping cannot drift out of step with the page.
  html = html.replace(
    /(<div class="spine">)[\s\S]*?(<\/div>\s*<div class="spread-footer">[\s\S]*?<span class="spread-footer-right">(\d+)<)/g,
    (_, open, rest, n) => { count++; return open + spine(+n) + rest; });
} else {
  html = html.replace(/<!--SPINE:(\d+)-->/g, (_, s2) => { count++; return spine(+s2); });
}

fs.writeFileSync(file, html);
console.log(`${rebuild ? 'rebuilt' : 'injected'} ${count} spine(s) · ${NODES.length} nodes · ` +
  `${NODES.filter(n => n.joint === 'documented').length} documented, ` +
  `${NODES.filter(n => n.joint === 'contested').length} contested, ` +
  `${NODES.filter(n => n.joint === 'leap').length} leap`);
