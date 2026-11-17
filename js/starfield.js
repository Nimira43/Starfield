import { rgba } from './colour.js'
import { createRng, hashString } from './rng.js'

const PARALLAX = [3, 7, 14]
const CELL = 40
const NEBULA_COLOURS = ['#5b3fa8', '#2f5fa8', '#2a8f8a', '#a83f6f', '#3f3fa8']

export function createStarfield(canvas) {
  const ctx = canvas.getContext('2d')
  const nebula = document.createElement('canvas')
  const sprites = new Map()

  let universe = null
  let w = 0,
    h = 0,
    dpr = 1
  let grid = new Map()
  const target = { x: 0, y: 0 }
  const offset = { x: 0, y: 0 }
  let hovered = null
  let locator = null
  let running = false
  let raf = 0

  function sprite(colour) {
    if (sprites.has(colour)) return sprites.get(colour)
    const size = 64
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    )
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.16, colour)
    grad.addColorStop(0.25, rgba(colour, 0.85))
    grad.addColorStop(0.45, rgba(colour, 0.18))
    grad.addColorStop(1, rgba(colour, 0))
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
    sprites.set(colour, c)
    return c
  }

  function paintNebula() {
    const g = nebula.getContext('2d')
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    if (!universe) return
    const rng = createRng(hashString(`${universe.seed}:nebula`))
    const count = rng.int(3, 5)
    for (let i = 0; i < count; i++) {
      const x = rng.next() * w
      const y = rng.next() * h
      const r = rng.float(0.25, 0.6) * Math.max(w, h)
      const colour = rng.pick(NEBULA_COLOURS)
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, rgba(colour, rng.float(0.06, 0.12)))
      grad.addColorStop(1, rgba(colour, 0))
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
    }
  }

  function buildGrid() {
    grid = new Map()
    if (!universe) return
    for (const star of universe.stars) {
      const key = `${Math.floor((star.nx * w) / CELL)},${Math.floor((star.ny * h) / CELL)}`
      if (!grid.has(key)) grid.set(key, [])
      grid.get(key).push(star)
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    for (const c of [canvas, nebula]) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    paintNebula()
    buildGrid()
    if (!running) draw(performance.now())
  }

  function draw(now) {
    const t = now / 1000
    offset.x += (target.x - offset.x) * 0.06
    offset.y += (target.y - offset.y) * 0.06

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(nebula, 0, 0, w, h)
    if (!universe) return

    ctx.globalCompositeOperation = 'lighter'
    for (const star of universe.stars) {
      const shift = PARALLAX[star.depth]
      star.sx = star.nx * w + offset.x * shift
      star.sy = star.ny * h + offset.y * shift

      const amp = star.radius < 1 ? 0.55 : 0.25
      ctx.globalAlpha =
        1 -
        amp * (0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinklePhase))
      const size = star.radius * 8
      ctx.drawImage(
        sprite(star.cls.colour),
        star.sx - size / 2,
        star.sy - size / 2,
        size,
        size,
      )
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    if (hovered) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(hovered.sx, hovered.sy, hovered.radius * 2.5 + 5, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (locator && now < locator.until) {
      const { star } = locator
      for (let k = 0; k < 3; k++) {
        const phase = (t * 0.8 + k / 3) % 1
        ctx.strokeStyle = `rgba(255, 215, 0, ${(1 - phase) * 0.8})`
        ctx.beginPath()
        ctx.arc(star.sx, star.sy, 6 + phase * 40, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  function loop(now) {
    draw(now)
    if (running) raf = requestAnimationFrame(loop)
  }

  window.addEventListener('resize', resize)
  resize()

  return {
    setUniverse(u) {
      universe = u
      hovered = null
      locator = null
      paintNebula()
      buildGrid()
      if (!running) draw(performance.now())
    },

    pickAt(x, y) {
      if (!universe) return null
      const cx = Math.floor(x / CELL)
      const cy = Math.floor(y / CELL)
      let best = null
      let bestDist = Infinity
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const cell = grid.get(`${gx},${gy}`)
          if (!cell) continue
          for (const star of cell) {
            const d = Math.hypot(star.sx - x, star.sy - y)
            if (d < Math.max(10, star.radius * 4) && d < bestDist) {
              best = star
              bestDist = d
            }
          }
        }
      }
      return best
    },

    pointer(x, y) {
      target.x = -(x - w / 2) / (w / 2)
      target.y = -(y - h / 2) / (h / 2)
    },

    setHovered(star) {
      hovered = star
    },

    locate(star) {
      locator = { star, until: performance.now() + 5000 }
      hovered = star
    },

    start() {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    },

    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
  }
}
