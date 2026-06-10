import React, { useState } from 'react';

// Tap a color in the key to select it, then tap letters to fill them.
// The ✗ letter must be crossed out (tap it with no color selected).
export default function ColorLetter({ round, onComplete }) {
  const [brush, setBrush] = useState(null);
  const [fills, setFills] = useState({});
  const [shake, setShake] = useState(null);

  const colorables = round.items.filter((i) => !i.ignore);
  const solved =
    colorables.every((i) => fills[i.id] === i.color) &&
    round.items.filter((i) => i.ignore).every((i) => fills[i.id] === 'x');

  function tap(item) {
    if (fills[item.id]) return;
    if (item.ignore) {
      if (brush === null) {
        commit(item.id, 'x');
      } else {
        wrong(item.id);
      }
      return;
    }
    if (brush === item.color) {
      commit(item.id, item.color);
    } else {
      wrong(item.id);
    }
  }

  function commit(id, val) {
    const next = { ...fills, [id]: val };
    setFills(next);
    const ok =
      colorables.every((i) => next[i.id] === i.color) &&
      round.items.filter((i) => i.ignore).every((i) => next[i.id] === 'x');
    if (ok) setTimeout(onComplete, 500);
  }

  function wrong(id) {
    setShake(id);
    setTimeout(() => setShake(null), 400);
  }

  return (
    <section className="ex">
      <p className="prompt">{round.instruction}</p>

      <div className="key">
        {Object.entries(round.key).map(([glyph, color]) => (
          <button
            key={glyph}
            className={`key-chip ${brush === color ? 'on' : ''}`}
            style={{ background: color }}
            onClick={() => setBrush(brush === color ? null : color)}
          >
            {glyph}
          </button>
        ))}
        {round.ignore && (
          <button
            className={`key-chip ignore ${brush === null ? 'on' : ''}`}
            onClick={() => setBrush(null)}
            title="Tacha esta letra"
          >
            {round.ignore} ✗
          </button>
        )}
      </div>

      <div className="grid grid-find">
        {round.items.map((it) => {
          const fill = fills[it.id];
          const crossed = fill === 'x';
          return (
            <button
              key={it.id}
              className={`tile ${shake === it.id ? 'shake' : ''} ${crossed ? 'crossed' : ''}`}
              style={fill && fill !== 'x' ? { background: fill } : undefined}
              onClick={() => tap(it)}
            >
              {it.glyph}
            </button>
          );
        })}
      </div>
      {!brush && !round.ignore && (
        <p className="hint">Elige un color y luego toca las letras</p>
      )}
    </section>
  );
}
