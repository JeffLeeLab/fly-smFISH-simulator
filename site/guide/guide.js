// Webapp usage guide: shows guide.md in the app's type and colours. The text lives in guide.md
// (edit that, not this file); screenshots in img/ come from tools/guide-shots.sh.

import { marked } from "../vendor/marked-15.0.12/marked.esm.js";

const KEY = "smfish:theme";
const root = document.documentElement;
const main = document.getElementById("guide");
const themeBtn = document.querySelector("[data-act=theme]");

// ---------- theme: the app's setting, shared through localStorage ----------
function showTheme() {
  const dark = root.dataset.theme === "dark";
  themeBtn.innerHTML = `<span class="guide-top__dot" aria-hidden="true"></span>${dark ? "Light theme" : "Dark theme"}`;
  themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}
themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem(KEY, next); } catch { /* the choice lasts for this visit only */ }
  root.dataset.theme = next;
  showTheme();
});
// a theme chosen in the app's tab follows here
addEventListener("storage", e => {
  if (e.key === KEY && (e.newValue === "light" || e.newValue === "dark")) { root.dataset.theme = e.newValue; showTheme(); }
});
// print in the light theme, whatever is on screen
let screenTheme = null;
addEventListener("beforeprint", () => { screenTheme = root.dataset.theme; root.dataset.theme = "light"; });
addEventListener("afterprint", () => { if (screenTheme) root.dataset.theme = screenTheme; });
showTheme();

// ---------- the guide ----------
const slug = s => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

function finish() {
  // headings get ids, so a section can be linked (guide/#open-the-app)
  main.querySelectorAll("h2, h3").forEach(h => { h.id ||= slug(h.textContent); });
  // a picture on its own line becomes a figure that opens full size; a numbered list straight
  // after it is its key, numbered like the picture's badges
  main.querySelectorAll("p > img:only-child").forEach(img => {
    const p = img.parentElement;
    const fig = document.createElement("figure");
    const a = Object.assign(document.createElement("a"), { href: img.getAttribute("src"), target: "_blank", rel: "noopener" });
    img.loading = "lazy";
    a.append(img);
    fig.append(a);
    p.replaceWith(fig);
    if (fig.nextElementSibling?.tagName === "OL") fig.nextElementSibling.classList.add("key");
  });
  // links to other sites open in a new tab, so the guide stays open beside the app
  main.querySelectorAll('a[href^="http"]').forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
  const h1 = main.querySelector("h1");
  if (h1) document.title = `${h1.textContent} · smFISH Simulator`;
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

try {
  const res = await fetch("guide.md", { cache: "no-cache" });
  if (!res.ok) throw new Error(`guide.md: HTTP ${res.status}`);
  main.innerHTML = marked.parse(await res.text());
  finish();
} catch (err) {
  console.error(err);
  main.innerHTML = `<p class="notice">The guide didn’t load. Reload the page; if it still doesn’t load, email <a href="mailto:jeff.lee@glasgow.ac.uk">jeff.lee@glasgow.ac.uk</a>.</p>`;
}
