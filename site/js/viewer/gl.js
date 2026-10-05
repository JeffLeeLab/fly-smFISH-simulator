// WebGL 2 check for the microscopy viewer, and the message shown without it.

export function hasWebGL2() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    return !!gl;
  } catch {
    return false;
  }
}

export const NO_WEBGL_TEXT =
  "The microscope view needs WebGL 2, which this browser or laptop has turned off. Try a current version of Chrome, Edge, Firefox or Safari, or turn on hardware acceleration in the browser settings.";

// The viewer's place, without WebGL: the same frame, one black field holding the message.
export function renderNoWebGL(host) {
  host.className = "viewer";
  host.innerHTML = `
    <div class="viewer__fields viewer__fields--one">
      <div class="viewer__field"><p class="viewer__note viewer__note--block" role="status">${NO_WEBGL_TEXT}</p></div>
    </div>`;
}
