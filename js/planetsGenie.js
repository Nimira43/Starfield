import generateName from './starNameGenie.js'

function getPlanetType() {
  return Math.random() < 0.65 ? 'solid' : 'gas' 
}


export default function generatePlanets() {
  const num = Math.floor(Math.random() * 9) + 1

  return Array.from({ length: num }, () => generateName())
}