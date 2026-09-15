const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/user', require('./api/user'))
app.use('/station', require('./api/station'))
app.use('/tool', require('./api/tool'))
app.use('/project', require('./api/project'))

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
