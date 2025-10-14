import { stars } from './starGenie.js'

document.addEventListener('DOMContentLoaded', () => {
  const starIndicator = document.createElement('div')
  starIndicator.className = 'indicator'
  document.body.appendChild(starIndicator)

  CANVAS.addEventListener('mousemove', (e) => {
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
      starIndicator.innerText = `${hovered.name}\nPlanets: ${hovered.planets.join(', ')}`

      starIndicator.style.display = 'block'
    } else {
      starIndicator.style.display = 'none'
    }
  })
  console.log('Canvas:', CANVAS)
console.log('Stars:', stars)
console.log('Indicator created:', starIndicator)

})