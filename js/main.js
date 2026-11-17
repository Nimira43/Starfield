import { createUniverse, computeStats } from './universe.js'
import { createStarfield } from './starfield.js'
import { createSystemView } from './systemView.js'
import { createTooltip } from './tooltip.js'
import { createHud } from './hud.js'
import {
  initialSeed,
  seedFromUrl,
  shareUrl,
  clearSeedFromUrl,
} from './seed.js'
import { randomSeed } from './rng.js'
import { starTooltipHtml } from './describe.js'

const starCanvas = document.getElementById('starfield')
const hint = document.getElementById('hint')

let universe = null
let stats = null

const tooltip = createTooltip()
const starfield = createStarfield(starCanvas)
const hud = createHud(document.getElementById('hud'), {
  onNew,
  onCopy,
  onRandom,
  onSearch,
})
const systemView = createSystemView({
  canvas: document.getElementById('system'),
  panel: document.getElementById('system-panel'),
  tooltip,
  onClose() {
    starfield.start()
    hud.show()
    hint.hidden = false
  },
})

function load(seed) {
  universe = createUniverse(seed)
  stats = null
  tooltip.hide()
  starfield.setUniverse(universe)
  hud.setSeed(seed)
  hud.setStats(null)
  hud.message('')

  setTimeout(() => {
    if (universe.seed !== seed) return
    ensureStats()
    hud.setStats(stats)
    console.log(
      `🌌 Starfield #${seed}: ${stats.stars} stars, ${stats.planets} planets, ${stats.moons} moons, ${stats.inhabited} inhabited worlds`,
    )
    console.log('   starfield.dump() prints the full registry')
  }, 30)

  window.starfield = {
    universe,
    stats: () => stats,
    dump: () => dump(universe),
  }
}

function ensureStats() {
  if (!stats) stats = computeStats(universe)
  return stats
}

function dump(u) {
  for (const star of u.stars) {
    const { planets } = u.getSystem(star)
    console.groupCollapsed(
      `⭐ ${star.name} (${star.cls.code}) · ${planets.length} planets`,
    )
    for (const p of planets) {
      console.log(
        `🪐 ${p.name} (${p.type}${p.habitability ? ', ' + p.habitability : ''}) ${p.orbit.toFixed(2)} AU`,
      )
      p.moons.forEach((m) =>
        console.log(
          `   🌙 ${m.name}${m.habitability ? ' (' + m.habitability + ')' : ''}`,
        ),
      )
    }
    console.groupEnd()
  }
}

function openSystem(star, planet = null) {
  tooltip.hide()
  starfield.setHovered(null)
  hud.hide()
  hint.hidden = true
  systemView.open(universe.getSystem(star), star.sx, star.sy, planet)
  setTimeout(() => {
    if (systemView.isOpen()) starfield.stop()
  }, 500)
}

function onNew() {
  clearSeedFromUrl()
  load(randomSeed())
}

async function onCopy() {
  const url = shareUrl(universe.seed)
  try {
    await navigator.clipboard.writeText(url)
    hud.flash('copy', 'Copied!')
  } catch {
    window.prompt('Copy this link to revisit this universe:', url)
  }
}

function onRandom() {
  const { inhabitedStars } = ensureStats()
  if (!inhabitedStars.length)
    return hud.message('No life anywhere. A lonely universe.')
  openSystem(inhabitedStars[Math.floor(Math.random() * inhabitedStars.length)])
}

function onSearch(query) {
  const q = query.trim().toLowerCase()
  if (!q) return
  const { stars } = universe
  const star =
    stars.find((s) => s.name.toLowerCase() === q) ??
    stars.find((s) => s.name.toLowerCase().startsWith(q))
  if (star) {
    starfield.locate(star)
    hud.message(`${star.name}: click it to visit`)
    return
  }
  for (const s of stars) {
    const planet = universe
      .getSystem(s)
      .planets.find((p) => p.name.toLowerCase().startsWith(q))
    if (planet) {
      hud.message(`${planet.name} orbits ${s.name}`)
      openSystem(s, planet)
      return
    }
  }
  hud.message('Nothing by that name out here')
}

starCanvas.addEventListener('mousemove', (e) => {
  starfield.pointer(e.clientX, e.clientY)
  const star = starfield.pickAt(e.clientX, e.clientY)
  starfield.setHovered(star)
  starCanvas.style.cursor = star ? 'pointer' : 'default'
  if (star)
    tooltip.show(
      starTooltipHtml(star, universe.getSystem(star)),
      e.clientX,
      e.clientY,
    )
  else tooltip.hide()
})

starCanvas.addEventListener('mouseleave', () => {
  starfield.setHovered(null)
  tooltip.hide()
})

starCanvas.addEventListener('click', (e) => {
  const star = starfield.pickAt(e.clientX, e.clientY)
  if (star) openSystem(star)
})

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') {
    if (e.key === 'Escape') e.target.blur()
    return
  }
  if (systemView.isOpen()) {
    if (e.key === 'Escape') systemView.close()
    if (e.key === ' ') {
      e.preventDefault()
      systemView.togglePause()
    }
    return
  }
  if (e.key === '/') {
    e.preventDefault()
    hud.focusSearch()
  }
  if (e.key.toLowerCase() === 'h') hud.toggle()
})

window.addEventListener('hashchange', () => {
  const seed = seedFromUrl()
  if (seed && seed !== universe.seed) {
    systemView.close()
    load(seed)
  }
})

load(initialSeed())
starfield.start()
