import Vue from 'vue'
import ElementUI from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import TaskWork from '@/views/project/task/index.vue'
import request from '@/utils/request'
jest.mock('@/utils/request', () => jest.fn())
jest.mock('@/utils/business_code', () => ({ createBusinessCode: prefix => prefix + '-202610171000-A7F29C' }))
const localVue = createLocalVue(); localVue.use(ElementUI)
const flush = async() => { for (let i = 0; i < 60; i++) await Promise.resolve(); await Vue.nextTick() }
let wrappers, row, allow
function page(taskId = '', query = {}) {
  const w = mount(TaskWork, { localVue, sync: false, mocks: { $route: { params: { projectId: '10', subprojectId: '11', ...(taskId ? { taskId } : {}) }, query }, $router: { push: jest.fn().mockResolvedValue(), replace: jest.fn().mockResolvedValue() }, $confirm: jest.fn().mockResolvedValue(), $message: { success: jest.fn(), warning: jest.fn(), info: jest.fn() }}, stubs: { transition: true, 'transition-group': true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true, 'sop-authoring': { props: ['viewOnly', 'taskContext', 'contentSopId', 'contentRevisionId', 'previewRevision'], template: '<div><slot name="task-actions" /></div>', data() { return { busy: false } }, methods: { resolvePending() { return Promise.resolve(true) } }}}}); wrappers.push(w); return w
}
beforeEach(() => {
  wrappers = []; allow = true; row = { id: '9', code: 'TSK-X', name: '检查任务', owner_user_id: '2', station_id: '7', station_name: '工位甲', sort_order: 0, status: 0, version: 2, issues: [] }
  request.mockReset(); request.mockImplementation(c => {
    if (c.url.endsWith('/owner/options')) return Promise.resolve({ data: [{ id: '2', real_name: '负责人', username: 'user2' }] })
    if (c.url === '/project/10/subproject/11/task' && !c.method) return Promise.resolve({ data: { items: [row], can_manage: allow }})
    if (c.url === '/project/10/subproject/11/task/9/content') { row = { ...row, version: 3, content_sop_id: '30', content_draft_id: '31' }; return Promise.resolve({ data: { sop_id: '30', revision_id: '31', task: row }}) }
    if (c.method === 'post' || c.method === 'put') { row = { ...c.data, id: c.data.id || '12', version: 3 }; return Promise.resolve({ data: row }) }
    if (c.url === '/resource/station/7' || c.url === '/resource/station/8') return Promise.resolve({ data: { id: c.url.endsWith('7') ? '7' : '8', devices: [] }})
    if (c.url === '/sop/30/version/31') return Promise.resolve({ data: { id: '31', status: 0, version: 0, title: '草稿', steps: [] }})
    if (c.url === '/resource/station') return Promise.resolve({ data: { items: [{ id: '7', name: '工位甲' }, { id: '8', name: '备用工位' }] }})
    return Promise.resolve({ data: { items: [] }})
  })
})
afterEach(() => { wrappers.forEach(w => w.destroy()); document.body.innerHTML = '' })
describe('SOP task workspace', () => {
  it('enters editing directly from the list edit mode', async() => {
    const w = page('9', { mode: 'edit' }); await flush(); expect(w.vm.editMode).toBe(true); expect(w.vm.editorSopId).toBe('30'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/10/subproject/11/task/9/content', method: 'post' }))
  })
  it('opens task settings only when requested and respects pending content', async() => {
    const w = page('9'); await flush(); expect(w.vm.settingsOpen).toBe(false); w.vm.$refs.authoring.resolvePending = jest.fn().mockResolvedValue(false); await w.vm.openSettings(); expect(w.vm.settingsOpen).toBe(false); w.vm.$refs.authoring.resolvePending.mockResolvedValue(true); await w.vm.openSettings(); expect(w.vm.settingsOpen).toBe(true)
  })

  it('shows task content directly without standard selection or creation dialogs', async() => {
    const w = page('9'); await flush(); expect(w.vm.configOpen).toBe(false); expect(w.vm.contentReady).toBe(true); expect(w.vm.editMode).toBe(false); expect(w.text()).not.toContain('选用已有标准'); expect(w.text()).not.toContain('更换标准'); await w.vm.editContent(); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/10/subproject/11/task/9/content', method: 'post', data: { code: 'SOP-202610171000-A7F29C', version: 2 }})); expect(w.vm.editMode).toBe(true); expect(w.vm.editorRevisionId).toBe('31'); expect(w.vm.taskContext.task_version).toBe(3); expect(w.vm.$router.push).not.toHaveBeenCalled()
  })
  it('saves edited configuration before directly opening its content', async() => {
    const w = page('9'); await flush(); w.vm.form.name = '更新任务'; await w.vm.editContent(); await flush(); expect(w.vm.form.name).toBe('更新任务'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'put', url: '/project/10/subproject/11/task/9' })); expect(w.vm.editMode).toBe(true); expect(w.vm.editorRevisionId).toBe('31')
  })

  it('creates a station-bound task then stays on its persistent task URL', async() => {
    const w = page(); await flush(); expect(w.vm.ready).toBe(true); expect(w.vm.form.station_id).toBeNull(); w.vm.form.name = '新任务'; w.vm.form.owner_user_id = '2'; await w.vm.save(); expect(w.vm.$message.warning).toHaveBeenCalledWith('请选择工位'); w.vm.form.station_id = '7'; await w.vm.stationChanged(); await w.vm.save(); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/10/subproject/11/task', method: 'post', data: expect.objectContaining({ station_id: '7' }) })); expect(w.vm.$router.replace).toHaveBeenCalledWith({ path: '/project/10/subproject/11/task/12', query: {}}); expect(w.vm.dirty).toBe(false)
  })
  it('edits a replacement station without leaving the task', async() => {
    const w = page('9'); await flush(); expect(w.vm.ready).toBe(true); expect(w.vm.dirty).toBe(false); w.vm.form.station_id = '8'; await w.vm.stationChanged(); await w.vm.save(); expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'put', url: '/project/10/subproject/11/task/9', data: expect.objectContaining({ station_id: '8', version: 2 }) })); expect(w.vm.form.station_id).toBe('8'); expect(w.vm.$router.push).not.toHaveBeenCalled()
  })
  it('preserves unsaved input on conflict and asks before leaving', async() => {
    const w = page('9'); await flush(); w.vm.form.name = '未保存'; request.mockRejectedValueOnce({ code: 409 }); await w.vm.save(); expect(w.vm.form.name).toBe('未保存'); expect(w.vm.dirty).toBe(true); w.vm.$confirm.mockRejectedValueOnce('cancel'); expect(await w.vm.mayLeave()).toBe(false)
  })
  it('returns to the parent subproject and never a generic SOP list', async() => {
    const w = page('9'); await flush(); w.vm.back(); expect(w.vm.$router.push).toHaveBeenCalledWith('/project/10/subproject/11')
  })
  it('keeps readonly tasks readable without requesting editing options', async() => {
    allow = false; const w = page('9'); await flush(); expect(w.vm.ready).toBe(true); expect(w.vm.canEdit).toBe(false); expect(request.mock.calls.some(([c]) => c.url.endsWith('/owner/options'))).toBe(false); request.mockClear(); await w.vm.save(); expect(request).not.toHaveBeenCalled()
  })
  it('does not show a task from a different subproject', async() => {
    const w = page('99'); await flush(); expect(w.vm.failed).toBe(true); expect(w.vm.ready).toBe(false); expect(w.vm.form).toEqual({})
  })
  it('resumes task-owned content after a fresh page load without URL candidates', async() => {
    row.content_sop_id = '30'; row.content_draft_id = '31'; const w = page('9'); await flush(); expect(w.vm.previewRevision.id).toBe('31'); expect(w.vm.editMode).toBe(false); await w.vm.editContent(); expect(w.vm.editMode).toBe(true); expect(w.vm.editorRevisionId).toBe('31'); expect(request.mock.calls.some(([c]) => c.url === '/sop' || c.url.endsWith('/version/list'))).toBe(false)
  })
})
