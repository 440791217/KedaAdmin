let stylesheet
let generation = 0

export async function applySystemTheme(color) {
  const request = ++generation
  if (!/^#[a-f0-9]{6}$/i.test(color)) return
  if (!stylesheet) {
    stylesheet = fetch(process.env.BASE_URL + 'vendor/element-theme.css')
      .then(response => {
        if (!response.ok) throw new Error('主题样式加载失败')
        return response.text()
      })
      .catch(error => {
        stylesheet = null
        throw error
      })
  }
  const css = await stylesheet
  if (request !== generation) return
  const cluster = hex => {
    const channels = hex.match(/\w\w/g).map(value => parseInt(value, 16))
    const values = [hex.toLowerCase(), channels.join(',')]
    for (let index = 1; index <= 9; index++) {
      values.push(channels.map(channel => Math.round(channel + (255 - channel) * index / 10).toString(16).padStart(2, '0')).join(''))
    }
    values.push(channels.map(channel => Math.round(channel * 0.9).toString(16).padStart(2, '0')).join(''))
    return values
  }
  // The application already bundles icon fonts; relative font URLs in injected CSS would break them.
  let themed = css.replace(/@font-face\s*\{[^}]*\}/g, '')
  const oldColors = cluster('409eff')
  const newColors = cluster(color.slice(1))
  const replacements = Object.fromEntries(oldColors.map((oldColor, index) => [oldColor, newColors[index]]))
  themed = themed.replace(new RegExp(oldColors.join('|'), 'gi'), match => replacements[match.toLowerCase()])
  let style = document.getElementById('system-theme-style')
  if (!style) {
    style = document.createElement('style')
    style.id = 'system-theme-style'
    document.head.appendChild(style)
  }
  style.textContent = themed
}
