const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const pool = require('../db')
const { generateToken, authMiddleware } = require('../middleware/auth')

function formatRow(row) {
  return {
    id: row.id,
    username: row.username,
    realName: row.real_name,
    cardNumber: row.card_number,
    shiftGroup: row.shift_group,
    avatarUrl: row.avatar_url,
    status: row.status,
    phone: row.phone,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : null
  }
}

// 登录（不需要 token）
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.json({ code: 60204, message: '账号和密码不能为空' })
    }
    const [rows] = await pool.query('SELECT * FROM sys_user WHERE username=? AND is_deleted=0', [username])
    if (rows.length === 0) {
      return res.json({ code: 60204, message: '账号不存在' })
    }
    const user = rows[0]
    if (user.status !== 1) {
      return res.json({ code: 60204, message: '账号已被禁用或离职' })
    }
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.json({ code: 60204, message: '密码错误' })
    }
    const token = generateToken({ id: user.id, username: user.username, realName: user.real_name })
    res.json({ code: 20000, data: { token } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

// 获取用户信息（不需要 token 太严格，兼容前端）
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const user = req.user
    const [rows] = await pool.query('SELECT * FROM sys_user WHERE id=? AND is_deleted=0', [user.id])
    if (rows.length === 0) {
      return res.json({ code: 50008, message: '用户不存在' })
    }
    const u = rows[0]
    res.json({
      code: 20000,
      data: {
        roles: ['admin'],
        introduction: u.real_name,
        avatar: u.avatar_url || 'https://wpimg.wallstcn.com/f778e378-9eb0-4d2f-9a92-8c6e3e3e3e3e.png',
        name: u.real_name
      }
    })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

// 登出
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ code: 20000, data: 'ok' })
})

// ===== 以下接口需要 token =====

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, username, realName, cardNumber, shiftGroup, status } = req.query
    const offset = (page - 1) * limit
    let sql = 'SELECT * FROM sys_user WHERE is_deleted = 0'
    const params = []

    if (username) { sql += ' AND username LIKE ?'; params.push(`%${username}%`) }
    if (realName) { sql += ' AND real_name LIKE ?'; params.push(`%${realName}%`) }
    if (cardNumber) { sql += ' AND card_number LIKE ?'; params.push(`%${cardNumber}%`) }
    if (shiftGroup) { sql += ' AND shift_group = ?'; params.push(shiftGroup) }
    if (status !== '' && status !== undefined) { sql += ' AND status = ?'; params.push(Number(status)) }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const [rows] = await pool.query(sql, params)

    let countSql = 'SELECT COUNT(*) as total FROM sys_user WHERE is_deleted = 0'
    const countParams = []
    if (username) { countSql += ' AND username LIKE ?'; countParams.push(`%${username}%`) }
    if (realName) { countSql += ' AND real_name LIKE ?'; countParams.push(`%${realName}%`) }
    if (cardNumber) { countSql += ' AND card_number LIKE ?'; countParams.push(`%${cardNumber}%`) }
    if (shiftGroup) { countSql += ' AND shift_group = ?'; countParams.push(shiftGroup) }
    if (status !== '' && status !== undefined) { countSql += ' AND status = ?'; countParams.push(Number(status)) }

    const [countResult] = await pool.query(countSql, countParams)

    res.json({ code: 20000, data: { items: rows.map(formatRow), total: countResult[0].total } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { username, password, realName, cardNumber, shiftGroup, avatarUrl, status, phone } = req.body
    if (!username || !password) {
      return res.json({ code: 50000, message: '账号和密码不能为空' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO sys_user (username, password_hash, real_name, card_number, shift_group, avatar_url, status, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashed, realName, cardNumber || null, shiftGroup || null, avatarUrl || null, status ?? 1, phone || null]
    )
    res.json({ code: 20000, data: { id: result.insertId } })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { id, realName, cardNumber, shiftGroup, avatarUrl, status, phone } = req.body
    await pool.query(
      'UPDATE sys_user SET real_name=?, card_number=?, shift_group=?, avatar_url=?, status=?, phone=? WHERE id=? AND is_deleted=0',
      [realName, cardNumber || null, shiftGroup || null, avatarUrl || null, status, phone || null, id]
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
    await pool.query('UPDATE sys_user SET is_deleted=1 WHERE id=?', [id])
    res.json({ code: 20000, data: 'ok' })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

router.post('/status', authMiddleware, async (req, res) => {
  try {
    const { id, status } = req.query
    await pool.query('UPDATE sys_user SET status=? WHERE id=? AND is_deleted=0', [Number(status), id])
    res.json({ code: 20000, data: 'ok' })
  } catch (err) {
    console.error(err)
    res.json({ code: 50000, message: err.message })
  }
})

module.exports = router
