import { CANVAS, STAR_INDICATOR } from './constants.js'
import { stars } from './starGenie.js'

STAR_INDICATOR.className = 'indicator'
document.body.appendChild(STAR_INDICATOR)

CANVAS.addEventListener('mousemove', (e) => {
  const { offsetX, offsetY } = e
  const hovered = stars.find(
    star => Math.hypot(
      star.x - offsetX, 
      star.y - offsetY < star.radius + 2, 
    )
  )

  if (hovered) {
  }
})