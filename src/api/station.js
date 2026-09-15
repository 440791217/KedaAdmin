import request from '@/utils/request'

export function fetchStationList(query) {
  return request({
    url: '/station/list',
    method: 'get',
    params: query
  })
}

export function createStation(data) {
  return request({
    url: '/station/create',
    method: 'post',
    data
  })
}

export function updateStation(data) {
  return request({
    url: '/station/update',
    method: 'post',
    data
  })
}

export function deleteStation(id) {
  return request({
    url: '/station/delete',
    method: 'post',
    params: { id }
  })
}
