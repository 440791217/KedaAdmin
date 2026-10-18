jest.mock('@/utils/business_code', () => ({ createBusinessCode: prefix => prefix + '-202610161745-A7F29C' }))
import Vue from 'vue'
import ElementUI from 'element-ui'
import { createLocalVue, mount } from '@vue/test-utils'
import ProjectList from '@/views/project/list/index.vue'
import ProjectDetail from '@/views/project/detail/index.vue'
import EntityDialog from '@/shared/project/components/EntityDialog.vue'
import request from '@/utils/request'

jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.filter('parseTime', value => value || '')
const flush = async() => { for (let i = 0; i < 20; i++) await Promise.resolve(); await Vue.nextTick() }
const project = (id = '1') => ({ id, code: `P-${id}`, name: `项目${id}`, owner_user_id: '2', owner_name: '负责人', owner_username: 'owner', status: 0, version: 4, subproject_count: 2, can_edit: true, can_manage: true, can_delete: true, can_create_subproject: true, can_sort: true })
const children = () => [
  { id: '11', project_id: '1', code: 'S1', name: '子项目甲', owner_user_id: '2', owner_name: '负责人', owner_username: 'owner', status: 0, version: 2, can_edit: true, can_status: true, can_delete: true },
  { id: '12', project_id: '1', code: 'S2', name: '子项目乙', owner_user_id: '2', owner_name: '负责人', owner_username: 'owner', status: 0, version: 0, can_edit: true, can_status: true, can_delete: true }
]
function setup(component, extra = {}) {
  return mount(component, {
    localVue,
    sync: false,
    mocks: { $route: { params: { projectId: '1' }, fullPath: '/project/1' }, $router: { push: jest.fn().mockResolvedValue() }, ...extra },
    // Popper/select positioning is outside the page/API contract and requires a browser layout engine.
    stubs: { transition: true, 'transition-group': true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }
  })
}
let wrappers
beforeEach(() => {
  wrappers = []
  request.mockReset()
  request.mockImplementation(config => {
    if (config.method && config.method !== 'get') return Promise.resolve({ data: project() })
    if (config.url.endsWith('/owner/options')) return Promise.resolve({ data: [{ id: '2', username: 'owner', real_name: '负责人' }] })
    if (config.url === '/project/list') return Promise.resolve({ data: { items: [project()], total: 1, can_create: true }})
    if (config.url.endsWith('/subproject/list')) return Promise.resolve({ data: children() })
    if (config.url.includes('/subproject/')) return Promise.resolve({ data: children()[0] })
    return Promise.resolve({ data: project(config.url.split('/').pop()) })
  })
})
afterEach(() => { wrappers.forEach(wrapper => wrapper.destroy()); document.body.innerHTML = '' })
function page(component, extra) { const wrapper = setup(component, extra); wrappers.push(wrapper); return wrapper }

