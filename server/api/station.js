const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')

const STATUS_MAP = { 0: '已停用', 1: '运行中', 2: '维护中' }
const STATUS_REVERSE = { '已停用': 0, '运行中': 1, '维护中': 2 }

function formatRow(row) {
  return {
    id: row.id,
    stationId: row.station_code,
    stationName: row.station_name,
    location: row.location,
    ipAddress: row.ip_address,
    managerId: row.manager_id,
    manager: row.manager_name,
    status: STATUS_MAP[row.status] || '未知',
    createDate: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '',
    createClock: row.created_at ? new Date(row.created_at).toTimeString().slice(0, 8) : '',
    updateDate: row.updated_at ? new Date(row.updated_at).toISOString().slice(0, 10) : '',
    updateClock: row.updated_at ? new Date(row.updated_at).toTimeString().slice(0, 8) : ''
  }
}

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { stationName, ipAddress, status } = req.query
    let sql = 'SELECT * FROM sop_station WHERE is_deleted = 0'
    const params = []

    if (stationName) {
      sql += ' AND (station_name LIKE ? OR station_code LIKE ?)'
      params.push(`%${stationName}%`, `%${stationName}%`)
    }
    if (ipAddress) { sql += ' AND ip_address LIKE ?'; params.push(`%${ipAddress}%`) }
    if (status) { sql += ' AND status = ?'; params.push(STATUS_REVERSE[status] ?? -1) }

    sql += ' ORDER BY created_at DESC'
    const [rows] = await pool.query(sql, params)

    res.json({ code: 20000, data: { items: rows.map(formatRow), total: rows.length } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { stationId, stationName, location, ipAddress, managerId, manager, status } = req.body
    const code = stationId || 'ST-' + String(Date.now()).slice(-6)
    const [result] = await pool.query(
      'INSERT INTO sop_station (station_code, station_name, location, ip_address, manager_id, manager_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, stationName, location, ipAddress, managerId, manager, STATUS_REVERSE[status] ?? 1]
    )
    res.json({ code: 20000, data: { id: result.insertId, stationId: code } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { stationId, stationName, location, ipAddress, managerId, manager, status } = req.body
    await pool.query(
      'UPDATE sop_station SET station_name=?, location=?, ip_address=?, manager_id=?, manager_name=?, status=? WHERE station_code=? AND is_deleted=0',
      [stationName, location, ipAddress, managerId, manager, STATUS_REVERSE[status] ?? 1, stationId]
    )
    res.json({ code: 20000, data: 'ok' })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/delete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.query
    await pool.query('UPDATE sop_station SET is_deleted=1 WHERE station_code=?', [id])
    res.json({ code: 20000, data: 'ok' })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

module.exports = router
