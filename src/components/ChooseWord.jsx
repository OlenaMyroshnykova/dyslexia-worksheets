import React, { useState } from 'react';

// For each picture, tap the correctly spelled word.
export default function ChooseWord({ round, onComplete }) {
  const [picked, setPicked] = useState({});
  const [shake, setShake] = useState(null);

  const allDone = round.rows.every((r) => picked[r.id] === r.correctIndex);

  function choose(row, idx) {
    if (picked[row.id] === row.correctIndex) return;
    if (idx === row.correctIndex) {
      const next = { ...picked, [row.id]: idx };
      setPicked(next);
      if (round.rows.every((r) => next[r.id] === r.correctIndex))
        setTimeout(onComplete, 600);
    } else {
      setShake(`${row.id}-${idx}`);
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <section className="ex">
      <p className="prompt">{round.instruction}</p>
      <div className="words">
        {round.rows.map((r) => (
          <div className="word-row" key={r.id}>
            <span className="word-emoji" aria-hidden>
              {r.emoji}
            </span>
            <div className="word-options">
              {r.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={`word-opt
                    ${picked[r.id] === r.correctIndex && idx === r.correctIndex ? 'ok' : ''}
                    ${shake === `${r.id}-${idx}` ? 'shake' : ''}`}
                  onClick={() => choose(r, idx)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
