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

// 已废弃：登录接口已一次性返回用户信息，无需单独调用
// export function getInfo(token) {
//   return request({
//     url: '/user/info',
//     method: 'get',
//     params: { token }
//   })
// }

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

export function disableUser(userId) {
  return request({
    url: `/auth/user/${userId}/disable`,
    method: 'put'
  })
}

export function enableUser(userId) {
  return request({
    url: `/auth/user/${userId}/enable`,
    method: 'put'
  })
}
