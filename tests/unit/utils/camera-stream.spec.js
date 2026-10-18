import { cameraFrames } from '@/shared/resource/js/camera_stream'
import { newConnection, readConnection, connectionPayload, connectionError } from '@/shared/resource/js/connection_helpers'

describe('RTSP addresses and preview framing', () => {
  it('preserves stream query parameters and reconstructs existing split configurations', () => {
    const old = readConnection({ transport: 'network', protocol: 'rtsp', host: '192.0.2.10', port: 554, path: '/live?channel=1&subtype=0', enabled: 1 })
    expect(old.rtsp_url).toBe('rtsp://192.0.2.10:554/live?channel=1&subtype=0')
    expect(connectionPayload(old).rtsp_url).toBe(old.rtsp_url)
    expect(connectionError(old)).toBe('')
    const ipv6 = readConnection({ transport: 'network', protocol: 'rtsp', host: '2001:db8::1', port: 554, path: '/live' })
    expect(ipv6.rtsp_url).toContain('[2001:db8::1]')
    expect(connectionError({ ...old, rtsp_url: '' })).toContain('RTSP')
  })
  it('accepts authenticated and anonymous RTSP addresses and rejects wrong protocols', () => {
    const c = { ...newConnection('network'), rtsp_url: 'rtsp://camera.local/live?channel=1' }
    expect(connectionError(c)).toBe('')
    expect(connectionError({ ...c, rtsp_url: 'rtsp://operator:p%40ss@camera.local/live' })).toBe('')
    for (const rtsp_url of ['', '192.0.2.10', 'http://camera/live', 'rtsp://camera/live#fragment', 'rtsp://camera:70000/live']) {
      expect(connectionError({ ...c, rtsp_url })).toContain('RTSP')
    }
    expect(connectionError({ ...newConnection('usb'), host_key: 'PC', device_key: 'scanner' })).toBe('')
  })
  it('reads headers and binary frames split at every possible byte boundary', () => {
    const header = '--camera\r\nContent-Type: image/jpeg\r\nContent-Length: 6\r\n\r\n'
    const jpeg = [255, 216, 1, 2, 255, 217]
    const encoded = [...header].map(c => c.charCodeAt(0)).concat(jpeg, [13, 10], [...header].map(c => c.charCodeAt(0)), jpeg, [13, 10])
    for (let split = 1; split < encoded.length; split++) {
      const frames = []
      const accept = cameraFrames(blob => frames.push(blob))
      accept(new Uint8Array(encoded.slice(0, split)))
      accept(new Uint8Array(encoded.slice(split)))
      expect(frames.map(frame => frame.size)).toEqual([6, 6])
    }
  })
  it('rejects oversized frames before allocating their declared body', () => {
    const accept = cameraFrames(jest.fn())
    const header = '--camera\r\nContent-Length: 999999999\r\n\r\n'
    expect(() => accept(new Uint8Array([...header].map(c => c.charCodeAt(0))))).toThrow('大小')
  })
})

