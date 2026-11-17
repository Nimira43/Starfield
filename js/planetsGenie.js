import { createRng, hashString } from './rng.js'
import { createNameRegistry } from './starNameGenie.js'

const TAU = Math.PI * 2

const PALETTES = {
  rocky: [
    ['#a0522d', '#6b3420'],
    ['#8f8a85', '#5e5954'],
    ['#c2a272', '#8c6d43'],
    ['#b07a5a', '#6e4532'],
    ['#9a8f7c', '#5f564a'],
  ],
  molten: [
    ['#3a1a12', '#ff6a2a'],
    ['#2e1610', '#ffa040'],
  ],
  frozen: [
    ['#c9d6de', '#8fa3b0'],
    ['#dfe6e9', '#a9b8c0'],
  ],
  living: [
    ['#2f6db5', '#3f8a46'],
    ['#2a7fa8', '#7a8f3c'],
    ['#3566a8', '#a58a52'],
    ['#2b5f8f', '#4f9a5a'],
  ],
  'gas giant': [
    ['#d8b48a', '#a8744f', '#efdcc0'],
    ['#e2c78f', '#b37b3c', '#f6e8c8'],
    ['#c98e6b', '#8c573c', '#ead0b2'],
    ['#b9a8d8', '#7c6aa8', '#e0d6f2'],
    ['#9fb7d0', '#5f7fa8', '#d6e2ee'],
  ],
  'ice giant': [
    ['#9ad6e4', '#5ea6c0', '#c8eef5'],
    ['#7fb0e6', '#4a7cc0', '#bcd6f5'],
    ['#a3e3d3', '#5db5a3', '#d0f3ea'],
  ],
}

const MOON_COLOURS = {
  rocky: ['#a39e98', '#8c857c', '#b8aa98'],
  icy: ['#dfe8ee', '#c9dce6', '#e8e2d4'],
}

const OUTER_TYPES = [
  { type: 'gas giant', weight: 55 },
  { type: 'ice giant', weight: 28 },
  { type: 'rocky', weight: 17 },
]

const ROCKY_MOON_COUNTS = [
  { n: 0, weight: 45 },
  { n: 1, weight: 30 },
  { n: 2, weight: 17 },
  { n: 3, weight: 8 },
]

function pickType(rng, orbit, frostLine) {
  if (orbit < frostLine) return rng.chance(0.08) ? 'gas giant' : 'rocky'
  return rng.weighted(OUTER_TYPES).type
}

function rollHabitability(rng, inZone, lifeFactor) {
  if (!inZone) return 'uninhabitable'
  const roll = rng.next()
  if (roll < 0.3 * lifeFactor) return 'inhabited'
  if (roll < 0.75 * lifeFactor) return 'habitable'
  return 'uninhabitable'
}

function buildBands(rng, type) {
  const bands = []
  let y = -1
  while (y < 1) {
    const h = rng.float(0.08, 0.3)
    bands.push({
      y,
      h,
      c: rng.int(1, 2),
      a: type === 'ice giant' ? rng.float(0.12, 0.3) : rng.float(0.35, 0.75),
    })
    y += h + rng.float(0.02, 0.15)
  }
  return bands
}

function generateMoons(rng, type, inZone, lifeFactor, nextName) {
  let count
  if (type === 'rocky') count = rng.weighted(ROCKY_MOON_COUNTS).n
  else if (type === 'gas giant') count = rng.int(2, 10)
  else count = rng.int(1, 6)

  return Array.from({ length: count }, () => {
    const large = type !== 'rocky' && rng.chance(0.3)
    const kind =
      type === 'rocky' ? 'rocky' : rng.chance(0.55) ? 'icy' : 'rocky'
    let habitability = null

    if (large && kind === 'rocky') {
      const h = rollHabitability(rng, inZone, lifeFactor * 0.6)
      if (h !== 'uninhabitable') habitability = h
    }
    return {
      name: nextName(),
      type: kind,
      large,
      radiusPx: large ? rng.float(2, 2.8) : rng.float(1, 1.7),
      colour: rng.pick(MOON_COLOURS[kind]),
      habitability,
      phase: rng.float(0, TAU),
      speed: rng.float(0.7, 1.3),
    }
  })
}

