const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

const PROFILES = {
  stable: {
    label: 'Estable',
    desc: 'Prioriza latencia baja, RAM libre y cambios reversibles. El audio se precarga y el resto se desplaza a ZRAM.',
    score: 97,
    note: 'Última aplicación: hace 2 min · watchdog armado',
    scoreMeta: 'Sin tirones en 6 h',
    cpu: 2.02,
    ram: 68,
    zram: 37,
    temp: 41.8,
    audioPct: 24,
    swappiness: 100,
    zramSize: 3,
    reserved: '2.4 GB',
    freqs: { prime: 2.4, big: 1.9, little: 1.42 },
    bars: { prime: 78, big: 64, little: 52 }
  },
  performance: {
    label: 'Rendimiento',
    desc: 'Sube mínimos y prioriza el primer plano. El audio conserva prioridad pero reduce su reserva; ZRAM baja para no competir por ancho de banda.',
    score: 92,
    note: 'Última aplicación: ahora · watchdog armado',
    scoreMeta: 'Margen térmico reducido',
    cpu: 2.4,
    ram: 74,
    zram: 28,
    temp: 44.6,
    audioPct: 17,
    swappiness: 70,
    zramSize: 2.5,
    reserved: '1.7 GB',
    freqs: { prime: 2.4, big: 1.9, little: 1.42 },
    bars: { prime: 96, big: 82, little: 70 }
  },
  audio: {
    label: 'Audio Lock',
    desc: 'Precarga total y anclaje de audio al inicio. La RAM rápida queda para el primer plano y el resto vive comprimido en ZRAM.',
    score: 99,
    note: 'Última aplicación: ahora · mlock activo',
    scoreMeta: 'Audio anclado · 0 underruns',
    cpu: 1.9,
    ram: 81,
    zram: 62,
    temp: 43.1,
    audioPct: 31,
    swappiness: 140,
    zramSize: 4,
    reserved: '3.1 GB',
    freqs: { prime: 2.02, big: 1.9, little: 1.42 },
    bars: { prime: 66, big: 64, little: 52 }
  }
}

const state = {
  profile: 'stable',
  swappiness: 100,
  zramSize: 3,
  metrics: { cpu: 2.02, ram: 68, zram: 37, temp: 41.8 }
}

const SPARK_RANGE = {
  cpu: [0.7, 2.7],
  ram: [25, 95],
  zram: [0, 100],
  temp: [30, 58]
}
const SPARK_LENGTH = 22
const sparkSeries = { cpu: [], ram: [], zram: [], temp: [] }

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const timeNow = () => {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(value => String(value).padStart(2, '0'))
    .join(':')
}

const seedSeries = (key, center) => {
  const spread = { cpu: 0.14, ram: 2, zram: 5, temp: 0.8 }[key]
  let value = center
  sparkSeries[key] = Array.from({ length: SPARK_LENGTH }, () => {
    value = clamp(value + (Math.random() - 0.5) * spread * 2, ...SPARK_RANGE[key])
    return value
  })
}

const drawSpark = key => {
  const line = $(`[data-spark="${key}"]`)
  if (!line) return
  const values = sparkSeries[key]
  const [min, max] = SPARK_RANGE[key]
  const width = 120
  const height = 34
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - 2 - ((clamp(value, min, max) - min) / (max - min)) * (height - 4)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  line.setAttribute('points', points)
}

const seedAllSeries = metrics => {
  for (const key of Object.keys(sparkSeries)) {
    seedSeries(key, metrics[key])
    drawSpark(key)
  }
}

