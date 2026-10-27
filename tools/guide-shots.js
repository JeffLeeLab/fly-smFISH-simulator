// Annotated screenshots for the Webapp usage guide (site/guide/guide.md), run by
// tools/guide-shots.sh. Each shot is one route in the Pdf case, light theme, 1280 px wide at 2×
// pixel density, with numbered boxes drawn over the page. The numbers match the numbered list
// under each picture in guide.md: change one, change the other.
//
// A mark: sel (every match is boxed together; first: true boxes only the first), n (the
// number), at (where the badge sits on the box: tl, t, tr, r, br, b, bl, l), off: [dx, dy]
// (moves the badge, e.g. into the margin beside the box), arrow: [dx, dy] (moves it and points an
// arrow back), pad (space round the element, default 4).
// A shot: name, route, size (default 1280×720), clip (default the whole window), scroll (an
// element brought to the top first, with scrollPad px above it), click (elements clicked first),
// blur (elements blurred).

async page => {
  const BASE = "http://localhost:8765/";
  // Example notebook: two modes shortlisted, Regions 1 + 2, both verdicts unresolved. Nothing in
  // a picture hints at an answer, and step 7's images are blurred.
  const STATE = {
    steps: 8, visited: [1, 2, 3, 4, 5, 6, 7, 8],
    clue: { observation: "", interpretation: "" },
    shortlist: ["splicing", "transport"], because: {},
    pair: { ch1: "F1", ch2: "F2" }, predictions: {}, features: "",
    results: { observation: "", interpretation: "" },
    verdicts: { splicing: "unresolved", transport: "unresolved" }, evidence: {},
    claim: "", uncertainty: { mode: "", why: "" },
  };
  const MAIN = { x: 201, y: 0, width: 1079 };   // everything right of the rail

  const SHOTS = [
    { name: "overview", route: "#/pdf/step-3", marks: [
      { sel: ".rail__stages", n: 1, at: "r" },
      { sel: ".rail__case", n: 2, at: "r" },
      { sel: "#nb-tab", n: 3, at: "l", arrow: [-44, 0] },
      { sel: ".rail__foot", n: 4, at: "r" },
      { sel: ".bench__side .gl", first: true, n: 5, at: "l", off: [-24, 0], pad: 3 },
    ] },
    { name: "choose", route: "?t=9.6#/", clip: MAIN, scroll: "#choose", marks: [
      { sel: ".stations", n: 1, at: "tl", pad: 8 },
    ] },
    { name: "step3", route: "#/pdf/step-3", clip: MAIN, marks: [
      { sel: ".viewer__group", n: 1, at: "tl" },
      { sel: ".vseg", n: 2, at: "t" },
      { sel: "#controls", n: 3, at: "l" },
      { sel: ".savemenu--viewer, [data-act=full]", n: 4, at: "t" },
      { sel: ".bench__side .field", n: 5, at: "l" },
    ] },
    { name: "step5", route: "#/pdf/step-5", clip: MAIN, marks: [
      { sel: ".hyp[data-mode=transport] .hyp__box", n: 1, at: "l", off: [-8, 30] },
      { sel: ".hyp[data-mode=transport] .hyp__because .input", n: 2, at: "l", off: [-22, 0] },
      { sel: ".bench__side .yourq, .bench__side .recap", n: 3, at: "l", off: [-22, 0] },
      { sel: "#hyp-next .btn", n: 4, at: "l", off: [-22, 0] },
    ] },
    { name: "step6", route: "#/pdf/step-6", clip: MAIN, marks: [
      { sel: ".gene", n: 1, at: "bl" },
      { sel: "#map", n: 2, at: "t" },
      { sel: ".pair__lede, .pair__slots, .pair__tools", n: 3, at: "l", off: [-22, 0] },
      { sel: ".predict", n: 4, at: "l", off: [-22, 0] },
      { sel: ".howto__btn", n: 5, at: "r", off: [22, 0] },
      { sel: ".pair__go", n: 6, at: "l", off: [-22, 0] },
    ] },
    { name: "step7", route: "#/pdf/step-7", clip: MAIN, click: ["#tab-compare"], blur: [".viewer__canvas"], marks: [
      { sel: ".pstrip-wrap, [data-act=new-pair]", n: 1, at: "l", off: [-22, 0] },
      { sel: ".viewer__fields, .viewer__legend", n: 2, at: "tl" },
      { sel: ".side-tabs", n: 3, at: "l", off: [-22, 0] },
      { sel: "#pane-compare .nb-cards", n: 4, at: "l", off: [-22, 0] },
      { sel: ".results__bar", n: 5, at: "tl" },
    ] },
    { name: "step8", route: "#/pdf/step-8", size: [1280, 1000], clip: MAIN, scroll: ".revise", scrollPad: 24, marks: [
      { sel: ".revise label.field:nth-of-type(1)", n: 1, at: "l", off: [-22, 0] },
      { sel: ".revise label.field:nth-of-type(2), .revise label.field:nth-of-type(3)", n: 2, at: "l", off: [-22, 0] },
      { sel: ".slide .savemenu", n: 3, at: "l", off: [-22, 0] },
    ] },
  ];

  // Draws the boxes, badges and arrows in an SVG over the page (runs in the page).
  const draw = ({ marks, blur, clip }) => {
    const MARK = "#FFB000", INK = "#141413";   // --mark and --mark-ink in site/guide/guide.css
    for (const s of blur || []) document.querySelectorAll(s).forEach(el => { el.style.filter = "blur(10px)"; });
    let out = "";
    for (const m of marks) {
      let els = [...document.querySelectorAll(m.sel)];
      if (m.first) els = els.slice(0, 1);
      if (!els.length) throw new Error(`guide-shots: nothing matches ${m.sel}`);
      const rs = els.map(e => e.getBoundingClientRect());
      const pad = m.pad ?? 4;
      const x0 = Math.min(...rs.map(r => r.left)) - pad, y0 = Math.min(...rs.map(r => r.top)) - pad;
      const x1 = Math.max(...rs.map(r => r.right)) + pad, y1 = Math.max(...rs.map(r => r.bottom)) + pad;
      const box = `x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="5" fill="none"`;
      out += `<rect ${box} stroke="${INK}" stroke-width="6"/><rect ${box} stroke="${MARK}" stroke-width="3"/>`;
      const at = m.at || "tl";
      const ax = at.includes("l") ? x0 : at.includes("r") ? x1 : (x0 + x1) / 2;
      const ay = at.startsWith("t") ? y0 : at.startsWith("b") ? y1 : (y0 + y1) / 2;
      const [dx, dy] = m.arrow || m.off || [0, 0];
      const R = 14;
      const cx = Math.min(Math.max(ax + dx, clip.x + R + 3), clip.x + clip.width - R - 3);
      const cy = Math.min(Math.max(ay + dy, clip.y + R + 3), clip.y + clip.height - R - 3);
      if (m.arrow) {
        const len = Math.hypot(ax - cx, ay - cy), ux = (ax - cx) / len, uy = (ay - cy) / len;
        const sx = cx + ux * R, sy = cy + uy * R, hx = ax - ux * 11, hy = ay - uy * 11;
        const head = `${ax},${ay} ${hx - uy * 6},${hy + ux * 6} ${hx + uy * 6},${hy - ux * 6}`;
        out += `<line x1="${sx}" y1="${sy}" x2="${hx}" y2="${hy}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
          <polygon points="${head}" fill="${MARK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
          <line x1="${sx}" y1="${sy}" x2="${hx}" y2="${hy}" stroke="${MARK}" stroke-width="3" stroke-linecap="round"/>`;
      }
      out += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${MARK}" stroke="${INK}" stroke-width="2.5"/>
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="${INK}"
          style="font: 700 15px 'Instrument Sans', system-ui, sans-serif">${m.n}</text>`;
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("style", "position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;overflow:visible");
    svg.innerHTML = out;
    document.body.append(svg);
  };

  const ctx = await page.context().browser().newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate(state => {
    localStorage.setItem("smfish:theme", "light");
    localStorage.setItem("smfish:v1:case:pdf", JSON.stringify(state));
    for (const k of ["viewer", "legend"]) localStorage.setItem(`smfish:v1:tour:${k}`, "true");
  }, STATE);
  const done = [];
  for (const s of SHOTS) {
    const [w, h] = s.size || [1280, 720];
    await p.setViewportSize({ width: w, height: h });
    await p.goto("about:blank");
    await p.goto(BASE + s.route);
    await p.waitForTimeout(3500);
    for (const sel of s.click || []) { await p.click(sel); await p.waitForTimeout(400); }
    if (s.scroll) {
      await p.evaluate(([sel, pad]) => { document.querySelector(sel).scrollIntoView({ block: "start" }); scrollBy(0, -pad); }, [s.scroll, s.scrollPad || 0]);
      await p.waitForTimeout(800);
    }
    await p.mouse.move(w - 2, h - 2);   // no hover states in the picture
    const clip = { ...(s.clip || { x: 0, y: 0, width: w }), y: 0, height: h };
    await p.evaluate(draw, { marks: s.marks, blur: s.blur, clip });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${s.name}.png`, clip });
    done.push(s.name);
  }
  await ctx.close();
  return done.join(" ");
}
