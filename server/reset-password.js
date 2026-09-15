const bcrypt = require('bcryptjs')
const pool = require('./db')

async function resetAllPasswords(newPassword = '123456') {
  try {
    const hashed = await bcrypt.hash(newPassword, 10)
    const [result] = await pool.query('UPDATE sys_user SET password_hash=? WHERE is_deleted=0', [hashed])
    console.log(`已将 ${result.affectedRows} 个用户的密码重置为: ${newPassword}`)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

resetAllPasswords(process.argv[2])
