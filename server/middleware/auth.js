const jwt = require('jsonwebtoken')

const SECRET_KEY = 'sop-admin-secret-key'
const EXPIRES_IN = '7d'

function generateToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY)
  } catch (err) {
    return null
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers['x-token'] || req.headers['X-Token']
  if (!token) {
    return res.json({ code: 50008, message: '未登录，请先登录' })
  }
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.json({ code: 50014, message: '登录已过期，请重新登录' })
  }
  req.user = decoded
  next()
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware
}
