export default function generateName() {
  const syllables = ['ra', 'lu', 'ka', 'no', 've', 'ri', 'sa', 'to', 'ly', 'en', 'mi', 'za']
  const count = Math.floor(Math.random() * 3) + 2
   
  let name = ''

  for (let i = 0; i < count; i++) {
    name += syllables[Math.floor(Math.random() * syllables.length)]
  }
  return name.charAt(0).toUpperCase() + name.slice(1) 
}