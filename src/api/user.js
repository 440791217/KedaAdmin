import request from '@/utils/request'

export function login(params) {
  return request({
    url: '/user/login',
    method: 'post',
    params
  })
}

export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

export function getInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

export function fetchUserList(query) {
  return request({
    url: '/auth/user/list',
    method: 'get',
    params: query
  })
}

export function createUser(data) {
  return request({
    url: '/auth/user',
    method: 'post',
    data
  })
}

export function updateUser(userId, data) {
  return request({
    url: `/auth/user/${userId}`,
    method: 'put',
    data
  })
}

export function deleteUser(userId) {
  return request({
    url: `/auth/user/${userId}`,
    method: 'delete'
  })
}

export function updateUserStatus(userId, status) {
  return request({
    url: `/auth/user/${userId}/status`,
    method: 'put',
    params: { status }
  })
}