const renderMetrics = () => {
  const metrics = state.metrics
  const profile = PROFILES[state.profile]
  const ram = Math.round(metrics.ram)
  const zram = Math.round(metrics.zram)
  const freePct = 100 - ram
  const freeGb = (freePct / 100) * 8
  const audioPct = profile.audioPct
  const appsPct = Math.max(4, ram - 17 - audioPct)
  const sysPct = 17
  const zramUsed = (state.zramSize * zram) / 100

  const cpuValue = $('[data-stat="cpu"]')
  if (cpuValue) cpuValue.textContent = metrics.cpu.toFixed(2)
  const ramValue = $('[data-stat="ram"]')
  if (ramValue) ramValue.textContent = String(ram)
  const zramValue = $('[data-stat="zram"]')
  if (zramValue) zramValue.textContent = String(zram)
  const tempValue = $('[data-stat="temp"]')
  if (tempValue) tempValue.textContent = metrics.temp.toFixed(1)

  const ramFoot = $('#ram-foot')
  if (ramFoot) ramFoot.textContent = `${freeGb.toFixed(1)} GB libres`
  const zramFoot = $('#zram-foot')
  if (zramFoot) zramFoot.textContent = `${zramUsed.toFixed(1)} / ${state.zramSize.toFixed(1)} GB`

  const memFree = $('#mem-free')
  if (memFree) memFree.textContent = `${freeGb.toFixed(1)} GB`

  const widths = {
    sys: sysPct,
    audio: audioPct,
    apps: appsPct,
    free: freePct
  }
  for (const [name, value] of Object.entries(widths)) {
    const segment = $(`#seg-${name}`)
    if (segment) segment.style.width = `${clamp(value, 0, 100)}%`
  }

  const legend = {
    sys: (sysPct / 100) * 8,
    audio: (audioPct / 100) * 8,
    apps: (appsPct / 100) * 8,
    free: freeGb
  }
  for (const [name, value] of Object.entries(legend)) {
    const element = $(`#legend-${name}`)
    if (element) element.textContent = value.toFixed(1)
  }

  const zramLabel = $('#zram-value')
  if (zramLabel) zramLabel.textContent = `${zramUsed.toFixed(1)} / ${state.zramSize.toFixed(1)} GB`
  const zramBar = $('#zram-bar')
  if (zramBar) zramBar.style.width = `${clamp(zram, 0, 100)}%`
  const swappiness = $('#swappiness')
  if (swappiness) swappiness.textContent = String(state.swappiness)
  const reserved = $('#reserved')
  if (reserved) reserved.textContent = profile.reserved

  const freqs = {
    prime: `${profile.freqs.prime.toFixed(2)} GHz`,
    big: `${profile.freqs.big.toFixed(2)} GHz`,
    little: `${profile.freqs.little.toFixed(2)} GHz`
  }
  for (const [name, value] of Object.entries(freqs)) {
    const element = $(`#freq-${name}`)
    if (element) element.textContent = value
    const bar = $(`#bar-${name}`)
    if (bar) bar.style.width = `${profile.bars[name]}%`
  }
}

const addLog = (message, kind = 'info') => {
  const log = $('#log')
  if (!log) return
  const item = document.createElement('li')
  const time = document.createElement('time')
  time.textContent = timeNow()
  const tag = document.createElement('span')
  tag.className = `log-${kind}`
  tag.textContent = kind === 'accent' ? 'perfil' : kind === 'warm' ? 'aviso' : kind
  item.append(time, tag, document.createTextNode(` ${message}`))
  log.prepend(item)
  while (log.children.length > 7) log.lastElementChild.remove()
}

let toastTimer
const showToast = message => {
  const toast = $('#toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.add('is-visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400)
}

const applyProfile = (key, { announce = true } = {}) => {
  const profile = PROFILES[key]
  if (!profile) return
  state.profile = key
  state.swappiness = profile.swappiness
  state.zramSize = profile.zramSize
  state.metrics = {
    cpu: profile.cpu,
    ram: profile.ram,
    zram: profile.zram,
    temp: profile.temp
  }

  $$('[data-profile]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.profile === key)
  })

  const title = $('#panel-title')
  if (title) title.textContent = profile.label
  const desc = $('#profile-desc')
  if (desc) desc.textContent = profile.desc
  const note = $('#profile-note')
  if (note) note.textContent = profile.note
  const scoreValue = $('#score-value')
  if (scoreValue) scoreValue.textContent = String(profile.score)
  const scoreRing = $('#score-ring')
  if (scoreRing) scoreRing.style.setProperty('--score', profile.score)
  const scoreMeta = $('#score-meta-text')
  if (scoreMeta) scoreMeta.textContent = profile.scoreMeta

  const zramSize = $('#zram-size')
  if (zramSize) zramSize.value = String(profile.zramSize)
  const zramOut = $('#zram-size-out')
  if (zramOut) zramOut.textContent = `${profile.zramSize.toFixed(1)} GB`
  const swappinessRange = $('#swappiness-range')
  if (swappinessRange) swappinessRange.value = String(profile.swappiness)
  const swappinessOut = $('#swappiness-out')
  if (swappinessOut) swappinessOut.textContent = String(profile.swappiness)

  seedAllSeries(state.metrics)
  renderMetrics()

  if (announce) {
    addLog(`perfil ${profile.label.toLowerCase()} aplicado`, 'accent')
    showToast(`Perfil ${profile.label} aplicado · ${profile.score}/100`)
  }
}

