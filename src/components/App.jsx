import React, { useState, useMemo } from 'react';
import { buildRound, LEVELS, randomSeed } from '../lib/generator.js';
import { downloadPdf } from '../lib/pdf.js';
import FindLetter from './FindLetter.jsx';
import ColorLetter from './ColorLetter.jsx';
import GridCount from './GridCount.jsx';
import CrossReversed from './CrossReversed.jsx';
import ChooseWord from './ChooseWord.jsx';
import '../styles/basket.css';

const EXERCISE_VIEWS = {
  'find-letter': FindLetter,
  'color-letter': ColorLetter,
  'grid-count': GridCount,
  'cross-reversed': CrossReversed,
  'choose-word': ChooseWord,
};

const CHEERS = ['¡Muy bien!', '¡Genial!', '¡Lo lograste!', '¡Buen trabajo!', '¡Eres un crack!'];

// Spanish label for each exercise type, used in the PDF basket list.
const TYPE_LABELS = {
  'find-letter': 'Encuentra la letra',
  'color-letter': 'Colorea por letra',
  'grid-count': 'Cuenta las letras',
  'cross-reversed': 'Letras al revés',
  'choose-word': 'Palabra correcta',
};

export default function App() {
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(randomSeed());
  const [done, setDone] = useState(false);

  // The "PDF basket": exercises the parent has chosen to collect.
  // Each entry is a full round object (same shape the PDF builder expects),
  // plus a unique key so React lists and removal work cleanly.
  const [basket, setBasket] = useState([]);

  const round = useMemo(() => buildRound({ level, seed }), [level, seed]);
  const View = EXERCISE_VIEWS[round.type];

  // Regenerate the on-screen exercise. Picks a fresh seed, so item positions
  // and target letters change every time (generator stays seeded/reproducible).
  function regenerate() {
    setDone(false);
    setSeed(randomSeed());
  }

  // Add the exercise currently on screen to the PDF basket.
  function addToPdf() {
    setBasket((b) => [...b, { ...round, _key: `${round.seed}-${b.length}` }]);
  }

  function removeFromBasket(key) {
    setBasket((b) => b.filter((ex) => ex._key !== key));
  }

  function clearBasket() {
    setBasket([]);
  }

  // Build one PDF from everything collected, in the order it was added.
  function downloadBasket() {
    if (basket.length === 0) return;
    downloadPdf(basket, `fichas-dislexia-${basket.length}.pdf`);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>🦁</span>
          <h1>Fichas de dislexia</h1>
        </div>
      </header>

      <nav className="levels" aria-label="Niveles">
        {Object.entries(LEVELS).map(([n, info]) => (
          <button
            key={n}
            className={`chip ${Number(n) === level ? 'on' : ''}`}
            onClick={() => {
              setLevel(Number(n));
              setSeed(randomSeed());
              setDone(false);
            }}
          >
            <b>{n}</b> {info.label}
          </button>
        ))}
      </nav>

      <main className="stage">
        {done ? (
          <div className="cheer">
            <p className="cheer-big">{CHEERS[seed % CHEERS.length]}</p>
            <button className="primary" onClick={regenerate}>
              Otra ficha
            </button>
          </div>
        ) : (
          <View key={seed} round={round} onComplete={() => setDone(true)} />
        )}
      </main>

      {/* Action bar: regenerate this exercise · add it to the PDF basket */}
      <div className="actionbar">
        <button className="action" onClick={regenerate}>
          🔄 Otra ficha
        </button>
        <button className="action primary-action" onClick={addToPdf}>
          ➕ Añadir al PDF
        </button>
      </div>

      {/* PDF basket: grows as the parent collects a mix of exercise types */}
      <section className="basket" aria-label="Fichas para el PDF">
        <div className="basket-head">
          <span className="basket-count">
            En el PDF: <b>{basket.length}</b>
          </span>
          <div className="basket-actions">
            <button
              className="action"
              onClick={downloadBasket}
              disabled={basket.length === 0}
            >
              ⬇️ Descargar PDF
            </button>
            {basket.length > 0 && (
              <button className="link" onClick={clearBasket}>
                Vaciar
              </button>
            )}
          </div>
        </div>

        {basket.length === 0 ? (
          <p className="basket-empty">
            Añade fichas de distintos tipos y niveles, y descárgalas juntas en un PDF.
          </p>
        ) : (
          <ol className="basket-list">
            {basket.map((ex) => (
              <li key={ex._key} className="basket-item">
                <span className="basket-type">{TYPE_LABELS[ex.type] || ex.type}</span>
                <button
                  className="basket-remove"
                  onClick={() => removeFromBasket(ex._key)}
                  aria-label="Quitar"
                  title="Quitar"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="foot">
        <span className="muted">Ayuda de aprendizaje, no una evaluación</span>
      </footer>
    </div>
  );
}
