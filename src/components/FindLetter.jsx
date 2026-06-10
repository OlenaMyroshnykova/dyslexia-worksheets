import React, { useState } from 'react';

// Tap every circle that shows the target letter. Correct → green and locked.
// Wrong → gentle shake, no penalty, can keep trying.
export default function FindLetter({ round, onComplete }) {
  const total = round.items.filter((i) => i.isTarget).length;
  const [found, setFound] = useState({});
  const [shake, setShake] = useState(null);

  const foundCount = Object.keys(found).length;

  function tap(item) {
    if (found[item.id]) return;
    if (item.isTarget) {
      const next = { ...found, [item.id]: true };
      setFound(next);
      if (Object.keys(next).length === total) {
        setTimeout(onComplete, 500);
      }
    } else {
      setShake(item.id);
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <section className="ex">
      <p className="prompt">{round.instruction}</p>
      <p className="progress">
        {foundCount} de {total} encontradas
      </p>
      <div className="grid grid-find">
        {round.items.map((it) => (
          <button
            key={it.id}
            className={`tile ${found[it.id] ? 'ok' : ''} ${shake === it.id ? 'shake' : ''}`}
            onClick={() => tap(it)}
            aria-label={String(it.glyph)}
          >
            {it.glyph}
          </button>
        ))}
      </div>
    </section>
  );
}
