export const connectionModes = {
  network: ['rtsp', 'tcp', 'http', 'vendor'],
  usb: ['hid_keyboard', 'serial', 'uvc', 'vendor'],
  serial: ['serial', 'vendor'],
  none: ['none']
}
export const transportLabels = {
  network: '网络',
  usb: 'USB',
  serial: '串口',
  none: '无需连接'
}
export function newConnection(transport = 'none') {
  return {
    transport,
    protocol: connectionModes[transport][0],
    host: '',
    port: transport === 'network' ? 554 : null,
    path: '',
    rtsp_url: '',
    host_key: '',
    device_key: '',
    enabled: true
  }
}
export function readConnection(value) {
  const result = {
    ...newConnection(),
    ...value,
    enabled:
      !value || value.enabled == null
        ? true
        : value.enabled === true || value.enabled === 1
  }
  if (result.transport === 'network' && result.protocol === 'rtsp' && (!value || value.rtsp_url == null) && result.host) {
    const host = result.host.includes(':') ? `[${result.host}]` : result.host
    result.rtsp_url = `rtsp://${host}:${result.port || 554}${result.path || ''}`
  }
  return result
}
export function connectionPayload(value) {
  const c = readConnection(value)
  return {
    transport: c.transport,
    protocol: c.protocol,
    host: c.transport === 'network' ? (c.host || '').trim() : null,
    port: c.transport === 'network' ? c.port : null,
    path: c.transport === 'network' ? (c.path || '').trim() : null,
    host_key: ['usb', 'serial'].includes(c.transport)
      ? (c.host_key || '').trim()
      : null,
    device_key: ['usb', 'serial'].includes(c.transport)
      ? (c.device_key || '').trim()
      : null,
    enabled: c.enabled,
    rtsp_url: c.transport === 'network' && c.protocol === 'rtsp' ? (c.rtsp_url || '').trim() : null
  }
}
export function connectionError(value) {
  const c = connectionPayload(value)
  if (
    !connectionModes[c.transport] ||
    !connectionModes[c.transport].includes(c.protocol)
  ) { return '请选择通信方式和对应协议' }
  if (c.transport === 'network' && c.protocol === 'rtsp') {
    try {
      const url = new URL(c.rtsp_url)
      if (url.protocol !== 'rtsp:' || !url.hostname || url.hash || /\s/.test(c.rtsp_url) || (url.port && (Number(url.port) < 1 || Number(url.port) > 65535)) || url.pathname.length + url.search.length > 1000) throw new Error()
    } catch (e) { return '请填写完整RTSP地址，特殊字符需进行URL编码，不包含#片段' }
    return ''
  }
  if (
    c.transport === 'network' &&
    (!c.host || !Number.isInteger(c.port) || c.port < 1 || c.port > 65535)
  ) { return '请填写设备IP / 主机和有效端口' }
  if (['usb', 'serial'].includes(c.transport) && (!c.host_key || !c.device_key)) { return '请填写接入电脑和设备标识' }
  return ''
}

