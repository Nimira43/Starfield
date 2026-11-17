const SYLLABLES = [
  'ra', 'lu', 'ka', 'no', 've', 'ri', 'sa', 'to', 'ly', 'en', 'mi', 'za',
  'el', 'al', 'si', 'le', 'ni', 'my', 'je', 'ah', 'or', 'an', 'is', 'ar',
  'eth', 'ion', 'ur', 'as', 'in', 'om', 'ys', 'ae', 'la', 'na', 'vi', 'lo',
  'ta', 'me', 'di', 'fa', 'so', 're', 'do', 'ei', 'ou', 'ya', 'jo', 'ki',
  'mo', 'pa', 'ti', 'ze', 'ny', 'sha', 'ira', 'una', 'elo', 'ari', 'nea',
  'ava', 'osa', 'elu', 'ina', 'oro', 'umi', 'esa', 'ilo', 'ani', 'eya',
  'iso', 'ure'
]

const LENGTHS = [
  { count: 2, weight: 45 },
  { count: 3, weight: 42 },
  { count: 4, weight: 13 }
]

export default function generateName(rng) {
  const { count } = rng.weighted(LENGTHS)
  let name = ''
  for (let i = 0; i < count; i++) name += rng.pick(SYLLABLES)

  name = name
    .replace(/(.)\1{2,}/g, '$1$1')               
    .replace(/([aeiouy]{2})[aeiouy]+/g, '$1')    

  return name.charAt(0).toUpperCase() + name.slice(1)
}


export function createNameRegistry(rng, taken = new Set()) {
  return () => {
    let name
    let tries = 0
    do {
      name = generateName(rng)
      tries++
    } while (taken.has(name) && tries < 50)
    taken.add(name)
    return name
  }
}
