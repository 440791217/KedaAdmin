export function createDefaultUserForm() {
  return {
    username: '', password: '', confirmPassword: '', real_name: '',
    card_number: '', team_id: '', avatar_url: '', status: 1, phone: '',
    role_ids: [], version: 0
  }
}
export function createUserRules(isCreate, form) {
  const rules = {
    username: [
      { required: true, message: '请输入登录账号', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_.-]{3,64}$/, message: '账号为3至64位字母、数字、点、下划线或连字符', trigger: 'blur' }
    ],
    real_name: [
      { required: true, whitespace: true, message: '请输入真实姓名', trigger: 'blur' },
      { max: 64, message: '姓名最长64个字符', trigger: 'blur' }
    ],
    phone: [{ max: 20, message: '联系电话最长20个字符', trigger: 'blur' }]
  }
  if (isCreate) {
    rules.password = [
      { required: true, whitespace: true, message: '请输入登录密码', trigger: 'blur' },
      { min: 8, max: 128, message: '密码长度为8至128个字符', trigger: 'blur' }
    ]
    rules.confirmPassword = [
      { required: true, message: '请确认登录密码', trigger: 'blur' },
      { validator: (rule, value, callback) => callback(value === form.password ? undefined : new Error('两次输入的密码不一致')), trigger: 'blur' }
    ]
  }
  return rules
}
function profile(form) {
  return {
    real_name: form.real_name.trim(), card_number: form.card_number.trim() || null,
    team_id: form.team_id || null, avatar_url: form.avatar_url.trim() || null, phone: form.phone.trim() || null
  }
}
export function createUserPayload(form, canAssignRoles = false) {
  const data = { ...profile(form), username: form.username.trim().toLowerCase(), password: form.password, status: form.status }
  if (canAssignRoles && form.role_ids.length) data.role_ids = form.role_ids
  return data
}
export function updateUserPayload(form, canAssignRoles = false) {
  const data = { ...profile(form), version: form.version }
  if (canAssignRoles) data.role_ids = form.role_ids
  return data
}
