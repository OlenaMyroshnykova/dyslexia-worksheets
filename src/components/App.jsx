import React, { useState, useMemo, useEffect } from 'react';
import { buildRound, randomSeed } from '../lib/generator.js';
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

// Exercise types chosen directly from a dropdown. Each carries the difficulty
// `level` that keeps the exercise meaningful (e.g. find-letter at level 2 uses
// confusable pairs b/d, p/q rather than one easy letter; color-letter at
// level 3 includes the "cross out the extra" letter).
const TYPES = [
  { value: 'find-letter', label: 'Encuentra la letra', level: 2 },
  { value: 'color-letter', label: 'Colorea por letra', level: 3 },
  { value: 'grid-count', label: 'Cuenta las letras', level: 2 },
  { value: 'cross-reversed', label: 'Letras al revés', level: 3 },
  { value: 'choose-word', label: 'Palabra correcta', level: 4 },
];

const TYPE_LABELS = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));
const TYPE_LEVEL = Object.fromEntries(TYPES.map((t) => [t.value, t.level]));

export default function App() {
  const [type, setType] = useState(TYPES[0].value);
  const [seed, setSeed] = useState(randomSeed());
  const [done, setDone] = useState(false);

  // PDF basket: each entry is a full round object + a stable _key.
  const [basket, setBasket] = useState([]);

  // Which basket page is previewed in the left area (null = play mode).
  const [previewKey, setPreviewKey] = useState(null);

  const round = useMemo(
    () => buildRound({ type, level: TYPE_LEVEL[type], seed }),
    [type, seed]
  );
  const View = EXERCISE_VIEWS[round.type];

  // "Mezclar" — shuffle: a fresh seed regenerates the current exercise type
  // with new positions and target letters.
  function mezclar() {
    setDone(false);
    setPreviewKey(null);
    setSeed(randomSeed());
  }

  function changeType(value) {
    setType(value);
    setPreviewKey(null);
    setSeed(randomSeed());
    setDone(false);
  }

  function addToPdf() {
    setBasket((b) => [
      ...b,
      { ...round, _key: `${round.seed}-${b.length}-${Math.random().toString(36).slice(2, 7)}` },
    ]);
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

      {/* Single-row toolbar: type dropdown · Mezclar · Add · Download */}
      <div className="toolbar">
        <label className="toolbar-field">
          <span className="toolbar-label">FICHA</span>
          <select
            className="ficha-select"
            value={type}
            onChange={(e) => changeType(e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <button className="btn btn-mezclar" onClick={mezclar}>
          🔀 Mezclar
        </button>

        <button className="btn btn-add" onClick={addToPdf}>
          ➕ Añadir al PDF
        </button>

        <button className="btn btn-print" onClick={downloadBasket} disabled={basket.length === 0}>
          🖨 Descargar PDF{basket.length ? ` (${basket.length})` : ''}
        </button>
      </div>

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
              <button className="btn btn-mezclar" onClick={mezclar}>
                🔀 Mezclar
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
          <button className="btn btn-light" onClick={onClose}>
            ↩ Volver a jugar
          </button>
          <button className="btn btn-danger" onClick={onRemove}>
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
