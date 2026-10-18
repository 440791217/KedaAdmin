jest.mock('@/utils/business_code', () => ({ createBusinessCode: prefix => prefix + '-202610161745-A7F29C' }))
import Vue from 'vue'
import ElementUI from 'element-ui'
import { createLocalVue, mount } from '@vue/test-utils'
import SopList from '@/views/sop/list/index.vue'
import CreateSopDialog from '@/shared/sop/components/CreateSopDialog.vue'
import SopEditor from '@/views/sop/editor/index.vue'
import SopDetail from '@/views/sop/detail/index.vue'
import SopPreview from '@/views/sop/preview/index.vue'
import SopBindings from '@/shared/sop/components/SopBindings.vue'
import ProtectedImage from '@/shared/sop/components/ProtectedImage.vue'
import ProjectDetail from '@/views/project/detail/index.vue'
import request from '@/utils/request'
jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue(); localVue.use(ElementUI); localVue.filter('parseTime', x => x || '')
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve(); await Vue.nextTick() }
const doc = () => ({ id: '7', code: 'SOP-7', name: '设备维护', managing_project_id: '1', owner_user_id: '2', owner_name: '负责人', version: 3, draft_count: 1, can_edit: true, can_publish: true, can_retire: true })
const revision = (extra = {}) => ({ id: '8', sop_id: '7', title: '设备维护标准', revision_no: 1, status: 0, version: 0, steps: [], ...extra })
const step = () => ({ id: '9', title: '检查设备', instruction: '切断电源后检查', version: 0, attachments: [] })
const binding = () => ({ id: '31', sop_id: '7', revision_id: '8', code: 'SOP-7', title: '设备维护标准', revision_no: 1, latest_published_no: 2, status: 1, version: 2 })
let wrappers
function page(component, propsData = {}, route = {}) {
  const w = mount(component, { localVue, sync: false, propsData,
    mocks: { $route: { name: 'SopEditor', params: { sopId: '7', revisionId: '8' }, query: {}, fullPath: '/sop/7/version/8/edit', ...route }, $router: { push: jest.fn().mockResolvedValue() }, $confirm: jest.fn().mockResolvedValue(), $message: { success: jest.fn(), error: jest.fn() }},
    stubs: { transition: true, 'transition-group': true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }
  }); wrappers.push(w); return w
}
beforeEach(() => {
  wrappers = []; request.mockReset()
  request.mockImplementation(c => {
    if (c.url === '/sop/project/options') return Promise.resolve({ data: [{ id: '1', name: '项目' }] })
    if (c.url.endsWith('/owner/options')) return Promise.resolve({ data: [{ id: '2', username: 'owner', real_name: '负责人' }] })
    if (c.url === '/sop/list') return Promise.resolve({ data: { items: [doc()], total: 1 }})
    if (c.url === '/sop/7') return Promise.resolve({ data: doc() })
    if (c.url.endsWith('/version/list')) return Promise.resolve({ data: [revision({ status: 1 })] })
    if (c.url.endsWith('/sop/list')) return Promise.resolve({ data: { items: [binding()], target_version: 5, can_manage: true }})
    return Promise.resolve({ data: revision() })
  })
})
afterEach(() => { wrappers.forEach(w => w.destroy()); document.body.innerHTML = '' })