function generatePlanet(
  rng,
  { orbit, star, habitableZone, frostLine, nextName },
) {
  const type = pickType(rng, orbit, frostLine)
  const inZone = orbit >= habitableZone[0] && orbit <= habitableZone[1]
  const tempC = Math.round(
    (278 * Math.pow(star.luminosity, 0.25)) / Math.sqrt(orbit) - 273,
  )
  const habitability =
    type === 'rocky'
      ? rollHabitability(rng, inZone, star.cls.lifeFactor)
      : null
  const living = habitability === 'inhabited' || habitability === 'habitable'
  const surfaceTemp = living ? tempC + 33 : tempC
  const molten = type === 'rocky' && !living && tempC > 400
  const frozen = type === 'rocky' && !living && tempC < -120

  let size, radiusPx
  if (type === 'rocky') {
    size = rng.float(0.35, 1.8)
    radiusPx = 3.5 + size * 2.6
  } else if (type === 'gas giant') {
    size = rng.float(6, 13)
    radiusPx = 9 + (size - 6) * 0.85
  } else {
    size = rng.float(3.4, 4.6)
    radiusPx = 7 + (size - 3.4) * 1.6
  }

  const palette = living
    ? 'living'
    : molten
      ? 'molten'
      : frozen
        ? 'frozen'
        : type
  const colours = rng.pick(PALETTES[palette])

  const features =
    type === 'rocky'
      ? Array.from({ length: rng.int(4, 8) }, () => {
          const rx = living
            ? rng.float(0.25, 0.6)
            : molten
              ? rng.float(0.3, 0.6)
              : rng.float(0.1, 0.28)
          return {
            x: rng.float(-1.6, 1.6),
            y: rng.float(-0.8, 0.8),
            rx,
            ry: molten ? rx * rng.float(0.08, 0.2) : rx * rng.float(0.6, 1),
            rot: rng.float(0, Math.PI),
          }
        })
      : []

  return {
    name: nextName(),
    type,
    orbit,
    period: Math.sqrt(orbit ** 3 / star.mass),
    tempC: surfaceTemp,
    inZone,
    habitability,
    size,
    radiusPx,
    colours,
    living,
    features,
    bands: type === 'rocky' ? [] : buildBands(rng, type),
    storm:
      type === 'gas giant' && rng.chance(0.35)
        ? {
            x: rng.float(-1.6, 1.6),
            y: rng.float(-0.5, 0.5),
            rx: rng.float(0.2, 0.35),
            ry: rng.float(0.1, 0.16),
          }
        : null,
    rings:
      type === 'gas giant'
        ? rng.chance(0.35)
        : type === 'ice giant'
          ? rng.chance(0.25)
          : false,
    ringTilt: rng.float(-0.35, 0.35),
    ringColour: rng.pick(['#d8c8a8', '#c0b8b0', '#a8c0d0']),
    spin: rng.float(0.05, 0.25) * (rng.chance(0.15) ? -1 : 1),
    phase: rng.float(0, TAU),
    moons: generateMoons(rng, type, inZone, star.cls.lifeFactor, nextName),
  }
}

export function generateSystem(star, seed) {
  const rng = createRng(hashString(`${seed}:system:${star.id}`))
  const sqrtL = Math.sqrt(star.luminosity)
  const habitableZone = [0.75 * sqrtL, 1.77 * sqrtL]
  const frostLine = 2.7 * sqrtL
  const nextName = createNameRegistry(rng, new Set([star.name]))

  const max = star.cls.maxPlanets
  const count = rng.chance(0.06)
    ? 0
    : Math.round((rng.int(1, max) + rng.int(1, max)) / 2)

  const planets = []
  let orbit = rng.float(0.15, 0.45) * Math.max(sqrtL, 0.35)
  for (let i = 0; i < count; i++) {
    if (i > 0) orbit *= rng.float(1.45, 2.1)
    planets.push(
      generatePlanet(rng, { orbit, star, habitableZone, frostLine, nextName }),
    )
  }

  return { seed, star, planets, habitableZone, frostLine }
}
