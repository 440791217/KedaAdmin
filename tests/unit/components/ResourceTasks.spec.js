import TaskStandard from '@/views/project/task/components/TaskStandard.vue'
import StationTasks from '@/shared/resource/components/StationTasks.vue'
import Vue from 'vue'
import ElementUI from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import ScannerInput from '@/shared/resource/components/ScannerInput.vue'
import ResourcePage from '@/shared/resource/components/ResourcePage.vue'
import ConnectionFields from '@/shared/resource/components/ConnectionFields.vue'
import { newConnection } from '@/shared/resource/js/connection_helpers'
import SopTasks from '@/views/project/detail/components/SopTasks.vue'
import ResourceRequirements from '@/views/sop/editor/components/ResourceRequirements.vue'
import request from '@/utils/request'
jest.mock('@/utils/request', () => jest.fn())
jest.mock('@/utils/business_code', () => ({ createBusinessCode: prefix => prefix + '-202610162030-A7F29C' }))
const localVue = createLocalVue(); localVue.use(ElementUI)
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve(); await Vue.nextTick() }
let wrappers
function page(component, propsData) { const w = mount(component, { localVue, propsData, sync: false, mocks: { $route: { query: {}}, $router: { push: jest.fn() }, $confirm: jest.fn().mockResolvedValue(), $message: { success: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn() }}, stubs: { 'el-form-item': { template: '<div><slot /></div>' }, transition: true, 'transition-group': true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }}); wrappers.push(w); return w }
beforeEach(() => {
  wrappers = []; request.mockReset(); request.mockImplementation(c => {
    if (c.url.endsWith('/owner/options')) return Promise.resolve({ data: [{ id: '2', real_name: '用户', username: 'user2' }] })
    if (c.url.endsWith('/task')) return Promise.resolve({ data: { items: [{ id: '1', code: 'TSK-X', name: '任务', status: 0, owner_user_id: '2', sort_order: 0, version: 0, issues: ['未绑定工位'] }], can_manage: true }})
    return Promise.resolve({ data: { items: [], total: 0, can_manage: true }})
  })
})
afterEach(() => { wrappers.forEach(w => w.destroy()); jest.restoreAllMocks(); document.body.innerHTML = '' })
describe('resource and subproject task integration', () => {
  it('previews a selectable source standard without treating it as the task fixed version', async() => {
    request.mockResolvedValue({ data: { title: '可复用标准', steps: [] }})
    const w = page(TaskStandard, { projectId: '10', subprojectId: '11', sopId: '30', revisionId: '31' }); await flush(); expect(w.text()).toContain('可复用标准'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/sop/30/version/31' })); expect(request.mock.calls.some(([c]) => c.url.includes('/task/'))).toBe(false)
  })
  it('keeps fixed-version preview authorized through the project task endpoint', async() => {
    request.mockResolvedValue({ data: { title: '任务标准', steps: [] }})
    const w = page(TaskStandard, { projectId: '10', subprojectId: '11', taskId: '9' }); await flush(); expect(w.text()).toContain('任务标准'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/10/subproject/11/task/9/preview' })); expect(request.mock.calls.some(([c]) => c.url.startsWith('/sop/'))).toBe(false)
  })

  it('shows station tasks without a create action and opens the matching project task', async() => {
    request.mockResolvedValue({ data: { items: [{ id: '9', project_id: '10', subproject_id: '11', name: '检查任务' }] }})
    const w = page(StationTasks, { station: { id: '7', name: '工位甲' }}); await flush(); expect(w.text()).not.toContain('新建 SOP任务'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/resource/station/7/task' })); w.vm.visit(w.vm.items[0]); expect(w.vm.$router.push).toHaveBeenCalledWith('/project/10/subproject/11/task/9')
  })

  it('offers only active hardware models of the task station for SOP requirements', async() => {
    request.mockResolvedValue({ data: { devices: [
      { model_id: '3', model_name: '摄像头', specification: '高清', unit: '台', status: 0, model_status: 0 },
      { model_id: '3', model_name: '摄像头', status: 0, model_status: 0 },
      { model_id: '4', model_name: '维修设备', status: 1, model_status: 0 },
      { model_id: '5', model_name: '停用规格', status: 0, model_status: 2 }
    ] }})
    const w = page(ResourceRequirements, { value: { items: [] }, stationId: '7' }); await w.vm.search(''); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/resource/station/7' })); expect(w.vm.options.map(m => m.id)).toEqual(['3']); w.vm.add('3'); expect(w.emitted('input')[0][0].items[0].model_id).toBe('3'); await w.setProps({ stationId: '8' }); expect(w.vm.options).toEqual([])
  })

  it('routes new and existing task actions to the same task workspace', async() => {
    const w = page(SopTasks, { projectId: '10', subprojectId: '11' }); await flush(); w.vm.open(); expect(w.vm.$router.push).toHaveBeenLastCalledWith('/project/10/subproject/11/task/new'); await w.vm.command('edit', { id: '1' }); expect(w.vm.$router.push).toHaveBeenLastCalledWith({ path: '/project/10/subproject/11/task/1', query: { mode: 'edit' }}); expect(w.text()).not.toContain('制作新 SOP')
  })

  it('creates a device with auto-generated code and communication in one request, preserving retry input', async() => {
    const w = page(ResourcePage, { kind: 'device', title: '设备' }); await flush(); await w.vm.open()
    const code = w.vm.form.code; expect(code).toMatch(/^TOL-/); w.vm.form.name = '摄像头01'; w.vm.form.model_id = '3'; w.vm.form.connection = { ...newConnection('network'), host: '192.0.2.10', port: 554, rtsp_url: 'rtsp://192.0.2.10:554' }
    request.mockClear(); request.mockRejectedValueOnce(Object.assign(new Error('保存失败'), { code: 500 })); await w.vm.save()
    expect(w.vm.dialog).toBe(true); expect(w.vm.form.code).toBe(code); expect(w.vm.form.connection.host).toBe('192.0.2.10')
    expect(request).toHaveBeenCalledTimes(1); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/resource/device', method: 'post', data: expect.objectContaining({ code, connection: expect.objectContaining({ transport: 'network', host: '192.0.2.10', port: 554 }) }) }))
  })
  it('edits device details and authenticated RTSP in one form without a separate connection dialog', async() => {
    const w = page(ResourcePage, { kind: 'device', title: '设备' }); await flush()
    const address = 'rtsp://operator:p%40ss@192.0.2.10:554/live'
    const device = { id: '6', version: 3, code: 'TOL-TEST', name: '摄像头', model_id: '3', connection: { ...newConnection('network'), rtsp_url: address }}
    request.mockImplementation(c => c.url === '/resource/device/6' ? Promise.resolve({ data: device }) : Promise.resolve({ data: { items: [{ id: '3' }], total: 1, can_manage: true }}))
    await w.vm.command('edit', device); expect(w.vm.dialog).toBe(true); expect(w.vm.form.connection.rtsp_url).toBe(address)
    expect(w.vm.$options.components.DeviceConnection).toBeUndefined()
    expect(w.vm.rtspAddress(device.connection)).not.toContain('p%40ss')
    expect(w.vm.rtspAddress(device.connection)).not.toContain('operator')
    request.mockClear(); await w.vm.save()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/resource/device/6', method: 'put', data: expect.objectContaining({ version: 3, connection: expect.objectContaining({ rtsp_url: address }) }) }))
    expect(request.mock.calls.some(([c]) => c.url.endsWith('/connection'))).toBe(false)
  })
  it('keeps the entered RTSP address when an old backend reports success without persisting it', async() => {
    const w = page(ResourcePage, { kind: 'device', title: '设备' }); await flush()
    const address = 'rtsp://operator:p%40ss@192.0.2.10/live'
    w.vm.form = { id: '6', version: 0, name: '摄像头', model_id: '3', connection: { ...newConnection('network'), rtsp_url: address }}
    w.vm.dialog = true
    request.mockResolvedValue({ data: { id: '6', version: 1, connection: { transport: 'network', protocol: 'rtsp', host: '192.0.2.10', port: 554, path: '/live' }}})
    await w.vm.save()
    expect(request).toHaveBeenCalledWith({ url: '/resource/device/6' })
    expect(w.vm.dialog).toBe(true); expect(w.vm.form.connection.rtsp_url).toBe(address); expect(w.vm.form.version).toBe(1)
    expect(w.vm.$message.error).toHaveBeenCalledWith(expect.stringContaining('未保存到数据库'))
    expect(w.vm.$message.success).not.toHaveBeenCalled()
  })
  it('shows communication and address in device list and distinguishes the optional manufacturer serial', async() => {
    const w = page(ResourcePage, { kind: 'device', title: '设备' }); await flush(); w.vm.items = [{ id: '1', code: 'TOL-A', name: '摄像头01', status: 0, transport: 'network', protocol: 'rtsp', connection_host: '192.0.2.10', connection_port: 554 }]; await flush()
    expect(w.text()).toContain('通信方式'); expect(w.text()).toContain('192.0.2.10:554'); expect(w.text()).toContain('网络'); await w.vm.open(); expect(w.findAll('input').wrappers.some(i => (i.attributes('placeholder') || '').includes('选填，厂家出厂编号'))).toBe(true); expect(w.text()).toContain('系统自动生成')
  })
  it('changes communication fields without mutating props and clears irrelevant IP for USB', async() => {
    const value = { ...newConnection('network'), host: '192.0.2.10' }; const w = page(ConnectionFields, { value }); w.vm.changeTransport('usb')
    expect(value.host).toBe('192.0.2.10'); const emitted = w.emitted('input').slice(-1)[0][0]; expect(emitted.transport).toBe('usb'); expect(emitted.protocol).toBe('hid_keyboard'); expect(emitted.host).toBe(''); await w.setProps({ value: emitted }); expect(w.findAll('input').wrappers.some(i => i.attributes('placeholder') === '工位电脑标识')).toBe(true)
  })

  it('loads database locations and sends station location ID and required IP', async() => {
    const w = page(ResourcePage, { kind: 'station', title: '工位' }); await flush(); await w.vm.open()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/resource/location', params: expect.objectContaining({ status: 0 }) }))
    w.vm.form.name = '工位A'; request.mockClear(); await w.vm.save(); expect(request).not.toHaveBeenCalled()
    w.vm.form.location_id = '33'; await w.vm.save(); expect(request).not.toHaveBeenCalled()
    w.vm.form.ip_address = ' 198.51.100.10 '; await w.vm.save()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/resource/station', method: 'post', data: expect.objectContaining({ location_id: '33', ip_address: '198.51.100.10' }) }))
  })
  it('provides a location recording page without querying resource owner choices', async() => {
    const w = page(ResourcePage, { kind: 'location', title: '位置' }); await flush(); await w.vm.open()
    expect(w.vm.form.code).toMatch(/^LOC-/); expect(request.mock.calls.some(([c]) => c.url.endsWith('/owner/options'))).toBe(false)
    w.vm.form.name = '测试区域A'; await w.vm.save()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/resource/location', method: 'post', data: expect.objectContaining({ name: '测试区域A' }) }))
  })

  it('keeps the server failure reason visible and clears stale resource permissions', async() => {
    const w = page(ResourcePage, { kind: 'station', title: '工位' }); await flush()
    request.mockRejectedValueOnce(Object.assign(new Error('服务器内部错误'), { code: 500 }))
    await w.vm.load(); await flush()
    expect(w.text()).toContain('服务器内部错误（500）'); expect(w.text()).toContain('/resource/station')
    expect(w.vm.canManage).toBe(false); expect(w.vm.total).toBe(0)
    await w.vm.load(); await flush(); expect(w.vm.failed).toBe(false); expect(w.vm.failureMessage).toBe('')
  })
  it('accepts scanner Enter input once and resets on station changes without starting tasks', async() => { const w = page(ScannerInput, { stationId: '7' }); jest.spyOn(Date, 'now').mockReturnValue(10000); w.vm.value = ' CODE-001 '; w.vm.receive(); w.vm.value = 'CODE-001'; w.vm.receive(); expect(w.emitted('scan')).toHaveLength(1); expect(w.emitted('scan')[0][0]).toEqual({ value: 'CODE-001', station_id: '7', timestamp: 10000 }); expect(request).not.toHaveBeenCalled(); await w.setProps({ stationId: '8' }); expect(w.vm.last).toBe('') })
  it('retains generated resource code and unsaved input after a failed create', async() => { const w = page(ResourcePage, { kind: 'station', title: '工位' }); await flush(); await w.vm.open(); const code = w.vm.form.code; w.vm.form.name = '工位A'; w.vm.form.location_id = '33'; w.vm.form.ip_address = '198.51.100.10'; request.mockRejectedValueOnce({ code: 409 }); await w.vm.save(); expect(w.vm.dialog).toBe(true); expect(w.vm.form.code).toBe(code); expect(w.vm.form.name).toBe('工位A') })
  it('edits step requirements without mutating published source props or duplicating models', async() => { const value = { workplace_requirements: '', items: [] }; const w = page(ResourceRequirements, { value }); w.vm.options = [{ id: '3', name: '摄像头', specification: '高清', unit: '台' }]; w.vm.add('3'); expect(value.items).toHaveLength(0); const next = w.emitted('input')[0][0]; expect(next.items[0]).toEqual(expect.objectContaining({ model_id: '3', quantity: 1 })); await w.setProps({ value: next }); w.vm.add('3'); expect(w.emitted('input')).toHaveLength(1) })
})

it('lets root delete a task even when normal editing is disabled, preserving version', async() => {
  const row = { id: '9', name: '历史任务', status: 2, version: 7, issues: [] }
  request.mockResolvedValue({ data: { items: [row], can_manage: false, can_delete: true }})
  const w = page(SopTasks, { projectId: '10', subprojectId: '11' }); await flush(); expect(w.text()).toContain('删除任务')
  request.mockClear(); await w.vm.command('delete', row)
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/10/subproject/11/task/9', method: 'delete', data: { version: 7 }}))
})
it('prevents normal task managers from issuing deletion commands', async() => {
  const w = page(SopTasks, { projectId: '10', subprojectId: '11' }); await flush(); expect(w.text()).not.toContain('删除任务')
  request.mockClear(); await w.vm.command('delete', { id: '1', version: 0 }); expect(request).not.toHaveBeenCalled()
})

it('shows publication status without manual configured states for a legacy published task', async() => {
  request.mockResolvedValue({ data: { items: [{ id: '9', name: '已发布任务', status: 0, revision_id: '31', revision_no: 1, issues: [] }], can_manage: true }})
  const w = page(SopTasks, { projectId: '10', subprojectId: '11' }); await flush()
  expect(w.text()).toContain('发布状态'); expect(w.text()).toContain('已发布'); expect(w.text()).not.toContain('待配置'); expect(w.text()).not.toContain('已配置')
})

