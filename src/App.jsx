import React, { useEffect, useMemo, useState } from "react";

// --- data helpers --------------------------------------------------------

function quality(entry) {
  const m = entry.metric;
  if (m && m.kind === "percent" && m.value != null) return m.value / 100;
  if (m && m.kind === "stars" && m.value != null) return m.value / 5;
  return null;
}

function tierOf(entry) {
  const q = quality(entry);
  if (q == null) return "unknown";
  if (q >= 0.75) return "good";
  if (q >= 0.5) return "fair";
  return "poor";
}

const TIER_META = {
  good: { label: "Good", color: "var(--good)" },
  fair: { label: "Fair", color: "var(--fair)" },
  poor: { label: "Needs work", color: "var(--poor)" },
  unknown: { label: "Not scored", color: "var(--muted)" },
};

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function metricDisplay(entry) {
  const m = entry.metric;
  if (m && m.kind === "percent" && m.value != null) return { big: m.value, unit: "%" };
  if (m && m.kind === "stars" && m.value != null) return { big: m.value, unit: "★" };
  return { big: "—", unit: "" };
}

// --- component -----------------------------------------------------------

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [area, setArea] = useState("all");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`data.json returned ${r.status}`);
        return r.json();
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = data?.entries ?? [];

  const areas = useMemo(
    () => ["all", ...Array.from(new Set(entries.map((e) => e.area))).sort()],
    [entries]
  );

  const filtered = useMemo(() => {
    let rows = entries.filter((e) => {
      if (q && !`${e.name} ${e.area} ${e.cuisine ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (area !== "all" && e.area !== area) return false;
      if (tier !== "all" && tierOf(e) !== tier) return false;
      return true;
    });
    return rows.slice().sort((a, b) => {
      if (sort === "recent") return b.inspectedOn.localeCompare(a.inspectedOn);
      if (sort === "score") return (quality(b) ?? -1) - (quality(a) ?? -1);
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [entries, q, area, tier, sort]);

  const rated = entries.filter((e) => e.type === "rating").length;

  return (
    <div className="portal">
      <style>{css}</style>

      <header className="masthead">
        <div className="masthead-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden>◍</span>
            <div>
              <h1>Plate Watch</h1>
              <p className="brand-sub">Hyderabad food hygiene, in the open</p>
            </div>
          </div>
          <div className="coverage">
            <div className="coverage-stat">
              <span className="coverage-num">~25,000</span>
              <span className="coverage-lbl">licensed eateries</span>
            </div>
            <span className="coverage-div" aria-hidden>/</span>
            <div className="coverage-stat">
              <span className="coverage-num" style={{ color: "var(--accent)" }}>&lt; 2%</span>
              <span className="coverage-lbl">carry an FSSAI rating</span>
            </div>
          </div>
        </div>
        <p className="disclaimer">
          Data compiled from public enforcement reports and the FSSAI hygiene register.
          Ratings are voluntary and coverage is thin — an absent listing means <em>unrated</em>,
          not clean. Always verify against the official source before you rely on it.
        </p>
      </header>

      {error && (
        <div className="notice notice-error">
          Couldn't load listings ({error}). If you're running locally, generate the data first
          with <code>npm run collect</code>.
        </div>
      )}

      {!data && !error && <div className="notice">Loading listings…</div>}

      {data && (
        <>
          <div className="controls">
            <div className="search-wrap">
              <span className="search-icon" aria-hidden>⌕</span>
              <input
                className="search"
                placeholder="Search a restaurant, area or cuisine"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search"
              />
            </div>
            <select className="select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area">
              {areas.map((a) => (
                <option key={a} value={a}>{a === "all" ? "All areas" : a}</option>
              ))}
            </select>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              <option value="recent">Most recent</option>
              <option value="score">Highest score</option>
              <option value="name">A–Z</option>
            </select>
          </div>

          <div className="chips" role="group" aria-label="Filter by tier">
            {[
              ["all", "All"],
              ["good", "Good"],
              ["fair", "Fair"],
              ["poor", "Needs work"],
              ["unknown", "Not scored"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={"chip" + (tier === key ? " chip-on" : "")}
                onClick={() => setTier(key)}
                style={key !== "all" && tier === key ? { borderColor: TIER_META[key]?.color } : undefined}
              >
                {label}
              </button>
            ))}
            <span className="result-count">{filtered.length} listed</span>
          </div>

          <main className="grid">
            {filtered.map((e) => {
              const meta = TIER_META[tierOf(e)];
              const md = metricDisplay(e);
              return (
                <article className="card" key={e.id}>
                  <div className="card-top">
                    <div className="card-id">
                      <h2>{e.name}</h2>
                      <p className="card-meta">{e.area}{e.cuisine ? ` · ${e.cuisine}` : ""}</p>
                    </div>
                    <div className="stamp" style={{ ["--tier"]: meta.color }}>
                      <span className="stamp-big">{md.big}</span>
                      <span className="stamp-unit">{md.unit}</span>
                    </div>
                  </div>

                  <div className="card-tags">
                    <span className="tier-tag" style={{ background: meta.color }}>{meta.label}</span>
                    <span className={"type-tag " + (e.type === "rating" ? "type-rating" : "type-enf")}>
                      {e.type === "rating" ? "FSSAI rating" : "Task-force drive"}
                    </span>
                    {e.status && <span className="status-tag">{e.status}</span>}
                  </div>

                  {e.notes && <p className="card-notes">{e.notes}</p>}

                  <div className="card-foot">
                    <span className="card-date">Inspected {formatDate(e.inspectedOn)}</span>
                    {e.sourceUrl ? (
                      <a className="card-src" href={e.sourceUrl} target="_blank" rel="noreferrer">
                        {e.source} ↗
                      </a>
                    ) : (
                      <span className="card-src">{e.source}</span>
                    )}
                  </div>
                </article>
              );
            })}

            {filtered.length === 0 && (
              <div className="empty">
                <p>No listings match that.</p>
                <button className="chip" onClick={() => { setQ(""); setArea("all"); setTier("all"); }}>
                  Clear filters
                </button>
              </div>
            )}
          </main>

          <footer className="foot">
            <p>
              <strong>Where the data comes from.</strong> Voluntary star ratings from the FSSAI
              hygiene register ({rated} here); enforcement findings from the Commissioner of Food
              Safety, Telangana and GHMC drives. Curated in <code>data/entries.json</code>.
              {data.generatedAt && ` Last built ${new Date(data.generatedAt).toLocaleString("en-IN")}.`}
            </p>
          </footer>
        </>
      )}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

.portal {
  --paper: #F4F5F2;
  --ink: #191D22;
  --muted: #737C85;
  --line: #E1E2DC;
  --card: #FBFBF9;
  --accent: #E39A2C;
  --good: #2E7D5B;
  --fair: #D2921C;
  --poor: #C24138;
  background: var(--paper);
  color: var(--ink);
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
  min-height: 100vh;
  padding: clamp(16px, 3vw, 34px);
  box-sizing: border-box;
}
.portal * { box-sizing: border-box; }

.masthead-inner { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 14px; }
.brand-mark { font-size: 40px; line-height: 1; color: var(--accent); transform: translateY(-2px); }
.brand h1 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: clamp(30px, 5vw, 46px); margin: 0; letter-spacing: -0.02em; line-height: 0.95; }
.brand-sub { margin: 4px 0 0; color: var(--muted); font-size: 14px; }

.coverage { display: flex; align-items: flex-end; gap: 14px; padding: 10px 16px; border: 1px solid var(--line); border-radius: 4px; background: var(--card); }
.coverage-stat { display: flex; flex-direction: column; }
.coverage-num { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 22px; line-height: 1; }
.coverage-lbl { font-size: 11px; color: var(--muted); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em; }
.coverage-div { font-size: 26px; color: var(--line); font-weight: 300; }

.disclaimer { margin: 18px 0 0; max-width: 62ch; font-size: 13.5px; color: var(--muted); line-height: 1.55; border-left: 2px solid var(--accent); padding-left: 12px; }
.disclaimer em { font-style: italic; color: var(--ink); }

.notice { margin-top: 22px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 4px; background: var(--card); color: var(--muted); font-size: 14px; }
.notice-error { border-color: color-mix(in srgb, var(--poor) 40%, var(--line)); color: var(--poor); }
.notice code { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; }

.controls { display: flex; gap: 10px; margin-top: 26px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1 1 260px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 18px; }
.search { width: 100%; padding: 11px 12px 11px 36px; font-size: 14.5px; font-family: inherit; color: var(--ink); border: 1px solid var(--line); border-radius: 4px; background: var(--card); }
.search:focus, .select:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }
.select { padding: 11px 12px; font-size: 14px; font-family: inherit; color: var(--ink); border: 1px solid var(--line); border-radius: 4px; background: var(--card); cursor: pointer; }

.chips { display: flex; gap: 8px; align-items: center; margin-top: 14px; flex-wrap: wrap; }
.chip { padding: 6px 13px; font-size: 13px; font-family: inherit; border: 1px solid var(--line); border-radius: 20px; background: transparent; color: var(--ink); cursor: pointer; transition: background .12s, border-color .12s; }
.chip:hover { background: var(--card); }
.chip-on { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.result-count { margin-left: auto; font-size: 12.5px; color: var(--muted); font-family: 'IBM Plex Mono', monospace; }

.grid { display: grid; gap: 14px; margin-top: 22px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: border-color .12s, transform .12s; }
.card:hover { border-color: #CFD1C8; transform: translateY(-1px); }
.card-top { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.card-id h2 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 18px; margin: 0; letter-spacing: -0.01em; line-height: 1.15; }
.card-meta { margin: 5px 0 0; font-size: 12.5px; color: var(--muted); }

.stamp { flex: none; width: 62px; height: 62px; border-radius: 50%; border: 2px solid var(--tier); color: var(--tier); display: flex; align-items: baseline; justify-content: center; gap: 1px; transform: rotate(-4deg); background: color-mix(in srgb, var(--tier) 8%, transparent); }
.stamp-big { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 22px; line-height: 1; }
.stamp-unit { font-family: 'IBM Plex Mono', monospace; font-weight: 500; font-size: 12px; }

.card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tier-tag { color: #fff; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 3px; letter-spacing: 0.02em; }
.type-tag { font-size: 11px; padding: 3px 9px; border-radius: 3px; border: 1px solid var(--line); }
.type-rating { color: var(--good); border-color: color-mix(in srgb, var(--good) 40%, var(--line)); }
.type-enf { color: var(--muted); }
.status-tag { font-size: 11px; padding: 3px 9px; border-radius: 3px; background: var(--paper); color: var(--muted); }

.card-notes { margin: 0; font-size: 13px; line-height: 1.5; color: #3A4048; }

.card-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--line); }
.card-date { font-size: 11.5px; color: var(--muted); font-family: 'IBM Plex Mono', monospace; }
.card-src { font-size: 11.5px; color: var(--accent); text-decoration: none; font-weight: 500; }
.card-src:hover { text-decoration: underline; }

.empty { grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 14px; }

.foot { margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted); line-height: 1.55; max-width: 72ch; }
.foot code { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; background: var(--card); padding: 1px 5px; border-radius: 3px; border: 1px solid var(--line); }
.foot strong { color: var(--ink); }

@media (max-width: 560px) { .coverage { width: 100%; justify-content: space-between; } }
@media (prefers-reduced-motion: reduce) { .card, .chip { transition: none; } }
`;
