import { shallowMount } from '@vue/test-utils'
import Settings from '@/views/sop/editor/components/StepDetectionSettings.vue'
import { fetchResource } from '@/api/resource'
jest.mock('@/api/resource', () => ({ fetchResource: jest.fn() }))
const flush = async() => { for (let i = 0; i < 20; i++) await Promise.resolve() }
it('shows the bound source without another image or camera dropdown', async() => {
  fetchResource.mockResolvedValue({ data: { devices: [{ id: '2', name: '相机A', type_code: 'camera', status: 0, model_status: 0 }, { id: '3', type_code: 'camera', status: 2, model_status: 0 }] }})
  const w = shallowMount(Settings, { propsData: { stationId: '1', value: { enabled: true, camera_id: '2', attachment_id: '', confirmed: false }, attachments: [{ id: '10' }] }, stubs: ['el-form-item', 'el-switch', 'el-select', 'el-option', 'el-button'] })
  await flush()
  expect(fetchResource).toHaveBeenCalledWith('station', '1')
  expect(w.vm.cameras.map(c => c.id)).toEqual(['2'])
  expect(w.text()).toContain('相机A'); expect(w.text()).toContain('尚未选择'); expect(w.find('el-select-stub').exists()).toBe(false)
  await w.setProps({ value: { enabled: true, camera_id: '2', attachment_id: '10', confirmed: false }})
  expect(w.text()).toContain('已选择拍摄照片')
  w.vm.update({ camera_id: '4', confirmed: false })
  expect(w.emitted('input')[0][0]).toEqual({ enabled: true, camera_id: '4', attachment_id: '10', confirmed: false })
  w.destroy()
})
