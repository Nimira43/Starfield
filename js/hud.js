import { STELLAR_CLASSES } from './stellarClasses.js'

const fmt = (n) => n.toLocaleString('en-GB')

export function createHud(root, { onNew, onCopy, onRandom, onSearch }) {
  root.innerHTML = `
    <div class='hud-head'>
      <div class='hud-title'>STARFIELD</div>
      <button class='hud-toggle' data-act='toggle' title='Hide panel (H)'>-</button>
    </div>
    <div class='hud-body'>
      <div class='hud-seed'>Universe <span data-seed></span></div>
      <div class='hud-buttons'>
        <button data-act='new'>New universe</button>
        <button data-act='copy'>Copy link</button>
        <button data-act='random'>Random inhabited</button>
      </div>
      <form class='hud-search'>
        <input type='search' placeholder='Find a star or planet…' spellcheck='false' autocomplete='off'>
        <div class='hud-msg' data-msg></div>
      </form>
      <div class='hud-stats' data-stats></div>
    </div>`

  const $ = (sel) => root.querySelector(sel)
  const input = $('input')

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'new') onNew()
    if (act === 'copy') onCopy()
    if (act === 'random') onRandom()
    if (act === 'toggle') toggle()
  })

  $('form').addEventListener('submit', (e) => {
    e.preventDefault()
    onSearch(input.value)
  })

  function toggle() {
    root.classList.toggle('collapsed')
    $('.hud-toggle').textContent = root.classList.contains('collapsed')
      ? '+'
      : '-'
  }

  return {
    setSeed(seed) {
      $('[data-seed]').textContent = `#${seed}`
    },

    setStats(stats) {
      const el = $('[data-stats]')
      if (!stats) {
        el.innerHTML = '<span>Charting the universe…</span>'
        return
      }
      el.innerHTML = `
        <span>Stars</span><b>${fmt(stats.stars)}</b>
        <span>Planets</span><b>${fmt(stats.planets)}</b>
        <span>Moons</span><b>${fmt(stats.moons)}</b>
        <span>Inhabited worlds</span><b class='gold'>${fmt(stats.inhabited)}</b>
        <span>Habitable, unclaimed</span><b class='green'>${fmt(stats.habitable)}</b>
        <div class='hud-classes'>${STELLAR_CLASSES.map(
          (c) =>
            `<span title='${c.label}'><i class='class-dot' style='color:${c.colour}background:${c.colour}'></i>${c.code} ${fmt(stats.byClass[c.code])}</span>`,
        ).join('')}</div>`
    },

    message(text) {
      $('[data-msg]').textContent = text
    },

    flash(act, text) {
      const btn = root.querySelector(`[data-act='${act}']`)
      const original = btn.textContent
      btn.textContent = text
      setTimeout(() => {
        btn.textContent = original
      }, 1500)
    },

    focusSearch() {
      if (root.classList.contains('collapsed')) toggle()
      input.focus()
      input.select()
    },

    toggle,
    show() {
      root.style.display = ''
    },
    hide() {
      root.style.display = 'none'
    },
  }
}