describe('SOP pages and their HTTP contracts', () => {
  it('keeps the standard library searchable without any global creation entry', async() => {
    const w = page(SopList); await flush()
    expect(w.text()).toContain('设备维护'); expect(w.text()).not.toContain('新建 SOP任务'); expect(w.text()).not.toContain('新建 SOP标准'); expect(w.find(CreateSopDialog).exists()).toBe(false)
    w.vm.query.keyword = '维护'; await w.vm.search(); await flush()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/sop/list', params: expect.objectContaining({ keyword: '维护', page: 1 }) }))
  })
  it('creates SOP through the validated dialog using project and owner IDs', async() => {
    const w = page(CreateSopDialog, { visible: true }); await flush()
    await w.setData({ form: { code: 'SOP-202610161745-A7F29C', name: '设备维护', managing_project_id: '1', owner_user_id: '2' }})
    request.mockResolvedValueOnce({ data: { ...doc(), draft: { id: '8' }}})
    await w.vm.save(); await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/sop', method: 'post', data: expect.objectContaining({ code: 'SOP-202610161745-A7F29C', managing_project_id: '1', owner_user_id: '2' }) }))
    expect(w.emitted('created')).toBeTruthy()
  })
  it('saves draft header and blocks step mutations while header is unsaved', async() => {
    const w = page(SopEditor); await flush()
    w.vm.header.title = '修改标题'; await flush()
    expect(w.vm.dirty).toBe(true)
    await w.vm.saveStep({ title: '步骤', instruction: '说明' }); expect(request.mock.calls.some(([c]) => c.method === 'post')).toBe(false)
    request.mockResolvedValueOnce({ data: revision({ title: '修改标题', version: 1 }) })
    await w.vm.saveHeader(); await flush()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/sop/7/version/8', method: 'put', data: expect.objectContaining({ title: '修改标题', version: 0 }) }))
    expect(w.vm.dirty).toBe(false)
  })
  it('retains a generated SOP code after a failed create and submits it unchanged on retry', async() => {
    const w = page(CreateSopDialog, { visible: false }); await flush()
    await w.setProps({ visible: true }); await flush()
    const code = w.vm.form.code
    expect(code).toBe('SOP-202610161745-A7F29C')
    expect(w.find('input[readonly]').element.value).toBe(code)
    Object.assign(w.vm.form, { name: '维护标准', managing_project_id: '1', owner_user_id: '2' })
    request.mockRejectedValueOnce({ code: 409 }); await w.vm.save(); await flush()
    expect(w.vm.form.code).toBe(code); expect(w.emitted('created')).toBeFalsy()
    request.mockResolvedValueOnce({ data: { ...doc(), draft: { id: '8' }}}); await w.vm.save(); await flush()
    const posts = request.mock.calls.map(([c]) => c).filter(c => c.url === '/sop' && c.method === 'post')
    expect(posts).toHaveLength(2); expect(posts.every(c => c.data.code === code)).toBe(true)
    expect(w.emitted('created')).toBeTruthy()
  })
  it('adds steps, uploads images with multipart and publishes the returned current revision', async() => {
    const w = page(SopEditor); await flush()
    request.mockResolvedValueOnce({ data: revision({ version: 1, steps: [step()] }) })
    await w.vm.saveStep({ title: '检查设备', instruction: '切断电源后检查' }); await flush()
    expect(w.text()).toContain('切断电源后检查')
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/sop/7/version/8/step', method: 'post', data: expect.objectContaining({ version: 0 }) }))
    request.mockResolvedValueOnce({ data: revision({ version: 2, steps: [step()] }) })
    await w.vm.upload(step(), { file: new File(['png'], 'step.png', { type: 'image/png' }) }); await flush()
    const sent = request.mock.calls[request.mock.calls.length - 1][0]
    expect(sent.url).toBe('/sop/7/version/8/step/9/image'); expect(sent.data).toBeInstanceOf(FormData); expect(sent.data.get('version')).toBe('1')
    request.mockResolvedValueOnce({ data: revision({ version: 3, status: 1, steps: [step()] }) })
    await w.vm.publish(); await flush()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/sop/7/version/8/publish', method: 'put', data: { version: 2 }}))
    expect(w.vm.editable).toBe(false)
  })
  it('rejects oversized files before request and reloads conflicting revisions', async() => {
    const w = page(SopEditor); await flush(); request.mockClear()
    await w.vm.upload(step(), { file: { size: 5 * 1024 * 1024 + 1 }}); expect(request).not.toHaveBeenCalled()
    request.mockRejectedValueOnce({ code: 409 }); await w.vm.saveStep({ title: '检查', instruction: '说明' }); await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/sop/7/version/8' }))
    expect(w.vm.stepDialog).toBe(false)
  })
  it('copies a published revision using document version and opens the new draft', async() => {
    const w = page(SopDetail); await flush()
    request.mockResolvedValueOnce({ data: revision({ id: '10' }) })
    await w.vm.command('copy', revision({ status: 1 })); await flush()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/sop/7/draft', method: 'post', data: { source_revision_id: '8', version: 3 }}))
    expect(w.vm.$router.push).toHaveBeenCalledWith({ path: '/sop/7/version/10/edit', query: {}})
  })
  it('updates an existing association using binding and target versions, never auto-upgrades', async() => {
    const w = page(SopBindings, { projectId: '1' }); await flush()
    expect(w.text()).toContain('有新版')
    expect(request.mock.calls.every(([c]) => !c.method)).toBe(true)
    await w.vm.open(binding()); await flush(); w.vm.form.revision_id = '12'
    request.mockResolvedValueOnce({ data: { items: [binding()], target_version: 6, can_manage: true }})
    await w.vm.save(); await flush()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/project/1/sop/31', method: 'put', data: { sop_id: '7', revision_id: '12', target_version: 5, version: 2 }}))
    expect(w.emitted('changed')).toBeTruthy()
  })
  it('binds subprojects with their own endpoint and restores an unbound row rather than duplicating it', async() => {
    const w = page(SopBindings, { projectId: '1', subprojectId: '2' }); await flush()
    w.vm.items[0].status = 0; w.vm.form = { sop_id: '7', revision_id: '8' }
    request.mockResolvedValueOnce({ data: { items: [binding()], target_version: 6, can_manage: true }})
    await w.vm.save(); await flush()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/project/1/subproject/2/sop/31', method: 'put' }))
  })
  it('previews a bound version solely through the target project endpoint', async() => {
    const w = page(SopPreview, {}, { name: 'BoundSopPreview', query: { project_id: '1', subproject_id: '2', binding_id: '31' }}); await flush()
    expect(request).toHaveBeenCalledTimes(1); expect(request).toHaveBeenCalledWith({ url: '/project/1/subproject/2/sop/31/preview' })
    expect(w.vm.imageContext).toEqual({ projectId: '1', subprojectId: '2', bindingId: '31' })
  })
  it('keeps the main project limited to subprojects and project collaboration', async() => {
    request.mockImplementation(c => {
      if (c.url === '/project/1') return Promise.resolve({ data: { id: '1', code: 'P1', name: '管理项目', status: 0, can_status: [], version: 5 }})
      if (c.url === '/project/1/subproject/list') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: { items: [binding()], target_version: 5, can_manage: true }})
    })
    const w = page(ProjectDetail, {}, { params: { projectId: '1' }, fullPath: '/project/1' }); await flush()
    expect(w.text()).toContain('子项目'); expect(w.text()).toContain('项目成员'); expect(w.text()).not.toContain('关联 SOP'); expect(w.text()).not.toContain('SOP任务'); expect(request.mock.calls.some(([c]) => /\/sop\/list$|\/task$/.test(c.url))).toBe(false)
  })
  it('shows SOP tasks only under the subproject without a separate association tab', async() => {
    request.mockImplementation(c => {
      if (c.url === '/project/1') return Promise.resolve({ data: { id: '1', code: 'P1', name: '管理项目', status: 0 }})
      if (c.url === '/project/1/subproject/2/task') return Promise.resolve({ data: { items: [], can_manage: true }})
      if (c.url === '/project/1/subproject/2') return Promise.resolve({ data: { id: '2', code: 'S2', name: '子项目', status: 0 }})
      return Promise.resolve({ data: { items: [binding()], target_version: 5, can_manage: true }})
    })
    const w = page(ProjectDetail, {}, { params: { projectId: '1', subprojectId: '2' }, fullPath: '/project/1/subproject/2' }); await flush()
    expect(w.vm.activeTab).toBe('tasks'); expect(request).toHaveBeenCalledWith({ url: '/project/1/subproject/2/task' }); expect(w.text()).toContain('SOP任务'); expect(w.text()).not.toContain('关联 SOP'); expect(w.text()).not.toContain('项目成员'); expect(request.mock.calls.some(([c]) => c.url.endsWith('/sop/list'))).toBe(false)
  })
  it('does not retain stale content after a revoked association fails to refresh', async() => {
    const w = page(SopPreview); await flush(); expect(w.vm.revision).toBeTruthy()
    request.mockRejectedValueOnce({ code: 403 }); await w.vm.load(); await flush()
    expect(w.vm.revision).toBeNull(); expect(w.text()).toContain('无法查看此版本')
  })
  it('loads protected images as authenticated blobs and revokes object URLs', async() => {
    const oldCreate = URL.createObjectURL; const oldRevoke = URL.revokeObjectURL
    URL.createObjectURL = jest.fn().mockReturnValue('blob:private'); URL.revokeObjectURL = jest.fn()
    try {
      const blob = new Blob(['png'], { type: 'image/png' }); request.mockResolvedValueOnce(blob)
      const w = page(ProtectedImage, { fileId: '19', projectId: '1', bindingId: '31' }); await flush()
      expect(request).toHaveBeenCalledWith({ url: '/project/1/sop/31/image/19', responseType: 'blob' }); expect(w.vm.url).toBe('blob:private')
      w.destroy(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private')
    } finally { Object.assign(URL, { createObjectURL: oldCreate, revokeObjectURL: oldRevoke }) }
  })
})
