export function debugLog(...args) {
  // Enable with: REACT_APP_DEBUG=true
  if (process.env.REACT_APP_DEBUG === "true") {
    // eslint-disable-next-line no-console
    console.log("[megabike]", ...args);
  }
}


