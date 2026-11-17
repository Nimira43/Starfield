import {drawStars, stars} from './starGenie.js'
import './starIndicator.js'

drawStars()

console.log('🌌 Star Registry:')

stars.forEach(star => {
  console.log(`⭐ ${star.name}`)
  star.planets.forEach(planet => {
    console.log(`   🪐 ${planet.name} (${planet.type}${planet.habitability ? ', ' + planet.habitability : ''})`)
    planet.moons.forEach(moon => {
      console.log(`      🌙 ${moon}`)
    })
  })
})

