const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')

const STATUS_MAP = { 0: '故障停用', 1: '正常启用', 2: '检测待校准' }
const STATUS_REVERSE = { '故障停用': 0, '正常启用': 1, '检测待校准': 2 }

function formatRow(row) {
  return {
    id: row.id,
    toolId: row.tool_code,
    toolName: row.tool_name,
    boundStationId: row.bound_station_code || '',
    boundStationName: row.bound_station_name || '',
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
    const { toolName, boundStationId, status } = req.query
    let sql = 'SELECT * FROM sop_tool WHERE is_deleted = 0'
    const params = []

    if (toolName) {
      sql += ' AND (tool_name LIKE ? OR tool_code LIKE ?)'
      params.push(`%${toolName}%`, `%${toolName}%`)
    }
    if (boundStationId) { sql += ' AND bound_station_code = ?'; params.push(boundStationId) }
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
    const { toolId, toolName, boundStationId, boundStationName, ipAddress, managerId, manager, status } = req.body
    const code = toolId || 'TL-' + String(Date.now()).slice(-5)
    const [result] = await pool.query(
      'INSERT INTO sop_tool (tool_code, tool_name, bound_station_code, bound_station_name, ip_address, manager_id, manager_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [code, toolName, boundStationId || null, boundStationName || null, ipAddress, managerId, manager, STATUS_REVERSE[status] ?? 1]
    )
    res.json({ code: 20000, data: { id: result.insertId, toolId: code } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { toolId, toolName, boundStationId, boundStationName, ipAddress, managerId, manager, status } = req.body
    await pool.query(
      'UPDATE sop_tool SET tool_name=?, bound_station_code=?, bound_station_name=?, ip_address=?, manager_id=?, manager_name=?, status=? WHERE tool_code=? AND is_deleted=0',
      [toolName, boundStationId || null, boundStationName || null, ipAddress, managerId, manager, STATUS_REVERSE[status] ?? 1, toolId]
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
    await pool.query('UPDATE sop_tool SET is_deleted=1 WHERE tool_code=?', [id])
    res.json({ code: 20000, data: 'ok' })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

module.exports = router
