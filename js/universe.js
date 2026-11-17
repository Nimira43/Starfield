import { createRng, hashString } from './rng.js'
import { createNameRegistry } from './starNameGenie.js'
import { STELLAR_CLASSES } from './stellarClasses.js'
import { generateSystem } from './planetsGenie.js'

export const STAR_COUNT = 1500

const DEPTHS = [
  { d: 0, weight: 5 },
  { d: 1, weight: 3 },
  { d: 2, weight: 1.5 }
]
const DEPTH_SCALE = [0.7, 0.9, 1.15]

export function createUniverse(seed) {
  const rng = createRng(hashString(seed))
  const nextName = createNameRegistry(rng)

  const stars = Array.from({ length: STAR_COUNT }, (_, id) => {
    const cls = rng.weighted(STELLAR_CLASSES)
    const bright = cls.code === 'O' || cls.code === 'B'
    const depth = bright ? 2 : rng.weighted(DEPTHS).d
    return {
      id,
      name: nextName(),
      cls,
      luminosity: cls.luminosity * rng.float(0.6, 1.5),
      mass: cls.mass * rng.float(0.85, 1.15),
      nx: rng.next(),
      ny: rng.next(),
      depth,
      radius: rng.float(cls.radius[0], cls.radius[1]) * DEPTH_SCALE[depth],
      twinkleSpeed: rng.float(0.6, 2.2),
      twinklePhase: rng.float(0, Math.PI * 2),
      sx: 0,
      sy: 0
    }
  })

  const systems = new Map()
  function getSystem(star) {
    let system = systems.get(star.id)
    if (!system) {
      system = generateSystem(star, seed)
      systems.set(star.id, system)
    }
    return system
  }

  return { seed, stars, getSystem }
}

export function computeStats(universe) {
  const stats = {
    stars: universe.stars.length,
    planets: 0,
    moons: 0,
    inhabited: 0,
    habitable: 0,
    byClass: Object.fromEntries(STELLAR_CLASSES.map(c => [c.code, 0])),
    inhabitedStars: []
  }

  for (const star of universe.stars) {
    stats.byClass[star.cls.code]++
    let hasLife = false
    for (const planet of universe.getSystem(star).planets) {
      stats.planets++
      stats.moons += planet.moons.length
      for (const world of [planet, ...planet.moons]) {
        if (world.habitability === 'inhabited') { stats.inhabited++; hasLife = true }
        else if (world.habitability === 'habitable') stats.habitable++
      }
    }
    if (hasLife) stats.inhabitedStars.push(star)
  }
  return stats
}
