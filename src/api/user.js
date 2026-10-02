import request from '@/utils/request'

export function login(data) {
  return request({
    // url: '/vue-element-admin/user/login',
    url: '/test/time',
    method: 'get',
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/vue-element-admin/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/vue-element-admin/user/logout',
    method: 'post'
  })
}

// 用户管理模块
export function fetchUserList(query) {
  return request({
    url: '/sys/user/list',
    method: 'get',
    params: query
  })
}

export function createUser(data) {
  return request({
    url: '/sys/user',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/sys/user/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/sys/user/${id}`,
    method: 'delete'
  })
}
