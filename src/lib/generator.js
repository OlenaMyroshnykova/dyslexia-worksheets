// generator.js
// Pure, framework-agnostic logic for building dyslexia visual-discrimination
// exercises. Used by both the interactive app and the printable PDF builder,
// so the exact same exercise can appear on screen and on paper.
//
// Every generator returns a plain, serialisable object. No DOM, no React.

/* ------------------------------------------------------------------ */
/* Letter sets                                                         */
/* ------------------------------------------------------------------ */

// Confusable pairs/groups taken from the edufichas cuadernos 1 & 2.
// `mirror` holds glyphs used for the "cross out the reversed ones" task.
export const CONFUSABLE_GROUPS = {
  bd: ['b', 'd'],
  pq: ['p', 'q'],
  bdpq: ['b', 'd', 'p', 'q'],
  nu: ['n', 'u'],
  mw: ['m', 'w'],
  uv: ['u', 'v'],
  epq: ['e', 'p', 'q'],
  sz: ['s', 'z'],
};

// Glyph plus its mirror image. The mirror is rendered by CSS transform in the
// app and by a flipped draw in the PDF, so we only need a flag, not a fake
// unicode character (those render inconsistently across fonts).
export const MIRRORABLE = ['a', 'e', 'd', 's', 'p', 'q', 'n'];

export const DIGIT_REVERSAL = ['5'];

/* ------------------------------------------------------------------ */
/* Word bank for the "choose the correct spelling" task                */
/* Each item: picture emoji, correct word, the letter swapped to make  */
/* the wrong version. Sourced from the cuaderno 2 examples.            */
/* ------------------------------------------------------------------ */

export const WORD_BANK = [
  { emoji: '🦔', word: 'el erizo es bonito', swap: ['b', 'd'] },
  { emoji: '🍌', word: 'me gusta el plátano', swap: ['p', 'q'] },
  { emoji: '🐢', word: 'la tortuga nadadora', swap: ['u', 'v'] },
  { emoji: '🐦', word: 'pajarito azul', swap: ['p', 'q'] },
  { emoji: '🍰', word: 'la tarta de fresa', swap: ['d', 'b'] },
  { emoji: '⚽', word: 'balón para jugar', swap: ['p', 'q'] },
  { emoji: '🍗', word: 'comí pollo asado', swap: ['d', 'b'] },
  { emoji: '🔑', word: 'la llave de mi casa', swap: ['v', 'u'] },
  { emoji: '🍬', word: 'caramelos de colores', swap: ['d', 'b'] },
  { emoji: '👟', word: 'zapatillas rojas', swap: ['p', 'q'] },
  { emoji: '🧁', word: 'tarta de sabores', swap: ['b', 'd'] },
  { emoji: '👧', word: 'trenzas moradas', swap: ['z', 's'] },
  { emoji: '🧥', word: 'jersey verde', swap: ['d', 'b'] },
  { emoji: '👒', word: 'sombrero amarillo', swap: ['m', 'w'] },
];

/* ------------------------------------------------------------------ */
/* Color palette for "color by letter" (soft, distinct, low glare)     */
/* ------------------------------------------------------------------ */

export const COLOR_KEY = {
  pink: '#F7B6C8',
  yellow: '#F6E58D',
  orange: '#F6A04D',
  purple: '#C3A6E8',
  mint: '#9DE0C8',
  blue: '#9CC9F0',
};

/* ------------------------------------------------------------------ */
/* RNG helpers                                                         */
/* ------------------------------------------------------------------ */

// Mulberry32 — small seeded PRNG so a worksheet on paper can match the
// screen exactly when a seed is shared, and so PDFs are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/* Exercise generators                                                 */
/* Each returns: { type, instruction, seed, ...payload }              */
/* `items` entries carry an `isTarget` / `correct` flag so the app and */
/* the answer-key PDF both know what's right without re-deriving it.   */
/* ------------------------------------------------------------------ */

// 1. Find the target letter (circle it)
export function genFindLetter({ seed, target, distractors, count = 30 } = {}) {
  const rng = makeRng(seed);
  const items = [];
  // Guarantee a reasonable number of targets (~35% of items).
  const targetCount = Math.max(4, Math.round(count * 0.35));
  for (let i = 0; i < targetCount; i++) items.push({ glyph: target, isTarget: true });
  while (items.length < count)
    items.push({ glyph: pick(rng, distractors), isTarget: false });
  return {
    type: 'find-letter',
    instruction: `Rodea con un círculo la letra ${target}`,
    seed,
    target,
    items: shuffle(rng, items).map((it, i) => ({ ...it, id: i })),
  };
}

// 2. Color by letter
export function genColorByLetter({ seed, group, colors, count = 36, ignore } = {}) {
  const rng = makeRng(seed);
  const key = {};
  group.forEach((g, i) => (key[g] = colors[i]));
  const items = [];
  while (items.length < count) {
    const glyph = pick(rng, group.concat(ignore ? [ignore] : []));
    items.push({
      glyph,
      color: glyph === ignore ? null : key[glyph],
      ignore: glyph === ignore,
    });
  }
  return {
    type: 'color-letter',
    instruction: 'Colorea las siguientes letras con estos colores:',
    seed,
    key,
    ignore: ignore || null,
    items: shuffle(rng, items).map((it, i) => ({ ...it, id: i })),
  };
}

