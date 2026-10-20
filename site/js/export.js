// PNG export: SVG → canvas → clipboard or a downloaded file, chosen from the Save menu below.
// An SVG drawn as an image can't reach the page's web fonts, so the three self-hosted fonts
// are embedded as data URIs; text in every exported PNG stays in the site's typefaces.

import { CHEVRON_ICON, COPY_ICON, DOWNLOAD_ICON } from "./icons.js";

const FONT_FILES = [
  ["Newsreader", "normal", "200 800", "fonts/newsreader-latin-opsz-normal.woff2"],
  ["Newsreader", "italic", "200 800", "fonts/newsreader-latin-opsz-italic.woff2"],
  ["Instrument Sans", "normal", "400 700", "fonts/instrument-sans-latin-wght-normal.woff2"],
  ["IBM Plex Mono", "normal", "400", "fonts/ibm-plex-mono-latin-400-normal.woff2"],
  ["IBM Plex Mono", "normal", "500", "fonts/ibm-plex-mono-latin-500-normal.woff2"],
];

let fontCSS = null;
async function embeddedFonts() {
  if (fontCSS) return fontCSS;
  const rules = await Promise.all(FONT_FILES.map(async ([family, style, weight, url]) => {
    const buf = await (await fetch(url)).arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${btoa(bin)}) format("woff2");}`;
  }));
  fontCSS = rules.join("");
  return fontCSS;
}

export async function svgToCanvas(inner, width, height, background) {
  const css = await embeddedFonts();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>${css}</style><rect width="100%" height="100%" fill="${background}"/>${inner}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise((ok, fail) => { img.onload = ok; img.onerror = fail; img.src = url; });
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = canvas => new Promise((ok, fail) => canvas.toBlob(b => (b ? ok(b) : fail(new Error("no PNG"))), "image/png"));

async function download(canvas, filename) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(await toBlob(canvas)), download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// The Save menu: one button ("Save view ▾") opens Copy and Download for the same image. The menu
// is a manual popover, in the top layer, so neither the plot drawer's clipping nor the full view's
// stacking hides it; it closes on Esc, Tab or a click elsewhere, and follows its button on scroll.
let menus = 0;
export function saveMenuHTML({ label, what, cls = "btn", extra = "" }) {
  const id = `savemenu-${++menus}`;
  return `<span class="savemenu ${extra}"><button type="button" class="${cls} savemenu__btn" aria-haspopup="menu" aria-expanded="false" aria-controls="${id}"><span class="savemenu__label">${label}</span>${CHEVRON_ICON}</button><span class="savemenu__menu" id="${id}" role="menu" aria-label="${label}" popover="manual"><button type="button" role="menuitem" tabindex="-1" data-save="copy">${COPY_ICON}Copy ${what}</button><button type="button" role="menuitem" tabindex="-1" data-save="download">${DOWNLOAD_ICON}Download ${what} as PNG</button></span><span class="vh" role="status"></span></span>`;
}

// `render` returns a promise of the canvas; `filename` is read when the menu is used.
export function bindSaveMenu(wrap, { render, filename }) {
  const btn = wrap.querySelector(".savemenu__btn"), menu = wrap.querySelector(".savemenu__menu");
  const label = wrap.querySelector(".savemenu__label"), status = wrap.querySelector("[role=status]");
  const items = [...menu.querySelectorAll("[role=menuitem]")];
  const original = label.textContent;
  let timer;
  const isOpen = () => menu.classList.contains("is-open");

  // below the button unless it would run off the bottom; aligned to the button's nearer edge
  const place = () => {
    const r = btn.getBoundingClientRect(), pad = 8, gap = 4;
    menu.style.minWidth = `${r.width}px`;
    const w = menu.offsetWidth, h = menu.offsetHeight;
    const up = r.bottom + gap + h > innerHeight - pad && r.top - gap - h >= pad;
    const left = r.left + r.width / 2 > innerWidth / 2 ? r.right - w : r.left;
    menu.style.left = `${Math.max(pad, Math.min(left, innerWidth - pad - w))}px`;
    menu.style.top = `${up ? r.top - gap - h : r.bottom + gap}px`;
  };
  const outside = e => { if (!wrap.contains(e.target)) close(); };
  // a scroll (or resize) carries the menu with its button, and closes it once the button is gone
  const onScroll = () => {
    const r = btn.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) close();
    else place();
  };
  const onEsc = e => { if (e.key === "Escape") close(true); };   // focus left the menu (a click on its padding)
  function open(i = 0) {
    menu.classList.add("is-open");
    menu.showPopover?.();
    btn.setAttribute("aria-expanded", "true");
    place();
    items.at(i).focus({ preventScroll: true });
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", onEsc);
    addEventListener("scroll", onScroll, true);
    addEventListener("resize", onScroll);
  }
  function close(refocus = false) {
    if (!isOpen()) return;
    menu.classList.remove("is-open");
    if (menu.hidePopover && menu.matches(":popover-open")) menu.hidePopover();
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    document.removeEventListener("keydown", onEsc);
    removeEventListener("scroll", onScroll, true);
    removeEventListener("resize", onScroll);
    if (refocus) btn.focus();
  }

  btn.addEventListener("click", () => (isOpen() ? close() : open()));
  btn.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(e.key === "ArrowUp" ? -1 : 0); }
  });
  menu.addEventListener("keydown", e => {
    const i = items.indexOf(document.activeElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (to !== undefined) { e.preventDefault(); items.at(to % items.length).focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === "Tab") { btn.focus({ preventScroll: true }); close(); }
  });
  menu.addEventListener("click", e => {
    const item = e.target.closest("[data-save]");
    if (!item) return;
    close(true);
    save(item.dataset.save);
  });

  // The clipboard write starts inside the click, with the image still to come (Safari needs
  // that); where the clipboard is blocked, Copy downloads the file instead and says so.
  async function save(how) {
    const canvas = render();
    let said;
    try {
      if (how === "copy") {
        try {
          if (!navigator.clipboard || !window.ClipboardItem) throw new Error("no clipboard");
          await navigator.clipboard.write([new ClipboardItem({ "image/png": canvas.then(toBlob) })]);
          said = ["Copied", "Copied to the clipboard."];
        } catch {
          await download(await canvas, filename());
          said = ["Saved as file", "The clipboard is blocked here, so the PNG was downloaded instead."];
        }
      } else {
        await download(await canvas, filename());
        said = ["Downloaded", "PNG downloaded."];
      }
    } catch {
      said = ["Not saved", "The image could not be made. Try again."];
    }
    label.textContent = said[0];
    status.textContent = said[1];
    btn.classList.add("is-said");   // the ▾ steps aside while the button reports, so the toolbar keeps its line
    clearTimeout(timer);
    timer = setTimeout(() => { label.textContent = original; status.textContent = ""; btn.classList.remove("is-said"); }, 1800);
  }
}

// Resolved colours for a light, slide-ready export, whatever the current theme.
export const LIGHT = {
  bg: "#FFFFFF", text: "#141413", text2: "#3D3D3A", text3: "#66655F", grid: "#DEDBD2", band: "#F1EFE8", ch1: "#1F8A4C", ch2: "#B0328F", both: "#3D3D3A", ch1Text: "#177341", ch2Text: "#B0328F",
  border: "#B0AEA5", cds: "#3D3D3A", utr: "#87867F", intron: "#B0AEA5", mem: "#5F78C0", dapi: "#5A78EB",
  serif: "Newsreader, Georgia, serif", sans: "'Instrument Sans', system-ui, sans-serif", mono: "'IBM Plex Mono', ui-monospace, monospace",
};
