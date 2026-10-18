const prefixes = ['PRJ', 'SUB', 'SOP', 'STA', 'TMD', 'TOL', 'TSK', 'LOC']
const pad = (value, width = 2) => String(value).padStart(width, '0')

// Called once per new form. Existing records and failed submissions keep their code.
export function createBusinessCode(prefix) {
  if (!prefixes.includes(prefix)) throw new Error('不支持的业务编号类型')
  const random = new Uint8Array(3)
  if (!window.crypto || !window.crypto.getRandomValues) throw new Error('浏览器不支持安全随机数，无法生成编号')
  window.crypto.getRandomValues(random)
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const time = [pad(date.getUTCFullYear(), 4), pad(date.getUTCMonth() + 1), pad(date.getUTCDate()), pad(date.getUTCHours()), pad(date.getUTCMinutes())].join('')
  const suffix = Array.from(random, value => pad(value.toString(16))).join('').toUpperCase()
  return `${prefix}-${time}-${suffix}`
}
