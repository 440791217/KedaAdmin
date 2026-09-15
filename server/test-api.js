const baseUrl = 'http://localhost:3000'

async function test(name, fn) {
  try {
    const result = await fn()
    console.log(`✅ ${name}`)
    return result
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`)
    return null
  }
}

async function post(path, body, headers = {}) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })
  return res.json()
}

async function get(path, headers = {}) {
  const res = await fetch(baseUrl + path, {
    method: 'GET',
    headers
  })
  return res.json()
}

async function runTests() {
  console.log('=== 登录相关 ===')

  // 1. 登录 - 成功
  const loginRes = await test('登录（正确密码）', async () => {
    const res = await post('/user/login', { username: 'admin', password: '123456' })
    if (res.code !== 20000) throw new Error(res.message)
    if (!res.data.token) throw new Error('没有返回 token')
    return res.data.token
  })

  // 2. 登录 - 密码错误
  await test('登录（错误密码）', async () => {
    const res = await post('/user/login', { username: 'admin', password: 'wrongpass' })
    if (res.code === 20000) throw new Error('应该返回错误')
    return 'ok'
  })

  // 3. 登录 - 账号不存在
  await test('登录（账号不存在）', async () => {
    const res = await post('/user/login', { username: 'noexist', password: '123456' })
    if (res.code === 20000) throw new Error('应该返回错误')
    return 'ok'
  })

  if (!loginRes) {
    console.log('\n登录失败，停止测试')
    process.exit(1)
  }

  const token = loginRes
  const authHeaders = { 'X-Token': token }

  console.log('\n=== Token 校验 ===')

  // 4. 不带 token 访问
  await test('不带 token 访问受保护接口', async () => {
    const res = await get('/station/list')
    if (res.code === 20000) throw new Error('应该被拒绝')
    return 'ok'
  })

  // 5. 带 token 访问 user/info
  await test('带 token 获取用户信息', async () => {
    const res = await get('/user/info', authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    if (!res.data.name) throw new Error('没有返回用户名')
    return 'ok'
  })

  console.log('\n=== 工位模块 ===')

  // 6. 工位列表
  const stationData = await test('工位列表', async () => {
    const res = await get('/station/list', authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    if (!Array.isArray(res.data.items)) throw new Error('返回格式不对')
    return res.data.items
  })

  // 7. 新建工位
  const newStation = await test('新建工位', async () => {
    const res = await post('/station/create', {
      stationName: '测试工位-API',
      location: '测试区域',
      ipAddress: '192.168.1.99',
      managerId: 'KD-TEST',
      manager: '测试员',
      status: '运行中'
    }, authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    return res.data
  })

  // 8. 更新工位
  if (newStation) {
    await test('更新工位', async () => {
      const res = await post('/station/update', {
        stationId: newStation.stationId,
        stationName: '测试工位-API-已修改',
        location: '测试区域B',
        ipAddress: '192.168.1.99',
        managerId: 'KD-TEST',
        manager: '测试员',
        status: '维护中'
      }, authHeaders)
      if (res.code !== 20000) throw new Error(res.message)
      return 'ok'
    })

    // 9. 删除工位
    await test('删除工位', async () => {
      const res = await post(`/station/delete?id=${newStation.stationId}`, {}, authHeaders)
      if (res.code !== 20000) throw new Error(res.message)
      return 'ok'
    })
  }

  console.log('\n=== 工具模块 ===')

  // 10. 工具列表
  const toolData = await test('工具列表', async () => {
    const res = await get('/tool/list', authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    if (!Array.isArray(res.data.items)) throw new Error('返回格式不对')
    return res.data.items
  })

  // 11. 新建工具
  const newTool = await test('新建工具', async () => {
    const res = await post('/tool/create', {
      toolName: '测试工具-API',
      boundStationId: 'ST-001',
      boundStationName: '前桥机器人精密压装工位',
      ipAddress: '192.168.1.250',
      managerId: 'KD-TEST',
      manager: '测试员',
      status: '正常启用'
    }, authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    return res.data
  })

  // 12. 更新工具
  if (newTool) {
    await test('更新工具', async () => {
      const res = await post('/tool/update', {
        toolId: newTool.toolId,
        toolName: '测试工具-API-已修改',
        boundStationId: 'ST-002',
        boundStationName: '数字智能扭矩螺栓拧紧工位',
        ipAddress: '192.168.1.250',
        managerId: 'KD-TEST',
        manager: '测试员',
        status: '检测待校准'
      }, authHeaders)
      if (res.code !== 20000) throw new Error(res.message)
      return 'ok'
    })

    // 13. 删除工具
    await test('删除工具', async () => {
      const res = await post(`/tool/delete?id=${newTool.toolId}`, {}, authHeaders)
      if (res.code !== 20000) throw new Error(res.message)
      return 'ok'
    })
  }

  console.log('\n=== 项目模块 ===')

  // 14. 项目列表
  await test('项目列表', async () => {
    const res = await get('/project/list', authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    if (!Array.isArray(res.data.items)) throw new Error('返回格式不对')
    return 'ok'
  })

  // 15. 新建项目
  const newProject = await test('新建项目', async () => {
    const res = await post('/project/create', {
      projectId: 'TEST000001',
      projectName: '测试项目-API',
      manager: '测试员',
      jobNum: 'KD-TEST'
    }, authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    return res.data
  })

  // 16. 删除项目
  if (newProject) {
    await test('删除项目', async () => {
      const res = await post(`/project/delete?id=${newProject.id}`, {}, authHeaders)
      if (res.code !== 20000) throw new Error(res.message)
      return 'ok'
    })
  }

  console.log('\n=== 用户模块 ===')

  // 17. 用户列表
  await test('用户列表', async () => {
    const res = await get('/user/list', authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    if (!Array.isArray(res.data.items)) throw new Error('返回格式不对')
    return 'ok'
  })

  // 18. 新建用户
  const newUser = await test('新建用户', async () => {
    const res = await post('/user/create', {
      username: 'test_api_user',
      password: 'test123456',
      realName: 'API测试用户',
      cardNumber: 'TEST001',
      shiftGroup: '一班组',
      phone: '13900000001',
      status: 1
    }, authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    return res.data
  })

  // 19. 修改用户状态
  if (newUser) {
    await test('修改用户状态', async () => {
      const res = await post(`/user/status?id=${newUser.id}&status=0`, {}, authHeaders)
      if (res.code !== 20000) throw new Error(res.message)
      return 'ok'
    })

    // 20. 删除用户
    await test('删除用户', async () => {
      const res = await post(`/user/delete?id=${newUser.id}`, {}, authHeaders)
      if (res.code !== 20000) throw new Error(res.message)
      return 'ok'
    })
  }

  // 21. 登出
  await test('登出', async () => {
    const res = await post('/user/logout', {}, authHeaders)
    if (res.code !== 20000) throw new Error(res.message)
    return 'ok'
  })

  console.log('\n=== 测试完成 ===')
}

runTests()
