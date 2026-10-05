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
