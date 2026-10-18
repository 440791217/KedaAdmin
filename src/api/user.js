import request from '@/utils/request'

// 已实现的认证接口
export function login(data) {
  return request({ url: '/user/auth/login', method: 'post', data })
}
export function logout() {
  return request({ url: '/user/auth/logout', method: 'post' })
}
export function getInfo() {
  return request({ url: '/user/me', method: 'get' })
}
export function changePassword(data) {
  return request({ url: '/user/me/password', method: 'put', data })
}

// 用户管理接口
export function fetchUserList(query) {
  const params = Object.keys(query).reduce((result, key) => {
    if (query[key] !== '' && query[key] !== null && query[key] !== undefined) result[key] = query[key]
    return result
  }, {})
  return request({ url: '/user/list', method: 'get', params })
}
export function fetchUser(id) {
  return request({ url: `/user/${id}`, method: 'get' })
}
export function fetchTeamOptions() {
  return request({ url: '/user/team/options', method: 'get' })
}
export function fetchRoleOptions() {
  return request({ url: '/user/role/options', method: 'get' })
}
export function resetUserPassword(id, new_password, version) {
  return request({ url: `/user/${id}/password`, method: 'put', data: { new_password, version }})
}
export function createUser(data) {
  return request({ url: '/user', method: 'post', data })
}
export function updateUser(id, data) {
  return request({ url: `/user/${id}`, method: 'put', data })
}
export function deleteUser(id, version) {
  return request({ url: `/user/${id}`, method: 'delete', data: { version }})
}
export function updateUserStatus(userId, status, version) {
  return request({ url: `/user/${userId}/status`, method: 'put', data: { status, version }})
}
