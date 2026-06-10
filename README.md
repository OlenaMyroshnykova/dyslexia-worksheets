# Fichas de dislexia · Dyslexia Worksheets

An interactive trainer **and** printable-PDF generator that helps children
practice **visual discrimination** of easily-confused letters and numbers —
letter reversals and rotations (b/d/p/q, n/u, m/w, e/ɘ, s/z) and digit
reversals (5/Ƨ).

Everything works two ways:

- **Online** — tappable, child-friendly exercises with gentle feedback.
- **On paper** — generate a PDF of the same exercise types, take it to a copy
  shop, and work it by hand with a pencil.

> Learning aid, not an assessment. It never labels or diagnoses the child.

---

## Exercise types

| Type | What the child does | Source format |
|------|--------------------|---------------|
| **Find the letter** | Tap every instance of a target letter among confusable distractors | _Rodea con un círculo la letra X_ |
| **Color by letter** | Fill each letter with the color from a key; cross out the ✗ letter | _Colorea las siguientes letras_ |
| **Grid count** | Mark one of two confusable letters and count how many | _¿Cuántas hay?_ |
| **Cross out reversed** | Tap only the mirror-flipped letters | _Tacha las letras al revés_ |
| **Choose the word** | Pick the correctly spelled word (one option has a reversed letter) | _Rodea el correcto_ |

## Difficulty progression

1. **One** target letter vs. easy distractors.
2. **Two** highly-confusable letters (b/d, p/q, n/u, m/w).
3. **Mirrored / rotated** variants and digit reversals.
4. **Word-level** spelling choices that fold the letter skill into reading.

## Design (dyslexia-friendly)

- Rounded sans-serif (Lexend), generously sized, no italics.
- High letter and line spacing, few items per screen, lots of whitespace.
- Off-white / cream background to reduce glare; soft, distinct colors.
- Big circular tap targets for small fingers.
- Immediate, gentle feedback — correct turns green, wrong gives a soft shake
  and lets the child retry. Never a harsh "wrong."

## Language

The exercises default to **Spanish** (the b/d/p/q confusion is identical in
Spanish and English). Letter-reversal practice transfers across both; only the
word-spelling task is language-specific. A language toggle for word tasks is on
the roadmap.

---

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. Build a static site with `npm run build` (output in
`dist/`).

## Generate a printable PDF

Click **Descargar PDF para imprimir** in the app, or call the builder directly:

```js
import { buildRound } from './src/lib/generator.js';
import { downloadPdf } from './src/lib/pdf.js';

const sheets = Array.from({ length: 6 }, () => buildRound({ level: 2 }));
downloadPdf(sheets, 'fichas.pdf');
```

The generator is **seeded**, so the same `seed` reproduces the same sheet on
screen and on paper.

---

## Project structure

```
src/
  lib/
    generator.js   exercise logic (shared by app + PDF), seeded RNG
    pdf.js         jsPDF printable-worksheet builder
  components/      one React component per exercise type + App shell
  styles/          dyslexia-friendly stylesheet
```

## Roadmap

- [ ] Language toggle (ES / EN) for word-spelling tasks
- [ ] Answer-key PDF page for parents/teachers
- [ ] OpenDyslexic font option
- [ ] Pick specific letter pairs to drill
- [ ] Save favorite worksheet sets

## Credits & license

Exercise **formats** are inspired by the free dyslexia cuadernos from
[edufichas.com](https://www.edufichas.com/dislexia/). This project reimplements
the activity types with its own code, layout, and content — it does not copy
their worksheets or artwork.

Code released under the [MIT License](LICENSE).
