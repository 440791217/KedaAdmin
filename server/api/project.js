const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')

function formatRow(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    jobNum: row.job_num,
    manager: row.manager_name,
    subAssemblyCount: row.sub_assembly_count,
    createTime: row.created_at ? new Date(row.created_at).getTime() : null,
    updateTime: row.updated_at ? new Date(row.updated_at).getTime() : null
  }
}

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { projectId, projectName, manager, jobNum, page = 1, limit = 20, sort } = req.query
    const offset = (page - 1) * limit
    let sql = 'SELECT * FROM sop_project WHERE is_deleted = 0'
    const params = []

    if (projectId) { sql += ' AND project_id LIKE ?'; params.push(`%${projectId}%`) }
    if (projectName) { sql += ' AND project_name LIKE ?'; params.push(`%${projectName}%`) }
    if (manager) { sql += ' AND manager_name LIKE ?'; params.push(`%${manager}%`) }
    if (jobNum) { sql += ' AND job_num LIKE ?'; params.push(`%${jobNum}%`) }

    if (sort) {
      if (sort.includes('gmt_create')) {
        sql += sort.startsWith('-') ? ' ORDER BY created_at DESC' : ' ORDER BY created_at ASC'
      } else if (sort.includes('gmt_modified')) {
        sql += sort.startsWith('-') ? ' ORDER BY updated_at DESC' : ' ORDER BY updated_at ASC'
      }
    } else {
      sql += ' ORDER BY created_at DESC'
    }

    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const [rows] = await pool.query(sql, params)

    let countSql = 'SELECT COUNT(*) as total FROM sop_project WHERE is_deleted = 0'
    const countParams = []
    if (projectId) { countSql += ' AND project_id LIKE ?'; countParams.push(`%${projectId}%`) }
    if (projectName) { countSql += ' AND project_name LIKE ?'; countParams.push(`%${projectName}%`) }
    if (manager) { countSql += ' AND manager_name LIKE ?'; countParams.push(`%${manager}%`) }
    if (jobNum) { countSql += ' AND job_num LIKE ?'; countParams.push(`%${jobNum}%`) }

    const [countResult] = await pool.query(countSql, countParams)

    res.json({ code: 20000, data: { items: rows.map(formatRow), total: countResult[0].total } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { projectId, projectName, manager, jobNum } = req.body
    const [result] = await pool.query(
      'INSERT INTO sop_project (project_id, project_name, job_num, manager_name) VALUES (?, ?, ?, ?)',
      [projectId, projectName, jobNum, manager]
    )
    res.json({ code: 20000, data: { id: result.insertId } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { id, projectName, manager, jobNum } = req.body
    await pool.query(
      'UPDATE sop_project SET project_name=?, job_num=?, manager_name=? WHERE id=? AND is_deleted=0',
      [projectName, jobNum, manager, id]
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
    await pool.query('UPDATE sop_project SET is_deleted=1 WHERE id=?', [id])
    res.json({ code: 20000, data: 'ok' })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

module.exports = router
