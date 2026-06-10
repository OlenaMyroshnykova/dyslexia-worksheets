import React, { useState } from 'react';

// Tap only the mirrored letters. Reversed glyphs render flipped via CSS.
export default function CrossReversed({ round, onComplete }) {
  const [crossed, setCrossed] = useState({});
  const [shake, setShake] = useState(null);

  const targets = round.items.filter((i) => i.correct).length;
  const got = Object.keys(crossed).length;

  function tap(item) {
    if (crossed[item.id]) return;
    if (item.correct) {
      const next = { ...crossed, [item.id]: true };
      setCrossed(next);
      if (Object.keys(next).length === targets) setTimeout(onComplete, 500);
    } else {
      setShake(item.id);
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <section className="ex">
      <p className="prompt">{round.instruction}</p>
      <p className="progress">
        {got} de {targets} tachadas
      </p>
      <div className="grid grid-reversed">
        {round.items.map((it) => (
          <button
            key={it.id}
            className={`tile glyph ${crossed[it.id] ? 'crossed ok' : ''} ${shake === it.id ? 'shake' : ''}`}
            onClick={() => tap(it)}
          >
            <span className={it.reversed ? 'mirror' : ''}>{round.glyph}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
