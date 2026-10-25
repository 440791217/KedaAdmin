import { applySystemTheme } from '@/utils/system-theme'

it('applies a saved color from local theme CSS without replacing application icon fonts', async() => {
  const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch')
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('@font-face{font-family:element-icons;src:url(fonts/missing.woff)}.el-button{color:#409EFF;background:#ecf5ff}')
  })
  try {
    await applySystemTheme('#53a8ff')
    const style = document.getElementById('system-theme-style')
    expect(style.textContent).toContain('#53a8ff')
    expect(style.textContent).not.toContain('@font-face')
    expect(style.textContent).not.toContain('missing.woff')
    style.remove()
  } finally {
    if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch)
    else delete global.fetch
  }
})
