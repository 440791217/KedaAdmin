export default {
  name: 'UserFilter',
  props: {
    query: { type: Object, required: true },
    teams: { type: Array, default: () => [] },
    canCreate: Boolean
  }
}
