const bcrypt = require('bcryptjs')
const pool = require('./db')

async function initPasswords() {
  try {
    const [rows] = await pool.query('SELECT id, username, password_hash FROM sys_user WHERE is_deleted=0')
    for (const user of rows) {
      const isBcrypt = user.password_hash && user.password_hash.startsWith('$2a$')
      if (!isBcrypt) {
        const hashed = await bcrypt.hash(user.password_hash, 10)
        await pool.query('UPDATE sys_user SET password_hash=? WHERE id=?', [hashed, user.id])
        console.log(`Updated password for user: ${user.username}`)
      } else {
        console.log(`User ${user.username} already has bcrypt password`)
      }
    }
    console.log('Done!')
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

initPasswords()
