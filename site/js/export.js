// PNG export: SVG → canvas → clipboard (or a downloaded file where the clipboard is blocked).
// An SVG drawn as an image can't reach the page's web fonts, so the three self-hosted fonts
// are embedded as data URIs; text in every exported PNG stays in the site's typefaces.

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

// Copies a canvas as PNG; falls back to a download. Reports the outcome on the button.
export async function copyCanvas(canvas, filename, button) {
  const original = button?.textContent;
  let label;
  try {
    if (!navigator.clipboard || !window.ClipboardItem) throw new Error("no clipboard");
    const blob = new Promise(r => canvas.toBlob(r, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    label = "Copied";
  } catch {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
    label = "Saved as file";
  }
  if (button) {
    button.textContent = label;
    setTimeout(() => { button.textContent = original; }, 1800);
  }
}

// Resolved colours for a light, slide-ready export, whatever the current theme.
export const LIGHT = {
  bg: "#FFFFFF", text: "#141413", text2: "#3D3D3A", grid: "#DEDBD2", band: "#F1EFE8", ch1: "#1F8A4C", ch2: "#B0328F", both: "#3D3D3A",
  serif: "Newsreader, Georgia, serif", sans: "'Instrument Sans', system-ui, sans-serif", mono: "'IBM Plex Mono', ui-monospace, monospace",
};
