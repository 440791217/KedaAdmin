import request from '@/utils/request'

// 工位列表
export function fetchStationList(query) {
  return request({
    url: '/station/list',
    method: 'get',
    params: query
  })
}

// 新增工位
export function createStation(data) {
  return request({
    url: '/station',
    method: 'post',
    data
  })
}

// 编辑工位
export function updateStation(id, data) {
  return request({
    url: `/station/${id}`,
    method: 'put',
    data
  })
}

// 删除工位
export function deleteStation(id) {
  return request({
    url: `/station/${id}`,
    method: 'delete'
  })
}
