export function hexToRgb(hex) {
  let v = hex.replace('#', '')
  if (v.length === 3)
    v = v
      .split('')
      .map((c) => c + c)
      .join('')
  const n = parseInt(v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

export function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex)
  const f = (c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  return `rgb(${f(r)},${f(g)},${f(b)})`
}
