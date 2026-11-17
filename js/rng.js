function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function createRng(seed) {
  const next = mulberry32(
    typeof seed === 'number' ? seed : hashString(String(seed)),
  )
  return {
    next,
    float: (min = 0, max = 1) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted(items) {
      const total = items.reduce((sum, item) => sum + item.weight, 0)
      let roll = next() * total
      for (const item of items) {
        roll -= item.weight
        if (roll <= 0) return item
      }
      return items[items.length - 1]
    },
  }
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0')
}
