export function getCanvas() {
  return document.getElementById('starfield')
} 

export function getCtx() {
  const canvas = getCanvas()
  return canvas ? canvas.getContext('2d') : null
}

