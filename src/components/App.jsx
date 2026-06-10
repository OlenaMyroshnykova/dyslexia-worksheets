import React, { useState, useMemo } from 'react';
import { buildRound, LEVELS, randomSeed } from '../lib/generator.js';
import { downloadPdf } from '../lib/pdf.js';
import FindLetter from './FindLetter.jsx';
import ColorLetter from './ColorLetter.jsx';
import GridCount from './GridCount.jsx';
import CrossReversed from './CrossReversed.jsx';
import ChooseWord from './ChooseWord.jsx';

const EXERCISE_VIEWS = {
  'find-letter': FindLetter,
  'color-letter': ColorLetter,
  'grid-count': GridCount,
  'cross-reversed': CrossReversed,
  'choose-word': ChooseWord,
};

const CHEERS = ['¡Muy bien!', '¡Genial!', '¡Lo lograste!', '¡Buen trabajo!', '¡Eres un crack!'];

export default function App() {
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(randomSeed());
  const [done, setDone] = useState(false);

  const round = useMemo(() => buildRound({ level, seed }), [level, seed]);
  const View = EXERCISE_VIEWS[round.type];

  function next() {
    setDone(false);
    setSeed(randomSeed());
  }

  // Build a printable PDF: a small mixed set across the chosen level.
  function makePrintable() {
    const sheets = Array.from({ length: 6 }, () =>
      buildRound({ level, seed: randomSeed() })
    );
    downloadPdf(sheets, `fichas-dislexia-nivel-${level}.pdf`);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>🦁</span>
          <h1>Fichas de dislexia</h1>
        </div>
        <button className="ghost" onClick={makePrintable}>
          Descargar PDF para imprimir
        </button>
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
            <button className="primary" onClick={next}>
              Siguiente ronda
            </button>
          </div>
        ) : (
          <View key={seed} round={round} onComplete={() => setDone(true)} />
        )}
      </main>

      <footer className="foot">
        <button className="link" onClick={next}>
          Otra ficha
        </button>
        <span className="sep">·</span>
        <span className="muted">
          Ayuda de aprendizaje, no una evaluación
        </span>
      </footer>
    </div>
  );
}
