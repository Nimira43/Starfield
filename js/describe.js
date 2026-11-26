export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  )

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function formatAU(au) {
  return au < 10 ? au.toFixed(2) : au.toFixed(0)
}

export function formatYear(years) {
  const days = years * 365.25
  if (days < 1) return `${Math.round(days * 24)} hours`
  if (days < 730) return `${Math.round(days)} days`
  return `${years < 100 ? years.toFixed(1) : Math.round(years)} years`
}

export function habTag(habitability, { showUninhabitable = false } = {}) {
  if (habitability === "inhabited" || habitability === "habitable") {
    return `<span class="tag ${habitability}">${habitability}</span>`
  }
  if (habitability === "uninhabitable" && showUninhabitable)
    return '<span class="tag dim">uninhabitable</span>'
  return ""
}

export function classLine(star) {
  return `<i class="class-dot" style="color:${star.cls.colour};background:${star.cls.colour}"></i>${star.cls.code}-type ${star.cls.label}`
}

export function starTooltipHtml(star, system) {
  const rows = system.planets.map((p) => {
    const lifeMoons = p.moons.filter(
      (m) => m.habitability === "inhabited",
    ).length
    return `<div>• ${esc(p.name)} <span class="dim">${p.type}, ${plural(p.moons.length, "moon")}</span>${habTag(p.habitability)}${lifeMoons ? '<span class="tag inhabited">inhabited moon</span>' : ""}</div>`
  })
  return `
    <div class="tt-title">${esc(star.name)}</div>
    <div class="tt-sub">${classLine(star)}</div>
    ${rows.join("") || '<div class="dim">No known planets</div>'}
    <div class="tt-foot">Click to visit</div>`
}

export function planetMetaHtml(p) {
  return `${p.type} · ${formatAU(p.orbit)} AU · ${p.tempC}°C${habTag(p.habitability)}`
}

export function moonsHtml(p) {
  if (!p.moons.length) return ""
  return (
    `${plural(p.moons.length, "moon")}: ` +
    p.moons
      .map((m) =>
        m.habitability
          ? `<span class="${m.habitability}">${esc(m.name)}</span>`
          : esc(m.name),
      )
      .join(", ")
  )
}

export function planetTooltipHtml(p) {
  const moons = p.moons
    .map(
      (m) =>
        `<div class="tt-moon">🌙 ${esc(m.name)} <span class="dim">${m.large ? "large " : ""}${m.type}</span>${habTag(m.habitability)}</div>`,
    )
    .join("")
  return `
    <div class="tt-title">${esc(p.name)}</div>
    <div>${capitalise(p.type)} · ${p.size.toFixed(1)}× Earth radius${p.rings ? " · ringed" : ""}</div>
    <div class="dim">Orbit ${formatAU(p.orbit)} AU · year of ${formatYear(p.period)}</div>
    <div class="dim">Average temperature ${p.tempC}°C${p.inZone ? " · in habitable zone" : ""}</div>
    ${p.habitability ? `<div>${habTag(p.habitability, { showUninhabitable: true })}</div>` : ""}
    ${moons ? `<div class="tt-moons">${moons}</div>` : '<div class="dim">No moons</div>'}`
}
