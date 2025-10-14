import generateName from './starNameGenie.js'

export default function generatePlanets() {
  const num = Math.floor(Math.random() * 9) + 1

  return Array.from({ length: num }, () => generateName())
}