// 3. Grid count
export function genGridCount({ seed, pair, rows = 5, cols = 5 } = {}) {
  const rng = makeRng(seed);
  const items = [];
  for (let i = 0; i < rows * cols; i++) {
    const glyph = pick(rng, pair);
    items.push({ glyph, id: i });
  }
  const counts = {};
  pair.forEach((p) => (counts[p] = items.filter((it) => it.glyph === p).length));
  return {
    type: 'grid-count',
    instruction: '¿Cuántas hay de cada una?',
    seed,
    pair,
    rows,
    cols,
    counts,
    items,
  };
}

// 4. Cross out the reversed/mirrored ones
export function genCrossReversed({ seed, glyph, count = 16, reversedRatio = 0.4 } = {}) {
  const rng = makeRng(seed);
  const items = [];
  for (let i = 0; i < count; i++) {
    const reversed = rng() < reversedRatio;
    items.push({ glyph, reversed, correct: reversed, id: i });
  }
  // Ensure at least 3 reversed so the task isn't empty.
  if (items.filter((i) => i.reversed).length < 3) {
    for (let i = 0; i < 3; i++) {
      items[i].reversed = true;
      items[i].correct = true;
    }
  }
  return {
    type: 'cross-reversed',
    instruction: 'Tacha aquellas letras que estén al revés',
    seed,
    glyph,
    items: shuffle(rng, items).map((it, i) => ({ ...it, id: i })),
  };
}

// 5. Choose the correct word
export function genChooseWord({ seed, count = 4 } = {}) {
  const rng = makeRng(seed);
  const chosen = shuffle(rng, WORD_BANK).slice(0, count);
  const rows = chosen.map((w, i) => {
    const [from, to] = w.swap;
    // Build the wrong spelling by replacing first occurrence of `from`.
    const wrong = w.word.replace(from, to);
    const correctFirst = rng() < 0.5;
    return {
      id: i,
      emoji: w.emoji,
      options: correctFirst ? [w.word, wrong] : [wrong, w.word],
      correctIndex: correctFirst ? 0 : 1,
      errorLetter: to,
    };
  });
  return {
    type: 'choose-word',
    instruction: 'Rodea el correcto. Señala los errores',
    seed,
    rows,
  };
}

/* ------------------------------------------------------------------ */
/* Round builder — difficulty-aware                                    */
/* level 1: one target          level 2: two confusables              */
/* level 3: mirrored / digits   level 4: word-level                   */
/* ------------------------------------------------------------------ */

export const LEVELS = {
  1: { label: 'Una letra', types: ['find-letter'] },
  2: { label: 'Dos letras parecidas', types: ['find-letter', 'grid-count', 'color-letter'] },
  3: { label: 'Letras al revés', types: ['cross-reversed', 'color-letter', 'grid-count'] },
  4: { label: 'Palabras', types: ['choose-word'] },
};

export function buildRound({ level = 1, type, seed = randomSeed() } = {}) {
  const rng = makeRng(seed);
  const allowed = LEVELS[level]?.types || ['find-letter'];
  const t = type || pick(rng, allowed);

  switch (t) {
    case 'find-letter': {
      if (level === 1) {
        const target = pick(rng, ['b', 'd', 'p', 'q', 'n', 'u', 's', '5']);
        const easy = ['a', 'o', 'e', 'm', 'r', 't', 'l'].filter((c) => c !== target);
        return genFindLetter({ seed, target, distractors: shuffle(rng, easy).slice(0, 4) });
      }
      const group = pick(rng, [CONFUSABLE_GROUPS.bd, CONFUSABLE_GROUPS.pq, CONFUSABLE_GROUPS.nu]);
      const target = pick(rng, group);
      const distractors = group.filter((g) => g !== target);
      return genFindLetter({ seed, target, distractors });
    }
    case 'color-letter': {
      const group = pick(rng, [CONFUSABLE_GROUPS.bdpq, CONFUSABLE_GROUPS.epq]);
      const colors = shuffle(rng, Object.values(COLOR_KEY)).slice(0, group.length);
      const ignore = level >= 3 ? pick(rng, ['s', 'z']) : null;
      return genColorByLetter({ seed, group, colors, ignore });
    }
    case 'grid-count': {
      const pair = pick(rng, [
        CONFUSABLE_GROUPS.bd,
        CONFUSABLE_GROUPS.pq,
        CONFUSABLE_GROUPS.mw,
        CONFUSABLE_GROUPS.nu,
      ]);
      return genGridCount({ seed, pair });
    }
    case 'cross-reversed': {
      const glyph = pick(rng, MIRRORABLE);
      return genCrossReversed({ seed, glyph });
    }
    case 'choose-word':
      return genChooseWord({ seed });
    default:
      return genFindLetter({ seed, target: 'b', distractors: ['d'] });
  }
}
