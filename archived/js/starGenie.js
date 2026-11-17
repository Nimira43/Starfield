import { getCanvas, getCtx } from './canvasContext.js'
import generateName from './starNameGenie.js'
import generatePlanets from './planetsGenie.js'

const canvas = getCanvas()
const ctx = getCtx()

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const stars = Array.from({ length: 1000 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 1.5 + 0.5,
  name: generateName(),
  planets: generatePlanets()
}))

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  stars.forEach(({x, y, radius }) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  })
}

export { drawStars, stars }