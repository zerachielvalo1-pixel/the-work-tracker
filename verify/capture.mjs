/**
 * Render the preview pages at exact mobile and desktop viewports using the
 * Chrome DevTools Protocol, and report whether the layout actually overflows.
 *
 * Usage: node verify/capture.mjs [port]
 */
import { writeFile } from 'node:fs/promises'

const PORT = Number(process.argv[2] ?? 9222)
const BASE = 'http://127.0.0.1:4319'

const SHOTS = [
  { name: 'mobile-390', url: `${BASE}/verify/preview.html`, width: 390, height: 844, mobile: true },
  { name: 'mobile-360', url: `${BASE}/verify/preview.html`, width: 360, height: 800, mobile: true },
  { name: 'desktop-1280', url: `${BASE}/verify/preview.html`, width: 1280, height: 900, mobile: false },
  { name: 'signin-390', url: `${BASE}/verify/signin-preview.html`, width: 390, height: 844, mobile: true },
]

async function wsUrl() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const info = await res.json()
      if (info.webSocketDebuggerUrl) return info.webSocketDebuggerUrl
    } catch {
      // Chrome is still starting up.
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Chrome DevTools endpoint never came up on port ${PORT}`)
}

const socket = new WebSocket(await wsUrl())
await new Promise((resolve, reject) => {
  socket.onopen = resolve
  socket.onerror = () => reject(new Error('CDP socket failed'))
})

let nextId = 1
const pending = new Map()
const sessions = new Map()

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
    return
  }
  if (msg.method === 'Target.attachedToTarget') {
    const entry = sessions.get(msg.params.sessionId)
    if (entry) entry.ready(msg.params.sessionId)
  }
}

function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params, sessionId }))
  })
}

async function newTargetSession(url) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  let sessionId
  const ready = new Promise((resolve) => {
    sessions.set(targetId, { ready: resolve })
  })
  const attach = await send('Target.attachToTarget', { targetId, flatten: true })
  sessionId = attach.sessionId
  // Wait until the attach event lands so events route correctly.
  await Promise.race([ready, new Promise((r) => setTimeout(r, 1000))])
  sessions.delete(targetId)
  return { sessionId, targetId }
}

const report = []

for (const shot of SHOTS) {
  const { sessionId, targetId } = await newTargetSession(shot.url)

  await send('Page.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', {
    width: shot.width,
    height: shot.height,
    deviceScaleFactor: 1,
    mobile: shot.mobile,
  }, sessionId)

  await send('Page.navigate', { url: shot.url }, sessionId)
  // Give the stylesheet a moment, then measure.
  await new Promise((r) => setTimeout(r, 900))

  const { result } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const de = document.documentElement;
      const overflow = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > de.clientWidth + 0.5 || r.left < -0.5) {
          overflow.push({
            tag: el.tagName.toLowerCase(),
            cls: el.className && typeof el.className === 'string' ? el.className : '',
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      }
      const cs = getComputedStyle(document.querySelector('.shell__main'));
      const table = document.querySelector('.tasktable');
      const navBtn = document.querySelector('.shell__nav button');
      const input = document.querySelector('.input');
      return {
        innerWidth: window.innerWidth,
        clientWidth: de.clientWidth,
        scrollWidth: de.scrollWidth,
        horizontalOverflow: de.scrollWidth > de.clientWidth ? de.scrollWidth - de.clientWidth : 0,
        mainPadding: cs.padding,
        tableDisplay: table ? getComputedStyle(table).display : null,
        navButtonHeight: navBtn ? Math.round(navBtn.getBoundingClientRect().height) : null,
        inputFontSize: input ? getComputedStyle(input).fontSize : null,
        overflowing: overflow.slice(0, 8),
      };
    })()`,
  }, sessionId)

  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId)
  await writeFile(new URL(`./${shot.name}.png`, import.meta.url), Buffer.from(data, 'base64'))

  report.push({ shot: shot.name, viewport: `${shot.width}x${shot.height}`, ...result.value })

  await send('Target.closeTarget', { targetId })
}

console.log(JSON.stringify(report, null, 2))
socket.close()
