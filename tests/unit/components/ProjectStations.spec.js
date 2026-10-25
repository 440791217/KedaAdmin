import Vue from 'vue'
import ElementUI from 'element-ui'
import { createLocalVue, mount } from '@vue/test-utils'
import ProjectStations from '@/views/project/detail/components/ProjectStations.vue'
import request from '@/utils/request'
jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue(); localVue.use(ElementUI)
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve(); await Vue.nextTick() }
let wrapper
beforeEach(() => {
  request.mockReset()
  request.mockImplementation(c => {
    if (c.url === '/project/10/station/list') return Promise.resolve({ data: { items: [{ id: '7', name: '工位甲', code: 'STA-7', status: 0, task_count: 1 }], project_version: 3, can_manage: true }})
    if (c.url === '/resource/station') return Promise.resolve({ data: { items: [{ id: '7', name: '工位甲' }, { id: '8', name: '工位乙' }] }})
    return Promise.resolve({ data: null })
  })
})
afterEach(() => { if (wrapper) wrapper.destroy(); document.body.innerHTML = '' })
function page() {
  wrapper = mount(ProjectStations, { localVue, sync: false, propsData: { project: { id: '10' }}, mocks: { $message: { success: jest.fn() }, $confirm: jest.fn().mockResolvedValue() }, stubs: { transition: true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }})
  return wrapper
}
it('excludes already linked stations when adding and sends the project version', async() => {
  const w = page(); await flush(); w.vm.open(); await flush()
  expect(w.vm.options.map(s => s.id)).toEqual(['8'])
  w.vm.selected = '8'; await w.vm.add(); await flush()
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/10/station', method: 'post', data: { station_id: '8', version: 3 }}))
  expect(w.emitted('changed')).toBeTruthy()
})
it('prevents removing an in-use station and allows an unused one', async() => {
  const w = page(); await flush()
  await w.vm.remove(w.vm.items[0])
  expect(w.vm.$confirm).not.toHaveBeenCalled()
  await w.vm.remove({ id: '8', name: '空闲工位', task_count: 0 })
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/10/station/8', method: 'delete', data: { version: 3 }}))
})
