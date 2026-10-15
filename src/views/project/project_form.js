
// 项目表单默认值
export function createDefaultProjectForm() {
  return {
    project_id: '',
    project_name: '',
    manager_name: '',
    job_num: '',
    status: 1,
    description: ''
  }
}

// 项目表单验证规则
export const projectRules = {
  project_id: [
    {
      required: true,
      message: '项目编号不能为空',
      trigger: 'blur'
    }
  ],

  project_name: [
    {
      required: true,
      message: '项目名称不能为空',
      trigger: 'blur'
    }
  ],

  job_num: [
    {
      required: true,
      message: '负责人工号不能为空',
      trigger: 'blur'
    }
  ],

  manager_name: [
    {
      required: true,
      message: '负责人姓名不能为空',
      trigger: 'blur'
    }
  ]
}

// 提交项目数据
export function createProjectPayload(form) {
  return {
    project_id: form.project_id,
    project_name: form.project_name,
    manager_name: form.manager_name,
    job_num: form.job_num,
    status: form.status,
    description: form.description
  }
}
