export function nowSeasonYear() {
  return new Date().getFullYear();
}

export function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj?.[k];
  return out;
}


