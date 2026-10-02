/**
 * Render every preview page at exact phone/tablet/desktop viewports via the
 * Chrome DevTools Protocol and report the layout facts that matter:
 * horizontal overflow, undersized touch targets, and input font size.
 *
 * Prerequisites: verify/serve.mjs on :4319 and headless Chrome on :9222.
 * Usage: node verify/check-all.mjs
 */
import { writeFile } from 'node:fs/promises'

const PORT = Number(process.argv[2] ?? 9222)
const BASE = 'http://127.0.0.1:4319/verify'

const VIEWPORTS = [
  { tag: '360', width: 360, height: 800, mobile: true },
  { tag: '390', width: 390, height: 844, mobile: true },
  { tag: '768', width: 768, height: 1024, mobile: true },
  { tag: '1280', width: 1280, height: 900, mobile: false },
]

const PAGES = [
  { name: 'overview', file: 'preview.html' },
  { name: 'board', file: 'board-preview.html' },
  { name: 'calendar', file: 'calendar-preview.html' },
  { name: 'signin', file: 'signin-preview.html' },
]

async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const info = await res.json()
      if (info.webSocketDebuggerUrl) return info.webSocketDebuggerUrl
    } catch {
      /* still starting */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('CDP endpoint unavailable — is headless Chrome running on 9222?')
}

const socket = new WebSocket(await wsUrl())
await new Promise((res, rej) => {
  socket.onopen = res
  socket.onerror = () => rej(new Error('CDP socket failed'))
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

async function open(url) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  return { sessionId, targetId }
}

const MEASURE = `(() => {
  const de = document.documentElement;
  const overflow = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    // The off-canvas drawer and the task sheet sit deliberately off-screen.
    if (el.closest('.shell__sidebar') || el.closest('.sheet')) continue;
    if (r.right > de.clientWidth + 1 || r.left < -1) {
      const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '';
      overflow.push(el.tagName.toLowerCase() + cls + '[' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
    }
  }
  const small = [];
  for (const el of document.querySelectorAll('button, input, select, .chip')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.height < 36) small.push((el.textContent || el.tagName).trim().slice(0, 22) + ' h=' + Math.round(r.height));
  }
  const input = document.querySelector('.input');
  return {
    viewport: de.clientWidth,
    scrollWidth: de.scrollWidth,
    overflowPx: de.scrollWidth > de.clientWidth ? de.scrollWidth - de.clientWidth : 0,
    overflowing: [...new Set(overflow)].slice(0, 6),
    smallTargets: [...new Set(small)].slice(0, 6),
    inputFontSize: input ? getComputedStyle(input).fontSize : null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
})()`

const rows = []

for (const page of PAGES) {
  for (const vp of VIEWPORTS) {
    const { sessionId, targetId } = await open(`${BASE}/${page.file}`)
    await send(
      'Emulation.setDeviceMetricsOverride',
      { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile },
      sessionId,
    )
    // Pin the colour scheme so results do not depend on this machine's OS
    // preference, and so both themes get exercised.
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: process.argv[3] === 'dark' ? 'dark' : 'light' }],
    }, sessionId)
    await send('Page.navigate', { url: `${BASE}/${page.file}` }, sessionId)
    await new Promise((r) => setTimeout(r, 700))

    const { result } = await send(
      'Runtime.evaluate',
      { returnByValue: true, expression: MEASURE },
      sessionId,
    )

    // The overdue colour must beat the muted colour that sibling rules set on
    // the same element. Checked explicitly because it is easy to regress.
    const { result: tone } = await send(
      'Runtime.evaluate',
      {
        returnByValue: true,
        expression: `(() => {
          const el = document.querySelector('.is-overdue');
          if (!el) return null;
          const danger = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim();
          return { rendered: getComputedStyle(el).color, expectedDanger: danger, text: el.textContent.trim() };
        })()`,
      },
      sessionId,
    )
    result.value.overdue = tone.value

    const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
    const themeTag = process.argv[3] === 'dark' ? 'dark' : 'light'
    await writeFile(
      new URL(`./shot-${page.name}-${vp.tag}-${themeTag}.png`, import.meta.url),
      Buffer.from(data, 'base64'),
    )

    rows.push({ page: page.name, vp: vp.tag, ...result.value, overdue: tone.value })
    await send('Target.closeTarget', { targetId })
  }
}

const bad = rows.filter((r) => r.overflowPx > 0 || (r.smallTargets && r.smallTargets.length))
console.log(`checked ${rows.length} page/viewport combinations`)
console.log(`combinations with a problem: ${bad.length}`)
for (const r of rows) {
  const flag = r.overflowPx > 0 ? ` OVERFLOW ${r.overflowPx}px ${JSON.stringify(r.overflowing)}` : ''
  const t = r.smallTargets?.length ? ` SMALL ${JSON.stringify(r.smallTargets)}` : ''
  const o = r.overdue ? ` overdue=${r.overdue.rendered} (want ${r.overdue.expectedDanger})` : ''
  console.log(`${r.page.padEnd(9)} @${String(r.vp).padStart(4)}  input=${r.inputFontSize ?? '-'}${flag}${t}${o}`)
}
socket.close()
