export function createTooltip() {
  const el = document.createElement('div')
  el.className = 'indicator'
  document.body.appendChild(el)

  const PAD = 14
  let current = ''

  return {
    show(html, x, y) {
      if (html !== current) {
        el.innerHTML = html
        current = html
      }
      el.style.display = 'block'
      const { offsetWidth: tw, offsetHeight: th } = el

      let left = x + PAD
      let top = y + PAD
      if (left + tw > window.innerWidth - 8) left = x - PAD - tw
      if (top + th > window.innerHeight - 8) top = window.innerHeight - th - 8
      el.style.left = `${Math.max(8, left)}px`
      el.style.top = `${Math.max(8, top)}px`
    },
    hide() {
      el.style.display = 'none'
      current = ''
    }
  }
}
