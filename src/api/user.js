import request from '@/utils/request'

// 登录
export function login(params) {
  return request({
    url: '/user/login',
    method: 'post',
    params
  })
}

// 登出
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

<<<<<<< HEAD
export function getInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

=======
// 用户列表
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
export function fetchUserList(query) {
  return request({
    url: '/auth/user/list',
    method: 'get',
    params: query
  })
}

// 新增用户
export function createUser(data) {
  return request({
    url: '/auth/user',
    method: 'post',
    data
  })
}

// 编辑用户
export function updateUser(id, data) {
  return request({
    url: `/auth/user/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/auth/user/${id}`,
    method: 'delete'
  })
}

<<<<<<< HEAD
export function updateUserStatus(userId, status) {
  return request({
    url: `/auth/user/${userId}/status`,
=======
// 修改用户状态
export function updateUserStatus(id, status) {
  return request({
    url: `/auth/user/${id}/status`,
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
    method: 'put',
    params: { status }
  })
}
