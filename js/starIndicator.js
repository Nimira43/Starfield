import { CANVAS, STAR_INDICATOR } from './constants.js'
import { stars } from './starGenie.js'

document.addEventListener('DOMContentLoaded', () => {
  STAR_INDICATOR.className = 'indicator'
  document.body.appendChild(STAR_INDICATOR)

  CANVAS.addEventListener('mousemove', (e) => {
    const { offsetX, offsetY } = e

    const hovered = stars.find(
      star => Math.hypot(
        star.x - offsetX, 
        star.y - offsetY 
      ) < star.radius + 2,   
    )

    if (hovered) {
      STAR_INDICATOR.style.left = `${offsetX + 10}px`
      STAR_INDICATOR.style.top = `${offsetY + 10}px`
      STAR_INDICATOR.innerText = `${hovered.name}\nPlanets: ${hovered.planets.join(', ')}`

      STAR_INDICATOR.style.display = 'block'
    } else {
      STAR_INDICATOR.style.display = 'none'
    }
  })
  console.log('Canvas:', CANVAS)
console.log('Stars:', stars)
console.log('Indicator created:', STAR_INDICATOR)

})