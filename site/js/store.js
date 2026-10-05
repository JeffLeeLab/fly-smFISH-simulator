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
    visited: [],                                    // steps opened at least once
    clue: { observation: "", interpretation: "" },  // step 3
    shortlist: [],                                  // step 4: mode ids, in card order
    because: {},                                    // step 4: mode id -> "because…"
    pair: { ch1: null, ch2: null },                 // step 5: region ids
    predictions: {},                                // step 5: mode id -> { text, cantTest } (cleared with a new pair)
    features: "",                                   // step 5 (optional)
    results: { observation: "", interpretation: "" },// step 6
    verdicts: {},                                   // step 6: mode id -> "ruled-out" | "supported" | "unresolved"
    evidence: {},                                   // step 6: mode id -> one line
    claim: "",                                      // step 7
    uncertainty: { mode: "", why: "" },             // step 7
  };
}

export function caseState(caseId) {
  const saved = read("case:" + caseId);
  return { ...blankCase(), ...(saved || {}) };
}

export function updateCase(caseId, fn) {
  const s = caseState(caseId);
  fn(s);
  write("case:" + caseId, s);
  return s;
}
