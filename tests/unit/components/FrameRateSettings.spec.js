import { shallowMount } from '@vue/test-utils'
import Settings from '@/views/system/device/CameraSettings.vue'
import Fields from '@/shared/resource/components/FrameRateFields.vue'
import request from '@/utils/request'
import { statisticsDefaults, statisticsSettings } from '@/utils/frame-statistics-settings'
jest.mock('@/utils/request', () => jest.fn())
const flush = async() => { for (let i = 0; i < 20; i++) await Promise.resolve() }

it('loads shared parameters from the server and saves with concurrency version', async() => {
  request.mockResolvedValue({ data: { refresh_fps: 10, detect_fps: 4, version: 3, can_manage: true }})
  const w = shallowMount(Settings, { directives: { loading: () => {} }, mocks: { $message: { success: jest.fn() }}, stubs: { 'el-card': { template: '<div><slot /></div>' }, 'el-form': { template: '<form><slot /></form>' }, 'el-button': true, 'el-alert': true, 'el-form-item': true, 'el-input-number': true }})
  await flush()
  expect(w.vm.form).toEqual({ refresh_fps: 10, detect_fps: 4, version: 3, ...statisticsDefaults })
  await w.vm.save()
  expect(request).toHaveBeenCalledWith({ url: '/resource/frame-rates', method: 'put', data: { refresh_fps: 10, detect_fps: 4, version: 3, ...statisticsDefaults }})
  expect(statisticsSettings.video_window_seconds).toBe(2)
  await w.setData({ canManage: false }); request.mockClear(); await w.vm.save()
  expect(request).not.toHaveBeenCalled()
  w.destroy()
})

it('restores one camera field to inheritance without changing its other override', () => {
  const w = shallowMount(Fields, { propsData: { inherit: true, value: { refresh_fps: 10, detect_fps: 5 }}, stubs: { 'el-form-item': true, 'el-switch': true, 'el-input-number': true }})
  w.vm.set('refresh_fps', null)
  expect(w.emitted('input')[0][0]).toEqual({ refresh_fps: null, detect_fps: 5 })
  w.destroy()
})
