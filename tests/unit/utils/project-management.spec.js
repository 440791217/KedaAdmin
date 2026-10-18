import request from '@/utils/request'
import { deleteProject, setProjectStatus, deleteSubproject, setSubprojectStatus, sortSubprojects } from '@/api/project'
import { entityPayload, nextStatuses } from '@/shared/project/js/project_helpers'
import dialog from '@/shared/project/js/entity_dialog'
jest.mock('@/utils/request', () => jest.fn().mockResolvedValue({ code: 200 }))

describe('project management integration contract', () => {
  beforeEach(() => jest.clearAllMocks())
  it('preserves string IDs and versions in destructive and state requests', async() => {
    await deleteProject('9007199254740993', 0)
    await setProjectStatus('5', 1, 2)
    await deleteSubproject('5', '6', 3)
    await setSubprojectStatus('5', '6', 3, 4)
    await sortSubprojects('5', ['7', '6'], 5)
    expect(request.mock.calls.map(([config]) => [config.url, config.data])).toEqual([
      ['/project/9007199254740993', { version: 0 }],
      ['/project/5/status', { status: 1, version: 2 }],
      ['/project/5/subproject/6', { version: 3 }],
      ['/project/5/subproject/6/status', { status: 3, version: 4 }],
      ['/project/5/subproject/sort', { ids: ['7', '6'], version: 5 }]
    ])
  })
  it('does not send immutable code, owner or status through project profile editing', () => {
    expect(entityPayload({ code: 'P', name: ' 项目 ', version: 0, owner_user_id: '2', status: 3 }, false, false)).toEqual({ name: '项目', description: null, customer_name: null, version: 0 })
    expect(entityPayload({ code: 'SUB-202610161745-A7F29C', name: '子项目', owner_user_id: '2' }, true, true)).toEqual({ code: 'SUB-202610161745-A7F29C', name: '子项目', owner_user_id: '2', description: null })
  })
  it('prevents reopening archived records and supports reopening completed records', () => {
    expect(nextStatuses(3)).toEqual([])
    expect(nextStatuses(2)).toEqual([1, 3])
  })
  it('preserves a new form and its code on failure and retries with the same payload', async() => {
    const code = 'PRJ-202610161745-A7F29C'
    const context = { saving: false, $refs: { form: { validate: () => Promise.resolve(true) }}, form: { code, name: '项目', owner_user_id: '2' }, entity: null, projectId: '', $emit: jest.fn(), $message: { success: jest.fn() }}
    request.mockRejectedValueOnce({ code: 409 })
    await dialog.methods.save.call(context)
    expect(context.$emit).not.toHaveBeenCalled(); expect(context.form.code).toBe(code)
    request.mockResolvedValueOnce({ code: 200 }); await dialog.methods.save.call(context)
    expect(request.mock.calls[0][0].data.code).toBe(code); expect(request.mock.calls[1][0].data.code).toBe(code)
  })
  it('closes stale forms and refreshes data on the actual request interceptor error contract', async() => {
    request.mockRejectedValueOnce(Object.assign(new Error('版本冲突'), { code: 409 }))
    const context = { saving: false, $refs: { form: { validate: () => Promise.resolve(true) }}, form: { name: '项目', version: 0 }, entity: { id: '5' }, projectId: '', $emit: jest.fn(), $message: { success: jest.fn() }}
    await dialog.methods.save.call(context)
    expect(context.$emit).toHaveBeenCalledWith('update:visible', false)
    expect(context.$emit).toHaveBeenCalledWith('stale')
    expect(context.$message.success).not.toHaveBeenCalled()
    expect(context.saving).toBe(false)
  })
  it('blocks duplicate saves while asynchronous validation is still pending', async() => {
    let validate
    const context = { saving: false, $refs: { form: { validate: jest.fn(() => new Promise(resolve => { validate = resolve })) }}, form: { code: 'p', name: '项目', owner_user_id: '2' }, entity: null, projectId: '', $emit: jest.fn(), $message: { success: jest.fn() }}
    const first = dialog.methods.save.call(context)
    const duplicate = dialog.methods.save.call(context)
    expect(context.$refs.form.validate).toHaveBeenCalledTimes(1)
    validate(true)
    await Promise.all([first, duplicate])
    expect(request).toHaveBeenCalledTimes(1)
    expect(context.saving).toBe(false)
  })
})
