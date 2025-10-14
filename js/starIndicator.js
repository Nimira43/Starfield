import { stars } from './starGenie.js'
import { getCanvas } from './canvasContext.js'

document.addEventListener('DOMContentLoaded', () => {
  
  const starIndicator = document.createElement('div')
  starIndicator.className = 'indicator'
  document.body.appendChild(starIndicator)

  const canvas = getCanvas()
  canvas.addEventListener('mousemove', (e) => {
    const { offsetX, offsetY } = e

    const hovered = stars.find(
      star => Math.hypot(
        star.x - offsetX, 
        star.y - offsetY 
      ) < star.radius + 2,   
    )

    if (hovered) {
      starIndicator.style.left = `${offsetX + 10}px`
      starIndicator.style.top = `${offsetY + 10}px`
      starIndicator.innerText = `${hovered.name}\nPlanets:\n` +
  hovered.planets.map(p => 
    `• ${p.name} (${p.type}${p.habitability ? ', ' + p.habitability : ''}, ${p.moons.length} moon${p.moons.length !== 1 ? 's' : ''})`
  ).join('\n')

      starIndicator.style.display = 'block'
    } else {
      starIndicator.style.display = 'none'
    }
  })

})