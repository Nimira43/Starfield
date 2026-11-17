import { randomSeed } from './rng.js'


export function seedFromUrl() {
  const match = location.hash.match(/seed=([0-9a-z]+)/i)
  return match ? match[1].toLowerCase() : null
}

export function initialSeed() {
  return seedFromUrl() ?? randomSeed()
}

export function shareUrl(seed) {
  return `${location.href.split('#')[0]}#seed=${seed}`
}

export function clearSeedFromUrl() {
  history.replaceState(null, '', location.pathname + location.search)
}