describe('project pages connected to real API contracts', () => {
  it('renders the project list and preserves status zero in filter requests', async() => {
    const wrapper = page(ProjectList)
    await flush()
    expect(wrapper.text()).toContain('项目1')
    wrapper.vm.query.status = 0
    wrapper.vm.query.keyword = 'P-1'
    await wrapper.vm.search()
    await flush()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/project/list', params: expect.objectContaining({ status: 0, keyword: 'P-1', page: 1 }) }))
  })
  it('distinguishes a load failure from an empty list and supports retry', async() => {
    request.mockRejectedValueOnce(new Error('offline'))
    const wrapper = page(ProjectList)
    await flush()
    expect(wrapper.text()).toContain('项目加载失败')
    await wrapper.vm.load()
    await flush()
    expect(wrapper.text()).not.toContain('项目加载失败')
    expect(wrapper.text()).toContain('项目1')
  })
  it('creates a project through the actual form and reloads the first list page', async() => {
    const wrapper = page(ProjectList)
    await flush()
    wrapper.vm.query.page = 3
    wrapper.findAll('button').wrappers.find(button => button.text().includes('新建项目')).trigger('click')
    await flush()
    const form = wrapper.find(EntityDialog)
    form.vm.form = { code: 'PRJ-202610161745-A7F29C', name: ' 新项目 ', owner_user_id: '2', customer_name: '', description: '' }
    await Vue.nextTick()
    await form.vm.save()
    await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project', method: 'post', data: { code: 'PRJ-202610161745-A7F29C', name: '新项目', owner_user_id: '2', customer_name: null, description: null }}))
    expect(wrapper.vm.dialog).toBe(false)
    expect(wrapper.vm.query.page).toBe(1)
  })
  it('creates and edits subprojects without changing their immutable codes', async() => {
    const wrapper = page(ProjectDetail)
    await flush()
    expect(wrapper.text()).toContain('子项目甲')
    wrapper.vm.openForm(null, true)
    await flush()
    const dialog = wrapper.find(EntityDialog)
    dialog.vm.form = { code: 'SUB-202610161745-A7F29C', name: '新子项目', owner_user_id: '2' }
    await Vue.nextTick()
    await dialog.vm.save()
    await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject', method: 'post', data: { code: 'SUB-202610161745-A7F29C', name: '新子项目', owner_user_id: '2', description: null }}))
    await wrapper.vm.command('edit', children()[0], true)
    await flush()
    dialog.vm.form.name = '修改子项目'
    await dialog.vm.save()
    await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/11', method: 'put', data: { name: '修改子项目', description: null, version: 2 }}))
  })
  it('loads the latest project version before editing and preserves the current list page', async() => {
    const wrapper = page(ProjectList)
    await flush()
    wrapper.vm.query.page = 3
    await wrapper.vm.command('edit', { ...project(), version: 0 })
    await flush()
    const dialog = wrapper.find(EntityDialog)
    dialog.vm.form.name = '修改项目名称'
    await dialog.vm.save()
    await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1', method: 'put', data: { name: '修改项目名称', description: null, customer_name: null, version: 4 }}))
    expect(wrapper.vm.query.page).toBe(3)
  })
  it('saves order with the parent version and blocks invalid child start actions', async() => {
    const wrapper = page(ProjectDetail)
    await flush()
    expect(wrapper.vm.subStatuses(children()[0])).toEqual([3])
    wrapper.vm.project.status = 1
    expect(wrapper.vm.subStatuses(children()[0])).toEqual([1, 3])
    await wrapper.vm.move(0, 1)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/sort', method: 'put', data: { ids: ['12', '11'], version: 4 }}))
  })
  it('passes the child version for status changes and routes back after deleting a child detail', async() => {
    const route = { params: { projectId: '1', subprojectId: '11' }, fullPath: '/project/1/subproject/11' }
    const wrapper = page(ProjectDetail, { $route: route })
    await flush()
    const confirm = jest.spyOn(wrapper.vm, '$confirm').mockResolvedValue('confirm')
    const message = jest.spyOn(wrapper.vm.$message, 'success').mockImplementation(() => {})
    await wrapper.vm.command(3, children()[0], true)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/11/status', data: { status: 3, version: 2 }}))
    await wrapper.vm.command('delete', children()[0], true)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/11', method: 'delete', data: { version: 2 }}))
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/project/1')
    expect(request.mock.calls.some(([config]) => config.url.includes('undefined'))).toBe(false)
    confirm.mockRestore(); message.mockRestore()
  })
  it('does not let an old project response overwrite a newly opened project', async() => {
    const handler = request.getMockImplementation()
    let resolveOld
    request.mockImplementation(config => config.url === '/project/1' ? new Promise(resolve => { resolveOld = resolve }) : handler(config))
    const route = Vue.observable({ params: { projectId: '1' }, fullPath: '/project/1' })
    const wrapper = page(ProjectDetail, { $route: route })
    route.params.projectId = '2'; route.fullPath = '/project/2'
    await flush()
    expect(wrapper.vm.record.id).toBe('2')
    resolveOld({ data: project('1') })
    await flush()
    expect(wrapper.vm.record.id).toBe('2')
  })
  it('restores archived projects and children using their own versioned endpoints', async() => {
    const wrapper = page(ProjectDetail)
    await flush()
    const confirm = jest.spyOn(wrapper.vm, '$confirm').mockResolvedValue('confirm')
    await wrapper.vm.command('restore', { ...project(), status: 3, can_restore: true }, false)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/restore', method: 'put', data: { version: 4 }}))
    await wrapper.vm.command('restore', { ...children()[0], status: 3, can_restore: true }, true)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/11/restore', method: 'put', data: { version: 2 }}))
    confirm.mockRestore()
  })
})

it('uses root delete flag independently of project status and child count', async() => {
  const confirm = jest.fn().mockResolvedValue(); const success = jest.fn()
  const wrapper = page(ProjectList, { $confirm: confirm, $message: { success }}); await flush()
  const row = { ...project(), status: 3, subproject_count: 2, can_delete: true }; await wrapper.setData({ items: [row] }); expect(wrapper.text()).toContain('删除项目')
  await wrapper.vm.command('delete', row)
  expect(confirm.mock.calls[0][0]).toContain('全部子项目、SOP任务'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1', method: 'delete', data: { version: 4 }}))
})
it('does not issue project deletion for an ordinary manager without root delete flag', async() => {
  const wrapper = page(ProjectList); await flush(); request.mockClear(); await wrapper.vm.command('delete', { ...project(), can_delete: false }); expect(request).not.toHaveBeenCalled()
})

it('keeps start actions in edit menus and explains the parent prerequisite', async() => {
  const wrapper = page(ProjectDetail); await flush()
  expect(wrapper.findAll('button').wrappers.some(b => b.text() === '开始项目' || b.text() === '开始子项目')).toBe(false)
  expect(wrapper.text()).toContain('开始项目'); expect(wrapper.text()).toContain('开始子项目（请先开始主项目）')
  const blocked = wrapper.findAll('.el-dropdown-menu__item').wrappers.find(item => item.text() === '开始子项目（请先开始主项目）')
  expect(blocked.classes()).toContain('is-disabled')
})

it('opens owner adjustment from the edit form and protects unsaved profile changes', async() => {
  const confirm = jest.fn().mockRejectedValueOnce(new Error('cancel')).mockResolvedValueOnce()
  const wrapper = page(EntityDialog, { $confirm: confirm }); await wrapper.setProps({ visible: true, entity: { ...project(), can_transfer_owner: true }}); wrapper.vm.initForm(); await flush()
  await wrapper.setData({ form: { ...wrapper.vm.form, name: '未保存的名称' }})
  await wrapper.vm.changeOwner(); expect(wrapper.emitted('transfer-owner')).toBeUndefined()
  await wrapper.vm.changeOwner(); expect(wrapper.emitted('transfer-owner')[0][0].id).toBe('1'); expect(wrapper.text()).not.toContain('编辑 → 转移负责人')
})
it('keeps archived profile read-only while permitting authorized owner adjustment', async() => {
  const wrapper = page(EntityDialog); await wrapper.setProps({ visible: true, entity: { ...project(), status: 3, can_edit: false, can_transfer_owner: true }}); wrapper.vm.initForm(); await flush()
  expect(wrapper.vm.canEditProfile).toBe(false); expect(wrapper.text()).toContain('调整负责人')
  expect(wrapper.findAll('button').wrappers.some(button => button.text() === '保存')).toBe(false)
})
