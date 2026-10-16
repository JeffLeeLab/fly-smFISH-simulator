// Per-browser storage. Everything goes through try/catch: when localStorage is blocked,
// the session keeps working in memory and the notebook warns that work won't persist.

const NS = "smfish:v1:";
const memory = new Map();
const bus = new EventTarget();

export const storage = { available: probe() };

function probe() {
  try {
    const k = NS + "probe";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function read(key, fallback = null) {
  if (memory.has(key)) return memory.get(key);
  let value = fallback;
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw != null) value = JSON.parse(raw);
  } catch {
    storage.available = false;
  }
  memory.set(key, value);
  return value;
}

export function write(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    storage.available = false;
  }
  bus.dispatchEvent(new CustomEvent("change", { detail: { key } }));
}

export function onChange(fn) {
  const h = e => fn(e.detail.key);
  bus.addEventListener("change", h);
  return () => bus.removeEventListener("change", h);
}

// ---------- case state: one record per case, holding every notebook entry ----------

export function blankCase() {
  return {
    steps: 8,                                       // the numbering `visited` uses (see migrate)
    visited: [],                                    // steps opened at least once
    clue: { observation: "" },                      // step 3
    shortlist: [],                                  // step 5: mode ids, in card order
    because: {},                                    // step 5: mode id -> "because…"
    pair: { ch1: null, ch2: null },                 // step 6: region ids
    predictions: {},                                // step 6: mode id -> { text, cantTest } (cleared with a new pair)
    features: "",                                   // retired (was in probe design); kept so saved notebooks load
    results: { observation: "", interpretation: "" },// step 7
    verdicts: {},                                   // step 7: mode id -> "ruled-out" | "supported" | "unresolved"
    evidence: {},                                   // step 7: mode id -> one line
    claim: "",                                      // step 8
    uncertainty: { mode: "", why: "" },             // step 8
  };
}

// Notebooks saved before step 4 (TDP-43 and its targets) was added had seven steps, so their old
// steps 4–7 are now 5–8. Only `visited` holds step numbers; the rest is keyed by field. The saved
// copy is left as it is until the next write, so reading it again gives the same answer.
function migrate(saved) {
  if (saved.steps === 8 || !Array.isArray(saved.visited)) return saved;
  return { ...saved, steps: 8, visited: saved.visited.map(n => (n >= 4 ? n + 1 : n)) };
}

export function caseState(caseId) {
  const saved = read("case:" + caseId);
  return { ...blankCase(), ...migrate(saved || {}) };
}

export function updateCase(caseId, fn) {
  const s = caseState(caseId);
  fn(s);
  write("case:" + caseId, s);
  return s;
}
