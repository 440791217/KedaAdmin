
export function createDefaultUserForm() {
  return {
    username: '',
    password: '',
    confirmPassword: '',
    real_name: '',
    card_number: '',
    shift_group: '',
    avatar_url: '',
    status: 1,
    phone: ''
  }
}

export function createUserRules(isCreate, form) {
  const rules = {
    username: [
      {
        required: true,
        message: '请输入登录账号',
        trigger: 'blur'
      },
      {
        min: 3,
        max: 64,
        message: '账号长度为3-64个字符',
        trigger: 'blur'
      }
    ],

    real_name: [
      {
        required: true,
        message: '请输入真实姓名',
        trigger: 'blur'
      }
    ],

    phone: [
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur'
      }
    ]
  }

  if (isCreate) {
    rules.password = [
      {
        required: true,
        message: '请输入登录密码',
        trigger: 'blur'
      },
      {
        min: 6,
        message: '密码长度不能少于6位',
        trigger: 'blur'
      }
    ]

    rules.confirmPassword = [
      {
        required: true,
        message: '请确认登录密码',
        trigger: 'blur'
      },
      {
        validator: (rule, value, callback) => {
          if (value !== form.password) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  return rules
}

export function createUserPayload(form) {
  return {
    username: form.username,
    password: form.password,
    real_name: form.real_name,
    card_number: form.card_number,
    shift_group: form.shift_group,
    avatar_url: form.avatar_url,
    status: form.status,
    phone: form.phone
  }
}

export function updateUserPayload(form) {
  return {
    real_name: form.real_name,
    card_number: form.card_number,
    shift_group: form.shift_group,
    avatar_url: form.avatar_url,
    status: form.status,
    phone: form.phone
  }
}
