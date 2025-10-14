export default function generateName() {
 const syllables = [
  'ra', 'lu', 'ka', 'no', 've', 'ri', 'sa', 'to', 'ly', 'en', 'mi', 'za',
  'el', 'al', 'si', 'th', 'le', 'ni', 'my', 'qu', 'je', 'ah', 'ex',
  'or', 'an', 'is', 'ar', 'eth', 'ion', 'ur', 'as', 'in', 'om', 'ys', 'ae',
  'la', 'na', 'vi', 'lo', 'ta', 'me', 'di', 'fa', 'so', 're', 'do', 'br',
  'ei', 'ou', 'ya', 'jo', 'ki', 'mo', 'pa', 'ti', 'ze', 'ny',
  'sha', 'ira', 'una', 'elo', 'ari', 'nea', 'ava', 'elo', 'ira', 'osa',
  'elu', 'ina', 'oro', 'umi', 'esa', 'ilo', 'ani', 'eya', 'iso', 'ure'
]

  const count = Math.floor(Math.random() * 3) + 2
  let name = ''

  for (let i = 0; i < count; i++) {
    name += syllables[Math.floor(Math.random() * syllables.length)]
  }
  return name.charAt(0).toUpperCase() + name.slice(1) 
}