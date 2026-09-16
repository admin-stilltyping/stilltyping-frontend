/* Nivaso website chat. No dependencies, cookies, or admin credentials. */
(() => {
  const script = document.currentScript
  const slug = script?.getAttribute('data-business')
  if (!script || !slug || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) return
  const origin = new URL(script.src).origin
  const mount = () => {
    if (document.getElementById('nivaso-chat-widget')) return
    const host = document.createElement('div')
    host.id = 'nivaso-chat-widget'
    // Reset inherited host-page styling; internal styles live in a shadow root.
    host.style.cssText = 'all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483000;'
    const root = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = `
      *{box-sizing:border-box} button{font:600 14px system-ui,sans-serif;cursor:pointer}
      button:focus-visible{outline:3px solid #7598ff;outline-offset:4px}
      .launcher{border:0;border-radius:50px;background:#2858dc;color:white;display:flex;align-items:center;gap:10px;padding:16px 20px;box-shadow:0 6px 24px #18253833}
      .panel{position:absolute;bottom:74px;right:0;width:min(400px,calc(100vw - 40px));height:min(650px,calc(100dvh - 120px));min-height:200px;border:1px solid #dce4ef;border-radius:18px;background:white;box-shadow:0 12px 60px #1825382b;overflow:hidden;display:flex;flex-direction:column}
      .panel[hidden]{display:none}.bar{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#edf2f8;color:#455a76;font:12px system-ui,sans-serif}
      .close{border:0;background:transparent;color:#182538;font-size:22px;line-height:1;padding:2px 7px}
      iframe{display:block;width:100%;flex:1;min-height:0;border:0;background:white}
      @media(max-width:480px){.panel{width:calc(100vw - 24px);right:-8px;bottom:68px;height:calc(100dvh - 108px)}.launcher{padding:14px 18px}}
    `
    const panel = document.createElement('section')
    panel.className = 'panel'
    panel.id = 'nivaso-chat-panel'
    panel.hidden = true
    panel.setAttribute('role', 'region')
    panel.setAttribute('aria-label', 'Website chat')
    const bar = document.createElement('div')
    bar.className = 'bar'
    const label = document.createElement('span')
    label.textContent = 'Chat with us'
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'close'
    close.setAttribute('aria-label', 'Close chat')
    close.textContent = '\u00d7'
    bar.append(label, close)
    panel.append(bar)
    const launcher = document.createElement('button')
    launcher.type = 'button'
    launcher.className = 'launcher'
    launcher.setAttribute('aria-expanded', 'false')
    launcher.setAttribute('aria-controls', panel.id)
    launcher.textContent = 'Chat with us'
    let frame
    const toggle = (open) => {
      if (open && !frame) {
        frame = document.createElement('iframe')
        frame.src = `${origin}/c/${encodeURIComponent(slug)}?embed=1`
        frame.title = 'Customer chat'
        frame.referrerPolicy = 'no-referrer'
        panel.append(frame)
      }
      panel.hidden = !open
      launcher.setAttribute('aria-expanded', String(open))
      launcher.textContent = open ? 'Close chat' : 'Chat with us'
      if (open) close.focus()
      else launcher.focus()
    }
    launcher.addEventListener('click', () => toggle(panel.hidden))
    close.addEventListener('click', () => toggle(false))
    root.addEventListener('keydown', (event) => { if (event.key === 'Escape') toggle(false) })
    window.addEventListener('message', (event) => {
      if (event.origin === origin && event.source === frame?.contentWindow && event.data?.type === 'nivaso:close') toggle(false)
    })
    root.append(style, panel, launcher)
    document.body.append(host)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true })
  else mount()
})()
