// Loads the generated public data for a case (site/data/<case>/). Relative paths, so the
// site works under /repo-name/ on GitHub Pages and from a local folder over HTTP.

const cache = new Map();

export async function loadJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then(r => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    }));
  }
  return cache.get(path);
}

export const transcripts = caseId => loadJSON(`data/${caseId}/transcripts.json`);

export const formatLength = nt => (nt >= 1000 ? `${(nt / 1000).toFixed(nt >= 10000 ? 0 : 1)} kb` : `${nt} nt`);
// Probe regions keep their internal IDs (F6, U2, S7: gene initial + number, 5′→3′); students see "Region 6".
export const regionLabel = id => id && id.replace(/^[A-Za-z]+/, "Region ");
