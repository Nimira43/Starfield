import { CANVAS, CTX } from './constants'

CANVAS.width = window.innerWidth
CANVAS.height = window.innerHeight

const stars = Array.from({ length: 1000 }, () => ({
  x: Math.random() * CANVAS.width,
  y: Math.random() * CANVAS.height,
  radius: Math.random() * 1.5 + 0.5,
  name: generateName(),
  planets: generatePlanets()
}))

function drawStars() {
  CTX.clearRect(0, 0, CANVAS.width, CANVAS.height)
  CTX.fillStyle = '#fff'
  stars.forEach(({x, y, radius }) => {
    CTX.beginPath()
    CTX.arc(x, y, radius, 0, Math.PI * 2)
    CTX.fill()
  })
}

export default drawStars