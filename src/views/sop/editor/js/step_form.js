export default {
  name: 'StepForm',
  props: { visible: Boolean, busy: Boolean, step: { type: Object, default: null }},
  data() {
    return { form: {}}
  },
  methods: {
    init() {
      this.form = {
        title: '',
        instruction: '',
        precautions: '',
        check_requirements: '',
        expected_duration_seconds: undefined,
        ...this.step
      }
      this.$nextTick(() => this.$refs.form.clearValidate())
    },
    close(v) {
      if (!this.busy) this.$emit('update:visible', v)
    },
    async save() {
      if (!this.busy && (await this.$refs.form.validate().catch(() => false))) {
        this.$emit('save', {
          title: this.form.title.trim(),
          instruction: this.form.instruction.trim(),
          precautions: this.form.precautions || null,
          check_requirements: this.form.check_requirements || null,
          expected_duration_seconds:
            this.form.expected_duration_seconds == null ? null : this.form.expected_duration_seconds
        })
      }
    }
  }
}
