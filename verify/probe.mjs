/**
 * Targeted geometry probe for the calendar month grid and the board columns.
 * Reports each element's box against its container so clipping is visible.
 *
 * Usage: node verify/probe.mjs
 */
const PORT = Number(process.argv[2] ?? 9222)
const BASE = 'http://127.0.0.1:4319/verify'

async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const info = await res.json()
      if (info.webSocketDebuggerUrl) return info.webSocketDebuggerUrl
    } catch {
      /* starting */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('CDP unavailable')
}

const ws = new WebSocket(await wsUrl())
await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = () => rej(new Error('socket failed'))
})
let id = 1
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
  }
}
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const n = id++
    pending.set(n, { resolve, reject })
    ws.send(JSON.stringify({ id: n, method, params, sessionId }))
  })

const CASES = [
  { page: 'calendar-preview.html', name: 'calendar', width: 1280, height: 900 },
  { page: 'calendar-preview.html', name: 'calendar', width: 768, height: 1024 },
  { page: 'board-preview.html', name: 'board', width: 390, height: 844 },
  { page: 'board-preview.html', name: 'board', width: 1280, height: 900 },
]

for (const c of CASES) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send(
    'Emulation.setDeviceMetricsOverride',
    { width: c.width, height: c.height, deviceScaleFactor: 1, mobile: c.width < 900 },
    sessionId,
  )
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  }, sessionId)
  await send('Page.navigate', { url: `${BASE}/${c.page}` }, sessionId)
  await new Promise((r) => setTimeout(r, 700))

  const { result } = await send(
    'Runtime.evaluate',
    {
      returnByValue: true,
      expression: `(() => {
        const box = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
            display: cs.display,
            cols: cs.gridTemplateColumns,
            overflowX: cs.overflowX,
          };
        };
        return {
          viewport: document.documentElement.clientWidth,
          docScroll: document.documentElement.scrollWidth,
          main: box('.shell__main'),
          gridWrap: box('.cal__grid-wrap'),
          grid: box('.cal__grid'),
          cell: box('.cal__cell'),
          board: box('.board'),
          boardCol: box('.board__col'),
        };
      })()`,
    },
    sessionId,
  )
  console.log(`\n=== ${c.name} @ ${c.width} ===`)
  console.log(JSON.stringify(result.value, null, 2))
  await send('Target.closeTarget', { targetId })
}
ws.close()