const showView = name => {
  $$('.view').forEach(view => view.classList.toggle('is-active', view.dataset.view === name))
  $$('.rail-nav .nav-item').forEach(item => {
    const active = item.dataset.view === name
    item.classList.toggle('is-active', active)
    if (active) item.setAttribute('aria-current', 'page')
    else item.removeAttribute('aria-current')
  })
  $$('.tabbar button').forEach(item => item.classList.toggle('is-active', item.dataset.view === name))
  window.scrollTo(0, 0)
}

const tick = () => {
  const profile = PROFILES[state.profile]
  state.metrics = {
    cpu: clamp(profile.cpu + (Math.random() - 0.5) * 0.2, 0.8, 2.6),
    ram: clamp(profile.ram + (Math.random() - 0.5) * 2.4, 32, 94),
    zram: clamp(profile.zram + (Math.random() - 0.5) * 5, 4, 96),
    temp: clamp(profile.temp + (Math.random() - 0.5) * 1.2, 31, 56)
  }
  for (const key of Object.keys(sparkSeries)) {
    sparkSeries[key].push(state.metrics[key])
    sparkSeries[key].shift()
    drawSpark(key)
  }
  renderMetrics()
}

const initProcessButtons = () => {
  $$('#process-list [data-proc]').forEach((button, index) => {
    if (index < 3) {
      button.classList.add('is-limited')
      button.textContent = 'Limitado'
      button.setAttribute('aria-pressed', 'true')
    }
  })
  $$('#process-table [data-proc]').forEach((button, index) => {
    if (index < 3) {
      button.classList.add('is-limited')
      button.textContent = 'Limitado'
      button.setAttribute('aria-pressed', 'true')
    }
  })
}

const updateLimitedCount = () => {
  const count = $$('#process-list [data-proc].is-limited').length
  const tag = $('#proc-count')
  if (tag) tag.textContent = `${count} limitado${count === 1 ? '' : 's'}`
}

