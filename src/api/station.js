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
    url: '/station',
    method: 'post',
    data
  })
}

export function updateStation(stationId, data) {
  return request({
    url: `/station/${stationId}`,
    method: 'put',
    data
  })
}

export function deleteStation(stationId) {
  return request({
    url: `/station/${stationId}`,
    method: 'delete'
  })
}
