/**
 * Compare the computed geometry of the shell's main column contents at a
 * desktop viewport, to confirm the stats/card/table share one content edge.
 */
const PORT = Number(process.argv[2] ?? 9222)
const URL_TO_MEASURE = 'http://127.0.0.1:4319/verify/preview.html'

async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const info = await res.json()
      if (info.webSocketDebuggerUrl) return info.webSocketDebuggerUrl
    } catch {
      /* starting up */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('CDP endpoint unavailable')
}

const socket = new WebSocket(await wsUrl())
await new Promise((res, rej) => {
  socket.onopen = res
  socket.onerror = () => rej(new Error('socket failed'))
})

let nextId = 1
const pending = new Map()
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
}
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params, sessionId }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', {
  width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
}, sessionId)
await send('Page.navigate', { url: URL_TO_MEASURE }, sessionId)
await new Promise((r) => setTimeout(r, 900))

const { result } = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        left: +r.left.toFixed(2),
        right: +r.right.toFixed(2),
        width: +r.width.toFixed(2),
        padLeft: cs.paddingLeft,
        padRight: cs.paddingRight,
        marginLeft: cs.marginLeft,
        marginRight: cs.marginRight,
      };
    };
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      main: box('.shell__main'),
      pageHead: box('.page__head'),
      stats: box('.stats'),
      firstStat: box('.stat'),
      card: box('.card'),
      toolbar: box('.toolbar'),
      taskCard: box('.task-card'),
      taskTable: box('.tasktable'),
      footNote: box('.foot-note'),
    };
  })()`,
}, sessionId)

console.log(JSON.stringify(result.value, null, 2))
socket.close()