const init = () => {
  applyProfile('stable', { announce: false })
  initProcessButtons()
  updateLimitedCount()
  seedAllSeries(state.metrics)

  $$('[data-profile]').forEach(button => {
    button.addEventListener('click', () => applyProfile(button.dataset.profile))
  })

  const applyButton = $('#apply-profile')
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      const profile = PROFILES[state.profile]
      applyButton.classList.add('is-applying')
      setTimeout(() => applyButton.classList.remove('is-applying'), 720)
      const note = $('#profile-note')
      if (note) note.textContent = `Aplicado ${timeNow()} · watchdog armado`
      addLog(`perfil ${profile.label.toLowerCase()} confirmado`, 'accent')
      showToast(`Perfil ${profile.label} activo · ${profile.score}/100`)
    })
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('.nav-item[data-view], .tabbar button[data-view], .brand[data-view]')
    if (target) {
      event.preventDefault()
      showView(target.dataset.view)
      return
    }

    const settings = event.target.closest('#open-settings')
    if (settings) {
      showView('settings')
      return
    }

    const toggle = event.target.closest('[data-toggle]')
    if (toggle) {
      const on = !toggle.classList.contains('is-on')
      toggle.classList.toggle('is-on', on)
      toggle.setAttribute('aria-pressed', String(on))
      const label = toggle.closest('li')?.querySelector('b')?.textContent || 'ajuste'
      addLog(`${label.toLowerCase()} ${on ? 'activado' : 'desactivado'}`, on ? 'ok' : 'warm')
      showToast(`${label} ${on ? 'activado' : 'desactivado'}`)
      return
    }

    const processButton = event.target.closest('[data-proc]')
    if (processButton) {
      const limited = !processButton.classList.contains('is-limited')
      processButton.classList.toggle('is-limited', limited)
      processButton.textContent = limited ? 'Limitado' : 'Limitar'
      processButton.setAttribute('aria-pressed', String(limited))
      const pkg = processButton.closest('.process, .tr')?.querySelector('b')?.textContent || 'proceso'
      updateLimitedCount()
      addLog(`${pkg} ${limited ? 'limitado' : 'restaurado'}`, limited ? 'warm' : 'ok')
      showToast(`${pkg} ${limited ? 'limitado' : 'restaurado'}`)
      return
    }

    const integration = event.target.closest('[data-integration]')
    if (integration) {
      if (integration.dataset.integration === 'ghostlock') {
        addLog('ghostlock: verificación manual requerida', 'warm')
        showToast('GhostLock es externo: verifica el kernel antes de usarlo')
        return
      }
      const on = !integration.classList.contains('is-on')
      integration.classList.toggle('is-on', on)
      const stateLabel = integration.querySelector('.state')
      const names = {
        shizuku: 'activo',
        kernelsu: 'activo',
        ghostlock: 'externo',
        termux: 'conectado',
        anyclaw: 'conectado',
        acusticall: 'anclada',
        latency: 'anclada',
        api: 'activo'
      }
      if (stateLabel) {
        stateLabel.textContent = on ? names[integration.dataset.integration] || 'activo' : 'vincular'
        stateLabel.className = on ? 'state state--ok' : 'state'
      }
      const name = integration.querySelector('b')?.textContent || integration.dataset.integration
      addLog(`${name} ${on ? 'vinculado' : 'desvinculado'}`, on ? 'ok' : 'warm')
      showToast(
        integration.dataset.integration === 'ghostlock'
          ? 'GhostLock es externo: verifica el kernel antes de usarlo'
          : `${name} ${on ? 'vinculado' : 'desvinculado'}`
      )
      return
    }
  })

  const search = $('#process-search')
  if (search) {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase()
      let visible = 0
      $$('#process-table .tr[data-name]').forEach(row => {
        const match = row.dataset.name.toLowerCase().includes(query)
        row.classList.toggle('is-hidden', !match)
        if (match) visible += 1
      })
      const total = $('#process-total')
      if (total) total.textContent = `${visible} proceso${visible === 1 ? '' : 's'}`
    })
  }

  const cpuMax = $('#cpu-max')
  const cpuMin = $('#cpu-min')
  const updateCpuOutputs = () => {
    const maxOut = $('#cpu-max-out')
    const minOut = $('#cpu-min-out')
    if (maxOut && cpuMax) maxOut.textContent = `${(Number(cpuMax.value) / 1000).toFixed(2)} GHz`
    if (minOut && cpuMin) minOut.textContent = `${(Number(cpuMin.value) / 1000).toFixed(2)} GHz`
  }
  cpuMax?.addEventListener('input', updateCpuOutputs)
  cpuMin?.addEventListener('input', updateCpuOutputs)
  updateCpuOutputs()

  const zramSize = $('#zram-size')
  zramSize?.addEventListener('input', () => {
    state.zramSize = Number(zramSize.value)
    const out = $('#zram-size-out')
    if (out) out.textContent = `${state.zramSize.toFixed(1)} GB`
    renderMetrics()
  })

  const swappinessRange = $('#swappiness-range')
  swappinessRange?.addEventListener('input', () => {
    state.swappiness = Number(swappinessRange.value)
    const out = $('#swappiness-out')
    if (out) out.textContent = String(state.swappiness)
    renderMetrics()
  })

  $('#apply-cpu')?.addEventListener('click', () => {
    addLog('governor schedutil · límites escritos', 'ok')
    showToast('Frecuencias aplicadas · watchdog armado')
  })

  $('#apply-memory')?.addEventListener('click', () => {
    addLog(`zram ${state.zramSize.toFixed(1)} GB · swappiness ${state.swappiness}`, 'ok')
    showToast('Política de memoria aplicada')
  })

  $('#cpu-safe')?.addEventListener('click', () => {
    if (cpuMax) cpuMax.value = '2400'
    if (cpuMin) cpuMin.value = '900'
    updateCpuOutputs()
    showToast('Límites térmicos restaurados')
    addLog('perfil térmico seguro restaurado', 'ok')
  })

  $('#restore-defaults')?.addEventListener('click', () => {
    applyProfile('stable')
    showToast('Valores restaurados al perfil Estable')
  })

  $('#reset-all')?.addEventListener('click', () => {
    $$('[data-toggle]').forEach(toggle => {
      const label = toggle.closest('li')?.querySelector('b')?.textContent?.toLowerCase() || ''
      const on = !label.includes('estricto')
      toggle.classList.toggle('is-on', on)
      toggle.setAttribute('aria-pressed', String(on))
    })
    applyProfile('stable')
    showToast('Configuración completa restaurada')
    addLog('restauración total completada', 'ok')
  })

  const log = $('#log')
  if (log && !log.children.length) {
    addLog('motor iniciado en modo estable', 'ok')
  }

  setInterval(tick, 1700)
  setTimeout(() => {
    document.documentElement.dataset.ready = 'true'
  }, 120)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
