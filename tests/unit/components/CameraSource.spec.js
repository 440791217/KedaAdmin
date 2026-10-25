import { shallowMount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import CameraSource from '@/views/sop/editor/components/CameraSource.vue'
import request from '@/utils/request'
import { createCaptureClient, loadCaptureReader } from '@/utils/capture-session'
jest.mock('@/utils/request', () => jest.fn())
jest.mock('@/utils/capture-session', () => ({ createCaptureClient: jest.fn(), loadCaptureReader: jest.fn() }))
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve() }
let wrapper, client, closeReader, readerConfig
const originalRTC = window.RTCPeerConnection
const localVue = createLocalVue(); localVue.use(ElementUI)
beforeEach(() => {
  jest.useFakeTimers()
  request.mockReset(); createCaptureClient.mockReset(); loadCaptureReader.mockReset()
  request.mockImplementation(c => Promise.resolve({ data: c.url.endsWith('/capture-config')
    ? { device_id: '2', config_version: 1, rtsp_url: 'rtsp://camera/live' }
    : { devices: [{ id: '2', type_code: 'camera', status: 0, model_status: 0 }, { id: '3', type_code: 'camera', status: 2, model_status: 0 }] }}))
  client = { token: 'capture-token', open: jest.fn().mockResolvedValue({ session_id: 'session-1', preview_url: '/sessions/session-1/whep' }), release: jest.fn().mockResolvedValue(), heartbeat: jest.fn().mockResolvedValue({ state: 'ready' }), snapshot: jest.fn().mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' })), previewURL: jest.fn().mockReturnValue('http://localhost:18090/sessions/session-1/whep') }
  createCaptureClient.mockReturnValue(client)
  closeReader = jest.fn()
  loadCaptureReader.mockResolvedValue(class { constructor(config) { readerConfig = config } close() { closeReader() } })
  window.RTCPeerConnection = jest.fn()
  URL.createObjectURL = jest.fn().mockReturnValue('blob:camera'); URL.revokeObjectURL = jest.fn()
  wrapper = shallowMount(CameraSource, { localVue, propsData: { visible: true, stationId: '1' }, mocks: { $message: { error: jest.fn(), success: jest.fn() }}})
})
afterEach(() => { wrapper.destroy(); jest.useRealTimers(); window.RTCPeerConnection = originalRTC })
describe('Go camera capture lifecycle', () => {
  it('keeps the current photo when replacement is cancelled and submits only after confirmation', async() => {
    wrapper.vm.$confirm = jest.fn().mockRejectedValue('cancel')
    await wrapper.vm.load(); await flush(); await wrapper.vm.capture()
    await wrapper.setProps({ replacing: true })
    await wrapper.vm.useSnapshot()
    expect(wrapper.emitted('capture')).toBeUndefined()
    expect(wrapper.vm.snapshot).toBeTruthy()
    wrapper.vm.$confirm.mockResolvedValue()
    await wrapper.vm.useSnapshot()
    expect(wrapper.emitted('capture')[0][0].cameraId).toBe('2')
  })
  it('uses the bound camera and never falls back when that camera is unavailable', async() => {
    await wrapper.setProps({ preferredCameraId: '3' })
    await wrapper.vm.load(); await flush()
    expect(wrapper.vm.cameraId).toBe('')
    expect(wrapper.vm.streamError).toContain('步骤绑定的摄像头不可用')
    expect(client.open).not.toHaveBeenCalled()
    await wrapper.setProps({ preferredCameraId: '2' })
    await wrapper.vm.load(); await flush()
    expect(wrapper.vm.cameraId).toBe('2')
    expect(client.open).toHaveBeenCalledTimes(1)
  })
  it('opens Go sessions using authorized Java configuration and releases on close', async() => {
    await wrapper.vm.load(); await flush()
    expect(wrapper.vm.cameras.map(c => c.id)).toEqual(['2'])
    expect(client.open).toHaveBeenCalledWith({ device_id: '2', config_version: 1, rtsp_url: 'rtsp://camera/live' })
    expect(readerConfig.token).toBe('capture-token')
    expect(request.mock.calls.some(([c]) => /\/(snapshot|stream)$/.test(c.url))).toBe(false)
    jest.advanceTimersByTime(10000); await flush(); expect(client.heartbeat).toHaveBeenCalledWith('session-1')
    await wrapper.setProps({ visible: false }); expect(client.release).toHaveBeenCalledWith('session-1'); expect(closeReader).toHaveBeenCalled()
  })
  it('retains a photo after upload failure and closes only on success', async() => {
    await wrapper.vm.load(); await flush(); await wrapper.vm.capture()
    expect(client.snapshot).toHaveBeenCalledWith('session-1'); expect(client.release).toHaveBeenCalledWith('session-1')
    wrapper.vm.useSnapshot()
    const job = wrapper.emitted('capture')[0][0]
    expect(job.file.type).toBe('image/jpeg'); expect(job.file.name).toMatch(/^camera-2-/)
    job.onError(new Error('upload failed')); expect(wrapper.vm.uploading).toBe(false); expect(wrapper.vm.snapshot).toBeTruthy()
    expect(wrapper.emitted('update:visible')).toBeUndefined()
    wrapper.vm.useSnapshot(); wrapper.emitted('capture')[1][0].onSuccess()
    expect(wrapper.emitted('update:visible')[0]).toEqual([false])
  })
  it('discards a late photo and revokes its URL on retake', async() => {
    await wrapper.vm.load(); await flush()
    let complete; client.snapshot.mockReturnValue(new Promise(resolve => { complete = resolve }))
    const capture = wrapper.vm.capture(); await wrapper.setProps({ visible: false })
    complete(new Blob(['jpeg'], { type: 'image/jpeg' })); await capture; expect(wrapper.vm.snapshot).toBe(null)
    await wrapper.setProps({ visible: true }); await wrapper.setData({ snapshotUrl: 'blob:old', snapshot: new Blob(['old']) })
    wrapper.vm.retake(); await flush(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old'); expect(wrapper.vm.snapshot).toBe(null)
  })
  it('releases a session created after the dialog has closed', async() => {
    let complete; client.open.mockReturnValue(new Promise(resolve => { complete = resolve }))
    await wrapper.vm.load(); await flush(); await wrapper.setProps({ visible: false })
    complete({ session_id: 'late' }); await flush()
    expect(client.release).toHaveBeenCalledWith('late'); expect(wrapper.vm.connected).toBe(false)
  })
  it('cleans up a failed lease heartbeat and explains the error', async() => {
    await wrapper.vm.load(); await flush()
    client.heartbeat.mockRejectedValue(new Error('访问凭证已失效'))
    jest.advanceTimersByTime(10000); await flush()
    expect(wrapper.vm.connected).toBe(false); expect(wrapper.vm.streamError).toContain('凭证已失效'); expect(client.release).toHaveBeenCalled()
  })
  it('reports missing network configuration before requesting camera data', async() => {
    createCaptureClient.mockImplementation(() => { throw new Error('请先到网络配置保存凭证') })
    await wrapper.vm.load(); await flush()
    expect(wrapper.vm.streamError).toContain('网络配置'); expect(client.open).not.toHaveBeenCalled()
  })
  it('shows the actual preview error instead of guessing its cause', async() => {
    await wrapper.vm.load(); await flush()
    readerConfig.onError('Error: codecs not supported by client, retrying in some seconds')
    expect(wrapper.vm.streamError).toContain('codecs not supported by client')
  })
})
