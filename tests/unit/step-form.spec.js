import form from '@/views/sop/editor/js/step_form'

function editor(step = null) {
  const vm = { step, busy: false, $emit: jest.fn(), $nextTick: callback => callback(), $refs: { form: { clearValidate: jest.fn(), validate: jest.fn().mockResolvedValue(true) }}}
  form.methods.init.call(vm)
  return vm
}

it('enables voice for a new step and uses the operation instructions by default', async() => {
  const vm = editor()
  expect(vm.form.voice_enabled).toBe(true)
  vm.form.title = '检查杯子'
  vm.form.instruction = '请将杯子放入指定区域。'
  await form.methods.save.call(vm)
  expect(vm.$emit).toHaveBeenCalledWith('save', expect.objectContaining({ voice_enabled: true, voice_text: '请将杯子放入指定区域。' }))
})

it('preserves an existing step whose voice was explicitly disabled', async() => {
  const vm = editor({ title: '检查', instruction: '操作说明', voice_enabled: 0, voice_text: '已有语音内容' })
  await form.methods.save.call(vm)
  expect(vm.$emit).toHaveBeenCalledWith('save', expect.objectContaining({ voice_enabled: false, voice_text: '已有语音内容' }))
})
