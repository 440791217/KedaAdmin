jest.mock('@/utils/business_code', () => ({ createBusinessCode: prefix => prefix + '-202610161745-A7F29C' }))
import Vue from 'vue'
import ElementUI from 'element-ui'
import { createLocalVue, mount } from '@vue/test-utils'
import ProjectMembers from '@/views/project/detail/components/ProjectMembers.vue'
import OwnerTransfer from '@/views/project/detail/components/OwnerTransfer.vue'
import ProjectActivity from '@/views/project/detail/components/ProjectActivity.vue'
import request from '@/utils/request'
jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.filter('parseTime', value => value)
const flush = async() => { for (let i = 0; i < 20; i++) await Promise.resolve(); await Vue.nextTick() }
const project = { id: '1', name: '测试项目', owner_user_id: '2', owner_name: '原负责人', version: 7, can_manage_members: true }
const member = { user_id: '3', real_name: '成员', username: 'worker', member_status: 1, account_status: 1, access_level: 0, version: 3, can_change: true, can_remove: true, owned_subprojects: 0, missing_permissions: ['project:read'] }
let wrappers
function page(component, props = {}) {
  const wrapper = mount(component, { localVue, sync: false, propsData: { project, ...props }, stubs: { transition: true, 'transition-group': true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }})
  wrappers.push(wrapper); return wrapper
}
beforeEach(() => {
  wrappers = []; request.mockReset()
  request.mockImplementation(config => {
    if (config.url.endsWith('/member/list')) return Promise.resolve({ data: { items: [member], total: 1, project_version: 7, can_manage: true }})
    if (config.url.endsWith('/member/options')) return Promise.resolve({ data: [{ id: '3', real_name: '成员', username: 'worker' }] })
    if (config.url.endsWith('/activity/list')) return Promise.resolve({ data: { items: [{ id: '1', actor_name: '负责人', target_name: '成员', action: 'MEMBER_ADDED', before_value: '非成员', after_value: '查看成员' }], total: 1 }})
    return Promise.resolve({ data: null })
  })
})
afterEach(() => { wrappers.forEach(w => w.destroy()); document.body.innerHTML = '' })
describe('project collaboration pages', () => {
  it('shows missing function permissions and adds a member with the current project version', async() => {
    const wrapper = page(ProjectMembers); await flush()
    expect(wrapper.text()).toContain('部分操作缺少系统权限')
    wrapper.vm.open(null); await flush(); wrapper.vm.form = { user_id: '3', access_level: 1 }; await Vue.nextTick()
    await wrapper.vm.save()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/member', method: 'post', data: { user_id: '3', access_level: 1, version: 7 }}))
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })
  it('edits and removes members using member versions instead of the project version', async() => {
    const wrapper = page(ProjectMembers); await flush(); wrapper.vm.open(member); await flush(); wrapper.vm.form.access_level = 1
    await wrapper.vm.save()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/member/3', method: 'put', data: { access_level: 1, version: 3 }}))
    const confirm = jest.spyOn(wrapper.vm, '$confirm').mockResolvedValue('confirm')
    await wrapper.vm.command('remove', member)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/member/3', method: 'delete', data: { version: 3 }}))
    confirm.mockRestore()
  })
  it('does not show member maintenance controls to ordinary project members', async() => {
    const wrapper = page(ProjectMembers, { project: { ...project, can_manage_members: false }}); await flush()
    expect(wrapper.text()).not.toContain('添加成员')
    expect(wrapper.findAll('button').wrappers.some(button => button.text().includes('编辑'))).toBe(false)
  })
  it('transfers main ownership through the dedicated endpoint and signals navigation', async() => {
    const wrapper = page(OwnerTransfer, { visible: true }); wrapper.vm.init(); await flush()
    wrapper.vm.form.owner_user_id = '3'; await Vue.nextTick()
    const confirm = jest.spyOn(wrapper.vm, '$confirm').mockResolvedValue('confirm')
    await wrapper.vm.save()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/owner', method: 'put', data: { owner_user_id: '3', version: 7 }}))
    expect(wrapper.emitted('transferred')[0]).toEqual([{ main: true }])
    confirm.mockRestore()
  })
  it('restricts child owner candidates and uses the child version', async() => {
    const wrapper = page(OwnerTransfer, { visible: true, entity: { id: '11', name: '子项目', owner_user_id: '2', owner_name: '原负责人', version: 4 }}); wrapper.vm.init(); await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/member/options', params: { keyword: '', purpose: 'subproject_owner' }}))
    wrapper.vm.form.owner_user_id = '3'; await Vue.nextTick()
    const confirm = jest.spyOn(wrapper.vm, '$confirm').mockResolvedValue('confirm')
    await wrapper.vm.save()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/11/owner', data: { owner_user_id: '3', version: 4 }}))
    confirm.mockRestore()
  })
  it('closes stale forms on version conflict and displays read-only operation records', async() => {
    const wrapper = page(ProjectMembers); await flush(); wrapper.vm.open(member); await flush()
    request.mockRejectedValueOnce(Object.assign(new Error('conflict'), { code: 409 }))
    await wrapper.vm.save()
    expect(wrapper.vm.dialog).toBe(false); expect(wrapper.emitted('changed')).toHaveLength(1)
    const activity = page(ProjectActivity); await flush()
    expect(activity.text()).toContain('添加成员')
    expect(activity.text()).toContain('非成员')
  })
})
