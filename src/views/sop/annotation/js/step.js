
export function createDefaultStep(data = {}) {
  return {
    id: null,
    value: null,
    label: '',
    name: '',
    desc: '',
    waitTime: 0,
    voiceEnabled: false,
    voiceText: '',
    imageGuide: '',
    textGuide: '',
    regions: [],
    ...data
  }
}

export function createDemoSteps() {
  return [
    createDefaultStep({
      id: 1,
      value: 1,
      label: '步骤1：检查产品位置',
      name: '检查产品位置',
      desc: '确认产品放置到指定工位',
      regions: []
    }),

    createDefaultStep({
      id: 2,
      value: 2,
      label: '步骤2：安装固定螺丝',
      name: '安装固定螺丝',
      desc: '检测螺丝安装数量及状态',
      regions: []
    }),

    createDefaultStep({
      id: 3,
      value: 3,
      label: '步骤3：检查产品标签',
      name: '检查产品标签',
      desc: '确认产品标签完整、清晰',
      regions: []
    })
  ]
}

export const stepRules = {
  waitTime: [{ type: 'number', required: true, min: 0, max: 3600, message: '等待时间应为0到3600秒', trigger: 'change' }],
  voiceText: [{ max: 200, message: '语音提示不能超过200个字符', trigger: 'blur' }],
  textGuide: [{ max: 500, message: '文字引导不能超过500个字符', trigger: 'blur' }],
  name: [
    {
      required: true,
      message: '请输入步骤名称',
      trigger: 'blur'
    },
    {
      min: 2,
      max: 50,
      message: '步骤名称长度为2到50个字符',
      trigger: 'blur'
    }
  ],

  desc: [
    {
      max: 200,
      message: '步骤描述不能超过200个字符',
      trigger: 'blur'
    }
  ]
}

export function createStepLabel(index, name) {
  return `步骤${index + 1}：${name}`
}
