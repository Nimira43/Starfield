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