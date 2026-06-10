import React, { useState } from 'react';

// Mark all of one letter by tapping, then type how many. Checks the count.
export default function GridCount({ round, onComplete }) {
  const [marked, setMarked] = useState({});
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  function toggle(id) {
    setMarked((m) => ({ ...m, [id]: !m[id] }));
  }

  function check() {
    setChecked(true);
    const ok = round.pair.every(
      (p) => Number(answers[p]) === round.counts[p]
    );
    if (ok) setTimeout(onComplete, 700);
  }

  return (
    <section className="ex">
      <p className="prompt">{round.instruction}</p>
      <div
        className="grid grid-count"
        style={{ gridTemplateColumns: `repeat(${round.cols}, 1fr)` }}
      >
        {round.items.map((it) => (
          <button
            key={it.id}
            className={`cell ${marked[it.id] ? 'mark' : ''}`}
            onClick={() => toggle(it.id)}
          >
            {it.glyph}
          </button>
        ))}
      </div>

      <div className="counts">
        {round.pair.map((p) => {
          const correct = checked && Number(answers[p]) === round.counts[p];
          const wrong = checked && Number(answers[p]) !== round.counts[p];
          return (
            <label key={p} className={`count-row ${correct ? 'ok' : ''} ${wrong ? 'bad' : ''}`}>
              <span className="big-letter">{p}</span>
              <span>¿Cuántas hay?</span>
              <input
                type="number"
                min="0"
                value={answers[p] ?? ''}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [p]: e.target.value }))
                }
              />
            </label>
          );
        })}
      </div>
      <button className="primary" onClick={check}>
        Comprobar
      </button>
    </section>
  );
}
