import { createDefaultUserForm, createUserPayload, updateUserPayload } from '@/views/user/management/js/user_form'
import { fetchUserList, updateUserStatus, deleteUser, resetUserPassword } from '@/api/user'
import request from '@/utils/request'

jest.mock('@/utils/request', () => jest.fn().mockResolvedValue({ code: 200 }))

describe('user management contract', () => {
  beforeEach(() => jest.clearAllMocks())
  it('preserves disabled status zero and omits empty filters', async() => {
    await fetchUserList({ page: 1, limit: 10, status: 0, username: '', team_id: '' })
    expect(request).toHaveBeenCalledWith({ url: '/user/list', method: 'get', params: { page: 1, limit: 10, status: 0 }})
  })
  it('sends optimistic version for status, delete and password reset', async() => {
    await updateUserStatus('123', 0, 4)
    await deleteUser('123', 4)
    await resetUserPassword('123', 'Next123!', 4)
    expect(request).toHaveBeenNthCalledWith(1, { url: '/user/123/status', method: 'put', data: { status: 0, version: 4 }})
    expect(request).toHaveBeenNthCalledWith(2, { url: '/user/123', method: 'delete', data: { version: 4 }})
    expect(request).toHaveBeenNthCalledWith(3, { url: '/user/123/password', method: 'put', data: { new_password: 'Next123!', version: 4 }})
  })
  it('uses team IDs, normalizes blank optional fields and never sends confirmation or superuser flags', () => {
    const form = { ...createDefaultUserForm(), username: ' Worker ', real_name: ' 姓名 ', password: 'User123!', is_superuser: true }
    const payload = createUserPayload(form)
    expect(payload.username).toBe('worker')
    expect(payload.team_id).toBeNull()
    expect(payload.card_number).toBeNull()
    expect(payload).not.toHaveProperty('is_superuser')
    expect(payload).not.toHaveProperty('confirmPassword')
    expect(payload).not.toHaveProperty('shift_group')
    expect(payload).not.toHaveProperty('role_ids')
  })
  it('keeps status, username and password out of profile editing and includes version', () => {
    const payload = updateUserPayload({ ...createDefaultUserForm(), version: 7, role_ids: ['10'] }, true)
    expect(payload.version).toBe(7)
    expect(payload.role_ids).toEqual(['10'])
    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('password')
    expect(payload).not.toHaveProperty('username')
  })
})
