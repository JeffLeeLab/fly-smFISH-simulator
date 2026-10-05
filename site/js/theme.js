// Light/dark theme. Follows the system setting until the user picks one; the choice is
// kept in localStorage. index.html sets data-theme before first paint with the same rule.

const KEY = "smfish:theme";
const media = matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set();

function saved() {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

export const currentTheme = () => document.documentElement.dataset.theme;

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach(fn => fn(theme));
}

export function initTheme() {
  apply(saved() || (media.matches ? "dark" : "light"));
  media.addEventListener("change", e => { if (!saved()) apply(e.matches ? "dark" : "light"); });
}

export function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  try { localStorage.setItem(KEY, next); } catch { /* the choice lasts for this visit only */ }
  apply(next);
}

export function onTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
