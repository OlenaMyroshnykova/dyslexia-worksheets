import React, { useState, useMemo, useEffect } from 'react';
import { buildRound, LEVELS, randomSeed } from '../lib/generator.js';
import { downloadPdf, buildPdf } from '../lib/pdf.js';
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

  // PDF basket: each entry is a full round object + a stable _key.
  const [basket, setBasket] = useState([]);

  // Which basket page is previewed in the left area (null = play mode).
  const [previewKey, setPreviewKey] = useState(null);

  const round = useMemo(() => buildRound({ level, seed }), [level, seed]);
  const View = EXERCISE_VIEWS[round.type];

  function regenerate() {
    setDone(false);
    setPreviewKey(null);
    setSeed(randomSeed());
  }

  function addToPdf() {
    setBasket((b) => [...b, { ...round, _key: `${round.seed}-${b.length}-${Math.random().toString(36).slice(2, 7)}` }]);
  }

  function removeFromBasket(key) {
    setBasket((b) => b.filter((ex) => ex._key !== key));
    setPreviewKey((cur) => (cur === key ? null : cur));
  }

  function clearBasket() {
    setBasket([]);
    setPreviewKey(null);
  }

  function downloadBasket() {
    if (basket.length === 0) return;
    downloadPdf(basket, `fichas-dislexia-${basket.length}.pdf`);
  }

  const previewEx = basket.find((ex) => ex._key === previewKey) || null;
  const previewIndex = basket.findIndex((ex) => ex._key === previewKey) + 1;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>🦁</span>
          <h1>Fichas de dislexia</h1>
        </div>
      </header>

      {/* Top toolbar: regenerate + add (left) .... download (right) */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="action" onClick={regenerate}>
            🔄 Otra ficha
          </button>
          <button className="action primary-action" onClick={addToPdf}>
            ➕ Añadir al PDF
          </button>
        </div>
        <div className="toolbar-right">
          <button
            className="action"
            onClick={downloadBasket}
            disabled={basket.length === 0}
          >
            ⬇️ Descargar PDF{basket.length ? ` (${basket.length})` : ''}
          </button>
        </div>
      </div>

      <nav className="levels" aria-label="Niveles">
        {Object.entries(LEVELS).map(([n, info]) => (
          <button
            key={n}
            className={`chip ${Number(n) === level ? 'on' : ''}`}
            onClick={() => {
              setLevel(Number(n));
              setPreviewKey(null);
              setSeed(randomSeed());
              setDone(false);
            }}
          >
            <b>{n}</b> {info.label}
          </button>
        ))}
      </nav>

      {/* Two columns: stage / preview on the left, page list on the right */}
      <div className="layout">
        <main className="stage">
          {previewEx ? (
            <PdfPreview
              exercise={previewEx}
              index={previewIndex}
              onClose={() => setPreviewKey(null)}
              onRemove={() => removeFromBasket(previewEx._key)}
            />
          ) : done ? (
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

        <aside className="basket" aria-label="Fichas para el PDF">
          <div className="basket-head">
            <span className="basket-count">
              En el PDF: <b>{basket.length}</b>
            </span>
            {basket.length > 0 && (
              <button className="link" onClick={clearBasket}>
                Vaciar
              </button>
            )}
          </div>

          {basket.length === 0 ? (
            <p className="basket-empty">
              Añade fichas y aparecerán aquí. Toca una para verla antes de imprimir.
            </p>
          ) : (
            <ol className="basket-list">
              {basket.map((ex) => (
                <li
                  key={ex._key}
                  className={`basket-item ${ex._key === previewKey ? 'active' : ''}`}
                >
                  <button
                    className="basket-open"
                    onClick={() => setPreviewKey(ex._key)}
                    title="Ver esta página"
                  >
                    <span className="basket-type">{TYPE_LABELS[ex.type] || ex.type}</span>
                  </button>
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
        </aside>
      </div>

      <footer className="foot">
        <span className="muted">Ayuda de aprendizaje, no una evaluación</span>
      </footer>
    </div>
  );
}

// Shows one exercise exactly as it will print, using the real PDF builder
// (buildPdf) turned into a Blob URL displayed in an <iframe>. Re-renders once
// web fonts are ready so mirrored glyphs (cross-reversed) look right.
function PdfPreview({ exercise, index, onClose, onRemove }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    function build() {
      try {
        const doc = buildPdf([exercise]);
        const blob = doc.output('blob');
        const next = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(next);
          return;
        }
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = next;
        setUrl(next);
      } catch (e) {
        console.error('No se pudo generar la vista previa', e);
        if (!cancelled) setUrl(null);
      }
    }

    build();
    // Rebuild after fonts load so canvas-drawn glyphs use Lexend.
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) build();
      });
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [exercise]);

  return (
    <div className="preview">
      <div className="preview-bar">
        <span className="preview-title">
          Página {index} · {TYPE_LABELS[exercise.type] || exercise.type}
        </span>
        <div className="preview-actions">
          <button className="action" onClick={onClose}>
            ↩ Volver a jugar
          </button>
          <button className="action danger" onClick={onRemove}>
            🗑 Quitar
          </button>
        </div>
      </div>
      {url ? (
        <iframe className="preview-frame" title="Vista previa de la ficha" src={url} />
      ) : (
        <p className="basket-empty">Generando vista previa…</p>
      )}
    </div>
  );
}
