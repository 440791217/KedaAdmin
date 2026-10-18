import { shallowMount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import CameraSource from '@/views/sop/editor/components/CameraSource.vue'
import request from '@/utils/request'
import { readCameraStream } from '@/shared/resource/js/camera_stream'
jest.mock('@/utils/request', () => jest.fn())
jest.mock('@/shared/resource/js/camera_stream', () => ({ readCameraStream: jest.fn() }))
const flush = async() => { for (let i = 0; i < 15; i++) await Promise.resolve() }
let wrapper
const originalController = global.AbortController
const localVue = createLocalVue(); localVue.use(ElementUI)
beforeEach(() => {
  request.mockReset(); readCameraStream.mockReset()
  readCameraStream.mockImplementation(() => new Promise(() => {}))
  URL.createObjectURL = jest.fn().mockReturnValue('blob:camera'); URL.revokeObjectURL = jest.fn()
  global.AbortController = class { constructor() { this.signal = { aborted: false } } abort() { this.signal.aborted = true } }
  wrapper = shallowMount(CameraSource, { localVue, propsData: { visible: true, stationId: '1' }, mocks: { $message: { error: jest.fn(), success: jest.fn() }}})
})
afterEach(() => { wrapper.destroy(); global.AbortController = originalController })
describe('camera capture lifecycle', () => {
  it('selects available station cameras and aborts preview when closed', async() => {
    request.mockResolvedValue({ data: { devices: [{ id: '2', type_code: 'camera', status: 0, model_status: 0 }, { id: '3', type_code: 'camera', status: 2, model_status: 0 }] }})
    await wrapper.vm.load()
    expect(wrapper.vm.cameras.map(c => c.id)).toEqual(['2'])
    expect(readCameraStream).toHaveBeenCalledWith('2', expect.anything(), expect.any(Function))
    const signal = readCameraStream.mock.calls[0][1]
    await wrapper.setProps({ visible: false }); expect(signal.aborted).toBe(true)
  })
  it('keeps a captured photo for retry after upload failure and closes only on success', async() => {
    wrapper.vm.cameraId = '2'
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' }); request.mockResolvedValue(blob)
    await wrapper.vm.capture(); wrapper.vm.useSnapshot()
    const job = wrapper.emitted('capture')[0][0]
    expect(job.file.type).toBe('image/jpeg'); expect(job.file.name).toMatch(/^camera-2-/)
    job.onError(new Error('upload failed')); expect(wrapper.vm.uploading).toBe(false); expect(wrapper.vm.snapshot).toBe(blob)
    expect(wrapper.emitted('update:visible')).toBeUndefined()
    wrapper.vm.useSnapshot(); wrapper.emitted('capture')[1][0].onSuccess()
    expect(wrapper.emitted('update:visible')[0]).toEqual([false])
  })
  it('discards a snapshot arriving after close and releases URLs on retake', async() => {
    wrapper.vm.cameraId = '2'
    let complete
    request.mockReturnValue(new Promise(resolve => { complete = resolve }))
    const capture = wrapper.vm.capture(); await wrapper.setProps({ visible: false })
    complete(new Blob(['jpeg'])); await capture; expect(wrapper.vm.snapshot).toBe(null)
    await wrapper.setProps({ visible: true }); await wrapper.setData({ snapshotUrl: 'blob:old', snapshot: new Blob(['old']) })
    wrapper.vm.retake(); await flush()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old'); expect(wrapper.vm.snapshot).toBe(null)
  })
})
