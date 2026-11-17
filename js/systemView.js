import { rgba, shade } from './colour.js'
import { createRng, hashString } from './rng.js'
import {
  esc,
  classLine,
  plural,
  formatAU,
  planetMetaHtml,
  moonsHtml,
  planetTooltipHtml,
} from './describe.js'

const TAU = Math.PI * 2
const TILT = 0.42
const SPEEDS = [0.25, 1, 4, 16]
const DURATION = 450
const GOLD = '#ffd700'
const GREEN = '#8fe0a0'

const ease = (t) => 1 - Math.pow(1 - t, 3)
const lerp = (a, b, t) => a + (b - a) * t
const wrap = (v) => ((((v + 1.6) % 3.2) + 3.2) % 3.2) - 1.6
const visualPeriod = (years) => 14 * Math.pow(years, 0.4)

export function createSystemView({ canvas, panel, tooltip, onClose }) {
  const ctx = canvas.getContext('2d')
  let w = 0,
    h = 0,
    dpr = 1
  let system = null
  let open = false
  let transition = { start: 0, dir: 1, from: { x: 0, y: 0 } }
  let simTime = 0,
    last = 0
  let speedIndex = 1
  let paused = false
  let hovered = null
  let highlighted = null
  let layout = null
  let positions = []
  let bgStars = []
  let raf = 0
  const mouse = { x: -1, y: -1 }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    computeLayout()
  }

  function computeLayout() {
    if (!system) return
    const panelW = w >= 900 ? 330 : 0
    const cx = (w - panelW) / 2
    const cy = h / 2 + (w >= 900 ? 10 : 40)
    const starR = system.star.cls.systemRadius
    const { planets } = system
    const biggest = planets.reduce(
      (m, p) => Math.max(m, p.radiusPx * (p.rings ? 2.3 : 1)),
      0,
    )
    const maxR = Math.max(
      starR * 2.5,
      Math.min((w - panelW) / 2 - 30 - biggest, (h / 2 - 70) / TILT),
    )
    const minR = starR * 1.5 + 20 + (planets[0]?.radiusPx ?? 0)

    let orbitPx
    if (planets.length <= 1) {
      const a0 = planets[0]?.orbit ?? 1
      const mid = (minR + maxR) / 2
      orbitPx = (a) => mid * Math.pow(a / a0, 0.5)
    } else {
      const aMin = planets[0].orbit
      const span = Math.log(planets[planets.length - 1].orbit / aMin)
      orbitPx = (a) => minR + (Math.log(a / aMin) / span) * (maxR - minR)
    }
    layout = {
      cx,
      cy,
      starR,
      maxR,
      orbitPx,
      orbits: planets.map((p) => orbitPx(p.orbit)),
    }
  }

  function makeBackground() {
    const rng = createRng(hashString(`${system.seed}:${system.star.id}:bg`))
    bgStars = Array.from({ length: 220 }, () => ({
      x: rng.next(),
      y: rng.next(),
      r: rng.float(0.3, 1.1),
      a: rng.float(0.15, 0.6),
    }))
  }

  function computePositions() {
    const { cx, cy, orbits } = layout
    return system.planets.map((planet, i) => {
      const r = orbits[i]
      const angle =
        planet.phase + (simTime * TAU) / visualPeriod(planet.period)
      const sin = Math.sin(angle)
      const x = cx + Math.cos(angle) * r
      const y = cy + sin * r * TILT
      return {
        planet,
        x,
        y,
        sin,
        radius: planet.radiusPx * (1 + sin * 0.1),
        light: Math.atan2(cy - y, cx - x),
      }
    })
  }

  function moonPositions(q) {
    const { planet, x, y, radius } = q
    const base = radius * (planet.rings ? 2.3 : 1) + 5
    return planet.moons.map((moon, i) => {
      const d = base + i * 4
      const angle = moon.phase + (simTime * moon.speed * TAU) / (2 + i * 0.9)
      const sin = Math.sin(angle)
      return {
        moon,
        x: x + Math.cos(angle) * d,
        y: y + sin * d * TILT * 1.2,
        sin,
      }
    })
  }

  function drawStarGlow(t) {
    const { cx, cy, starR } = layout
    const colour = system.star.cls.colour
    const R = starR * 4.5 * (1 + Math.sin(t * 1.7) * 0.03)
    const g = ctx.createRadialGradient(cx, cy, starR * 0.5, cx, cy, R)
    g.addColorStop(0, rgba(colour, 0.5))
    g.addColorStop(0.25, rgba(colour, 0.16))
    g.addColorStop(1, rgba(colour, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, TAU)
    ctx.fill()
  }

  function drawStarCore() {
    const { cx, cy, starR } = layout
    const colour = system.star.cls.colour
    const g = ctx.createRadialGradient(
      cx - starR * 0.25,
      cy - starR * 0.25,
      0,
      cx,
      cy,
      starR,
    )
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.55, shade(colour, 0.3))
    g.addColorStop(1, colour)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, starR, 0, TAU)
    ctx.fill()
  }

  function drawZones() {
    const { cx, cy, orbitPx, starR, maxR } = layout
    const limit = maxR + 80
    ctx.font = '14px VT323, monospace'
    ctx.textAlign = 'center'

    const inner = Math.max(starR * 1.2, orbitPx(system.habitableZone[0]))
    const outer = Math.min(limit, orbitPx(system.habitableZone[1]))
    if (outer > inner) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, outer, outer * TILT, 0, 0, TAU)
      ctx.moveTo(cx + inner, cy)
      ctx.ellipse(cx, cy, inner, inner * TILT, 0, 0, TAU)
      ctx.fillStyle = 'rgba(80, 220, 120, 0.07)'
      ctx.fill('evenodd')
      ctx.fillStyle = 'rgba(120, 230, 150, 0.45)'
      ctx.fillText('habitable zone', cx, cy - outer * TILT - 5)
    }

    const frost = orbitPx(system.frostLine)
    if (frost > starR * 1.3 && frost < limit) {
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = 'rgba(140, 200, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(cx, cy, frost, frost * TILT, 0, 0, TAU)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(140, 200, 255, 0.4)'
      ctx.fillText('frost line', cx, cy + frost * TILT + 14)
    }
  }

  function drawOrbits() {
    const { cx, cy, orbits } = layout
    system.planets.forEach((p, i) => {
      const r = orbits[i]
      const active = p === hovered || p === highlighted
      ctx.strokeStyle = active
        ? 'rgba(255, 215, 0, 0.6)'
        : p.habitability === 'inhabited'
          ? 'rgba(255, 215, 0, 0.22)'
          : 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = active ? 1.5 : 1
      ctx.beginPath()
      ctx.ellipse(cx, cy, r, r * TILT, 0, 0, TAU)
      ctx.stroke()
    })
  }

  function drawRing(x, y, r, planet, back) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(planet.ringTilt)
    ctx.scale(1, 0.3)
    const [a0, a1] = back ? [Math.PI, TAU] : [0, Math.PI]
    ctx.strokeStyle = rgba(planet.ringColour, back ? 0.35 : 0.6)
    ctx.lineWidth = r * 0.5
    ctx.beginPath()
    ctx.arc(0, 0, r * 1.75, a0, a1)
    ctx.stroke()
    ctx.strokeStyle = rgba(planet.ringColour, back ? 0.15 : 0.3)
    ctx.lineWidth = r * 0.15
    ctx.beginPath()
    ctx.arc(0, 0, r * 2.2, a0, a1)
    ctx.stroke()
    ctx.restore()
  }

  function drawSurface(planet, x, y, r, light) {
    const [c0, c1] = planet.colours
    const spin = simTime * planet.spin

    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.clip()

    ctx.fillStyle = c0
    ctx.fillRect(x - r, y - r, r * 2, r * 2)

    if (planet.type === 'rocky') {
      ctx.fillStyle = c1
      for (const f of planet.features) {
        ctx.beginPath()
        ctx.ellipse(
          x + wrap(f.x + spin) * r,
          y + f.y * r,
          f.rx * r,
          f.ry * r,
          f.rot,
          0,
          TAU,
        )
        ctx.fill()
      }
      if (planet.living) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.fillRect(x - r, y - r, r * 2, r * 0.22)
        ctx.fillRect(x - r, y + r * 0.82, r * 2, r * 0.18)
      }
    } else {
      for (const b of planet.bands) {
        ctx.fillStyle = rgba(planet.colours[b.c], b.a)
        ctx.fillRect(x - r, y + b.y * r, r * 2, b.h * r)
      }
      if (planet.storm) {
        const s = planet.storm
        ctx.fillStyle = shade(c1, -0.25)
        ctx.beginPath()
        ctx.ellipse(
          x + wrap(s.x + spin) * r,
          y + s.y * r,
          s.rx * r,
          s.ry * r,
          0,
          0,
          TAU,
        )
        ctx.fill()
      }
    }

    const lx = Math.cos(light),
      ly = Math.sin(light)
    const g = ctx.createLinearGradient(
      x + lx * r,
      y + ly * r,
      x - lx * r,
      y - ly * r,
    )
    g.addColorStop(0, 'rgba(255, 255, 240, 0.22)')
    g.addColorStop(0.4, 'rgba(0, 0, 0, 0)')
    g.addColorStop(0.62, 'rgba(0, 0, 0, 0.55)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0.88)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
    ctx.restore()

    if (planet.living) {
      ctx.lineWidth = 1.2
      ctx.strokeStyle = 'rgba(143, 208, 255, 0.55)'
      ctx.beginPath()
      ctx.arc(x, y, r + 0.8, 0, TAU)
      ctx.stroke()
      ctx.lineWidth = 3
      ctx.strokeStyle = 'rgba(143, 208, 255, 0.12)'
      ctx.beginPath()
      ctx.arc(x, y, r + 2.5, 0, TAU)
      ctx.stroke()
    }
  }

  function drawMoon(m, light) {
    const { moon, x, y } = m
    const r = moon.radiusPx
    const g = ctx.createRadialGradient(
      x + Math.cos(light) * r * 0.5,
      y + Math.sin(light) * r * 0.5,
      0,
      x,
      y,
      r * 1.2,
    )
    g.addColorStop(0, moon.colour)
    g.addColorStop(1, shade(moon.colour, -0.7))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
    if (moon.habitability) {
      ctx.strokeStyle = moon.habitability === 'inhabited' ? GOLD : GREEN
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.arc(x, y, r + 1.5, 0, TAU)
      ctx.stroke()
    }
  }

  function drawBody(q) {
    const { planet, x, y, radius: r, light } = q
    const moons = moonPositions(q)
    moons.filter((m) => m.sin < 0).forEach((m) => drawMoon(m, light))
    if (planet.rings) drawRing(x, y, r, planet, true)
    drawSurface(planet, x, y, r, light)
    if (planet.rings) drawRing(x, y, r, planet, false)
    moons.filter((m) => m.sin >= 0).forEach((m) => drawMoon(m, light))

    if (planet === hovered || planet === highlighted) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(x, y, r + 5, 0, TAU)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  function drawLabel(q) {
    const { planet, x, y, radius } = q
    ctx.font = '15px VT323, monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle =
      planet.habitability === 'inhabited'
        ? GOLD
        : planet.habitability === 'habitable'
          ? GREEN
          : 'rgba(255, 253, 250, 0.55)'
    ctx.fillText(planet.name, x, y + radius * (planet.rings ? 1.3 : 1) + 14)
  }

  function draw(p, t) {
    const { cx, cy } = layout
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    ctx.globalAlpha = p
    ctx.fillStyle = '#03040b'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#fff'
    for (const s of bgStars) {
      ctx.globalAlpha = p * s.a
      ctx.beginPath()
      ctx.arc(s.x * w, s.y * h, s.r, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = p

    ctx.save()
    const scale = lerp(0.03, 1, p)
    ctx.translate(
      lerp(transition.from.x, cx, p),
      lerp(transition.from.y, cy, p),
    )
    ctx.scale(scale, scale)
    ctx.translate(-cx, -cy)

    drawStarGlow(t)
    drawZones()
    drawOrbits()

    positions = computePositions()
    const byDepth = (a, b) => a.y - b.y
    positions
      .filter((q) => q.sin < 0)
      .sort(byDepth)
      .forEach(drawBody)
    drawStarCore()
    positions
      .filter((q) => q.sin >= 0)
      .sort(byDepth)
      .forEach(drawBody)
    positions.forEach(drawLabel)

    ctx.restore()
    ctx.globalAlpha = 1
  }

  function updateHover() {
    let found = null
    for (const q of positions) {
      if (Math.hypot(q.x - mouse.x, q.y - mouse.y) < q.radius + 6) {
        if (!found || q.sin > found.sin) found = q
      }
    }
    const planet = found?.planet ?? null
    if (planet !== hovered) {
      hovered = planet
      syncPanel()
    }
    canvas.style.cursor = planet ? 'pointer' : 'default'
    if (planet) tooltip.show(planetTooltipHtml(planet), mouse.x, mouse.y)
    else tooltip.hide()
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!paused) simTime += dt * SPEEDS[speedIndex]

    const raw = Math.min(1, (now - transition.start) / DURATION)
    const p = transition.dir > 0 ? ease(raw) : 1 - ease(raw)
    draw(p, now / 1000)

    if (transition.dir < 0 && raw >= 1) return finishClose()
    if (transition.dir > 0 && raw >= 1) updateHover()
    raf = requestAnimationFrame(frame)
  }

  function buildPanel() {
    const {
      star,
      planets,
      habitableZone: [h0, h1],
    } = system
    const items = planets
      .map(
        (p, i) => `
      <li data-i='${i}' class='${p.habitability ?? ''}'>
        <div class='sp-name'>${esc(p.name)}</div>
        <div class='sp-meta'>${planetMetaHtml(p)}</div>
        ${p.moons.length ? `<div class='sp-moons'>${moonsHtml(p)}</div>` : ''}
      </li>`,
      )
      .join('')

    panel.innerHTML = `
      <div class='sp-title'>${esc(star.name)}</div>
      <div class='sp-sub'>${classLine(star)}</div>
      <div class='sp-sub dim'>${star.luminosity < 10 ? star.luminosity.toFixed(2) : Math.round(star.luminosity)} L☉ · ${star.mass.toFixed(2)} M☉ · ${plural(planets.length, 'planet')}</div>
      <div class='sp-controls'>
        <button data-act='back'>← Back</button>
        <button data-act='pause'>${paused ? 'Play' : 'Pause'}</button>
        <button data-act='speed'>Speed ${SPEEDS[speedIndex]}×</button>
      </div>
      <div class='sp-zone'>Habitable zone ${formatAU(h0)}–${formatAU(h1)} AU</div>
      <ul class='sp-planets'>${items || "<li class='empty dim'>No known planets: a lonely star.</li>"}</ul>
      <div class='sp-hint'>Esc to return · Space to pause</div>`
  }

  function syncPanel() {
    const active = hovered ?? highlighted
    panel.querySelectorAll('.sp-planets li[data-i]').forEach((li) => {
      const on = system.planets[+li.dataset.i] === active
      li.classList.toggle('active', on)
      if (on && active === highlighted && !hovered)
        li.scrollIntoView({ block: 'nearest' })
    })
  }

  function syncControls() {
    const pause = panel.querySelector("[data-act='pause']")
    const speed = panel.querySelector("[data-act='speed']")
    if (pause) pause.textContent = paused ? 'Play' : 'Pause'
    if (speed) speed.textContent = `Speed ${SPEEDS[speedIndex]}×`
  }

  panel.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'back') close()
    if (act === 'pause') togglePause()
    if (act === 'speed') {
      speedIndex = (speedIndex + 1) % SPEEDS.length
      syncControls()
    }
    const li = e.target.closest('li[data-i]')
    if (li) {
      highlighted = system.planets[+li.dataset.i]
      syncPanel()
    }
  })

  panel.addEventListener('mouseover', (e) => {
    const li = e.target.closest('li[data-i]')
    if (li && system) {
      highlighted = system.planets[+li.dataset.i]
      syncPanel()
    }
  })

  canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
  })

  canvas.addEventListener('mouseleave', () => {
    mouse.x = mouse.y = -1
    tooltip.hide()
  })

  canvas.addEventListener('click', () => {
    highlighted = hovered
    syncPanel()
  })

  function openSystem(sys, fromX, fromY, focusPlanet = null) {
    system = sys
    open = true
    hovered = null
    highlighted = focusPlanet
    simTime = 0
    paused = false
    canvas.style.display = 'block'
    panel.style.display = 'block'
    transition = {
      start: performance.now(),
      dir: 1,
      from: { x: fromX, y: fromY },
    }
    resize()
    makeBackground()
    buildPanel()
    syncPanel()
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(frame)
  }

  function close() {
    if (!open || transition.dir < 0) return
    tooltip.hide()
    const now = performance.now()
    const elapsed = Math.min(1, (now - transition.start) / DURATION)
    transition = {
      ...transition,
      start: now - (1 - elapsed) * DURATION,
      dir: -1,
    }
    panel.style.display = 'none'
    canvas.style.cursor = 'default'
    onClose?.()
  }

  function finishClose() {
    open = false
    system = null
    canvas.style.display = 'none'
    cancelAnimationFrame(raf)
  }

  function togglePause() {
    paused = !paused
    syncControls()
  }

  window.addEventListener('resize', () => {
    if (open) resize()
  })

  return {
    open: openSystem,
    close,
    togglePause,
    isOpen: () => open && transition.dir > 0,
  }
}
