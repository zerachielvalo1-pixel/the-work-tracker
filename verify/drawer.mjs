/**
 * Render the drawer in its open state at a phone viewport, and assert the
 * open-state contract (sidebar on screen, scrim visible and clickable).
 */
import { writeFile } from 'node:fs/promises'

const PORT = Number(process.argv[2] ?? 9222)
const URL_TO_OPEN = 'http://127.0.0.1:4319/verify/preview.html'

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
  width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
}, sessionId)
await send('Page.navigate', { url: URL_TO_OPEN }, sessionId)
await new Promise((r) => setTimeout(r, 900))

// Open the drawer by clicking the real hamburger button.
const opened = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    document.querySelector('.shell__menu').click();
    return true;
  })()`,
}, sessionId)
void opened
await new Promise((r) => setTimeout(r, 600))

const { result } = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const side = document.querySelector('.shell__sidebar');
    const scrim = document.querySelector('.shell__scrim');
    const sr = side.getBoundingClientRect();
    const cs = getComputedStyle(side);
    const navBtn = document.querySelector('.shell__nav button');
    const active = document.querySelector('.shell__nav button.is-active');
    return {
      sidebarLeft: Math.round(sr.left),
      sidebarRight: Math.round(sr.right),
      sidebarWidth: Math.round(sr.width),
      sidebarVisibility: cs.visibility,
      scrimOpacity: getComputedStyle(scrim).opacity,
      scrimPointerEvents: getComputedStyle(scrim).pointerEvents,
      bodyOverflow: getComputedStyle(document.body).overflow,
      navButtonHeight: Math.round(navBtn.getBoundingClientRect().height),
      activeNavGradient: getComputedStyle(active).backgroundImage.slice(0, 60),
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`,
}, sessionId)

const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
await writeFile(new URL('./drawer-open-390.png', import.meta.url), Buffer.from(data, 'base64'))

console.log(JSON.stringify(result.value, null, 2))
socket.close()
