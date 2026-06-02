import { useState } from "react";

function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function Home({ onEnter }) {
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError("pick a display name first");
    if (mode === "create") {
      onEnter({ code: randomCode(), name: n });
    } else {
      const c = code.trim();
      if (!/^\d{4}$/.test(c)) return setError("game codes are 4 digits");
      onEnter({ code: c, name: n });
    }
  }

  return (
    <div className="home">
      <div className="home-grid" aria-hidden="true" />
      <div className="home-card">
        <div className="brand">
          <span className="brand-bot">🤖</span>
          <h1>
            robo<span>pictionary</span>
          </h1>
        </div>
        <p className="tagline">draw the robot action. your team races to guess it.</p>

        {!mode && (
          <div className="home-actions">
            <button className="btn btn-primary big" onClick={() => { setMode("create"); setError(""); }}>
              start a new game
            </button>
            <button className="btn btn-ghost big" onClick={() => { setMode("join"); setError(""); }}>
              join with a code
            </button>
            <p className="fineprint">2 teams · live drawing · first to 5 wins</p>
          </div>
        )}

        {mode && (
          <form className="home-form" onSubmit={submit}>
            <label className="field">
              <span>display name</span>
              <input
                autoFocus
                maxLength={20}
                value={name}
                placeholder="e.g. unit-7"
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            {mode === "join" && (
              <label className="field">
                <span>game code</span>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  placeholder="4 digits"
                  className="code-input"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            )}

            {error && <p className="error">{error}</p>}

            <button className="btn btn-primary big" type="submit">
              {mode === "create" ? "create game" : "join game"}
            </button>
            <button type="button" className="link-back" onClick={() => { setMode(null); setError(""); }}>
              ← back
            </button>
          </form>
        )}
      </div>
      <footer className="home-foot">a tiny party game · light & quick</footer>
    </div>
  );
}
