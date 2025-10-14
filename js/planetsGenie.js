import generateName from './starNameGenie.js'

function getPlanetType() {
  return Math.random() < 0.65 ? 'solid' : 'gas' 
}

function getHabitability() {
  const roll = Math.random()
  if (roll < 0.1) return 'inhabited'
  if (roll < 0.3) return 'uninhabited'
  return 'uninhabitable'
}

function getMoons(type) {
  const range = type === 'solid' ? [0, 3] : [3, 10]
  const count = Math.floor(Math.random) * (range[1] - range[0] + 1) + range
  return Array.from({
    length: count
  }, () => generateName())
}

export default function generatePlanets() {
  const num = Math.floor(Math.random() * 9) + 1

  return Array.from({ length: num }, () => generateName())
}