import FrameRateFields from '@/shared/resource/components/FrameRateFields.vue'
import StationTasks from '../components/StationTasks.vue'
import ConnectionFields from '@/shared/resource/components/ConnectionFields.vue'
import {
  transportLabels,
  newConnection,
  readConnection,
  connectionPayload,
  connectionError
} from '@/shared/resource/js/connection_helpers'
import Pagination from '@/components/Pagination'
import ScannerInput from '../components/ScannerInput.vue'
import {
  fetchResources,
  fetchResource,
  saveResource,
  removeResource,
  fetchResourceOwners,
  previewDevice
} from '@/api/resource'
import { createBusinessCode } from '@/utils/business_code'
export default {
  name: 'ResourcePage',
  components: { FrameRateFields, StationTasks, Pagination, ScannerInput, ConnectionFields },
  props: {
    kind: { type: String, required: true },
    title: { type: String, required: true }
  },
  data() {
    return {
      transportLabels,
      items: [],
      total: 0,
      query: { page: 1, limit: 20, keyword: '', status: null },
      loading: false,
      busy: false,
      failed: false,
      failureMessage: '',
      failureHint: '',
      canManage: false,
      dialog: false,
      details: false,
      detail: null,
      cameraPreviewUrl: '',
      cameraPreviewBusy: false,
      cameraPreviewSequence: 0,
      form: {},
      models: [],
      stations: [],
      locations: [],
      locationSequence: 0,
      locationLoading: false,
      owners: [],
      sequence: 0,
      statuses: ['可用', '维护中', '停用'],
      types: [
        { value: 'camera', label: '摄像头' },
        { value: 'scanner', label: '扫码枪' },
        { value: 'welding_gun', label: '电焊枪' },
        { value: 'measuring_tool', label: '量具' },
        { value: 'other', label: '其他' }
      ]
    }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    ++this.sequence
    ++this.locationSequence
    this.releaseCameraPreview()
  },
  watch: { details(value) { if (!value) this.releaseCameraPreview() } },
  methods: {
    releaseCameraPreview() {
      ++this.cameraPreviewSequence
      if (this.cameraPreviewUrl) URL.revokeObjectURL(this.cameraPreviewUrl)
      this.cameraPreviewUrl = ''
      this.cameraPreviewBusy = false
    },
    rtspAddress(connection) {
      const address = readConnection(connection).rtsp_url
      if (!address) return ''
      try { const url = new URL(address); url.username = ''; url.password = ''; return url.toString() } catch (e) { return '地址格式不正确' }
    },
    search() {
      this.query.page = 1
      this.load()
    },
    async load() {
      const seq = ++this.sequence
      this.loading = true
      this.failed = false
      this.failureMessage = ''
      this.failureHint = ''
      try {
        const { data } = await fetchResources(this.kind, {
          ...this.query,
          status: this.query.status === '' ? null : this.query.status
        })
        if (seq === this.sequence) {
          this.items = data.items
          this.total = data.total
          this.canManage = data.can_manage
        }
      } catch (e) {
        if (seq === this.sequence) {
          this.items = []
          this.total = 0
          this.canManage = false
          this.failed = true
          const code = e.code || (e.response && e.response.status)
          this.failureMessage = `${e.message || '资源加载失败'}${
            code ? `（${code}）` : ''
          }`
          const hints = {
            403: '当前账号缺少现场资源查询权限。普通账号需分配资源角色后重新登录；root无需分配。',
            404: '资源接口不存在，请确认后端已重启并加载本次新增代码。',
            500: '请查看后端终端此请求的异常原因；若提示表不存在，核对资源建表及位置/IP升级脚本是否执行在后端所连接的数据库。'
          }
          this.failureHint = `请求：/resource/${this.kind}。${
            hints[code] || '请确认后端服务及网络连接正常后重试。'
          }`
        }
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    async searchModels(keyword) {
      const { data } = await fetchResources('model', {
        limit: 100,
        keyword,
        status: 0
      })
      this.models = data.items
    },
    async searchStations(keyword) {
      const { data } = await fetchResources('station', {
        limit: 100,
        keyword,
        status: 0
      })
      this.stations = data.items
    },
    async searchLocations(keyword) {
      const seq = ++this.locationSequence
      this.locationLoading = true
      try {
        const { data } = await fetchResources('location', {
          keyword,
          status: 0,
          limit: 100
        })
        if (seq === this.locationSequence) this.locations = data.items
      } catch (e) {
        /* request reports */
      } finally {
        if (seq === this.locationSequence) this.locationLoading = false
      }
    },
    async searchOwners(keyword) {
      const { data } = await fetchResourceOwners(keyword)
      this.owners = data
    },
    async open(originalRow) {
      this.busy = true
      try {
        const row = this.kind === 'device' && originalRow
          ? (await fetchResource('device', originalRow.id)).data
          : originalRow
        this.form = row
          ? { ...row }
          : {
            code: createBusinessCode(
              {
                location: 'LOC',
                station: 'STA',
                model: 'TMD',
                device: 'TOL'
              }[this.kind]
            ),
            name: '',
            status: 0,
            description: '',
            type_code: 'other',
            unit: '件',
            model_id: null,
            station_id: null,
            owner_user_id: null,
            location_id: null,
            ip_address: ''
          }
        if (this.kind === 'device') {
          this.$set(this.form, 'frame_rates', row && row.frame_rates ? { ...row.frame_rates } : { refresh_fps: null, detect_fps: null })
          this.$set(
            this.form,
            'connection',
            readConnection(row && row.connection)
          )
        }
        if (this.kind === 'station' || this.kind === 'device') {
          await this.searchOwners('')
        }
        if (this.kind === 'station') {
          await this.searchLocations('')
          if (
            row &&
            row.location_id &&
            !this.locations.some((l) => l.id === row.location_id)
          ) {
            const { data } = await fetchResource('location', row.location_id)
            this.locations.push(data)
          }
        }
        if (this.kind === 'device') {
          await Promise.all([this.searchModels(''), this.searchStations('')])
          if (
            row &&
            row.model_id &&
            !this.models.some((m) => m.id === row.model_id)
          ) {
            const { data } = await fetchResource('model', row.model_id)
            this.models.push(data)
          }
          if (
            row &&
            row.station_id &&
            !this.stations.some((s) => s.id === row.station_id)
          ) {
            const { data } = await fetchResource('station', row.station_id)
            this.stations.push(data)
          }
        }
        this.dialog = true
      } catch (e) {
        /* request reports */
      } finally {
        this.busy = false
      }
    },
    modelChanged() {
      if (this.form.id || this.form.connection.transport !== 'none') return
      const model = this.models.find((m) => m.id === this.form.model_id)
      if (model && ['camera', 'scanner'].includes(model.type_code)) {
        this.form.connection = newConnection(
          model.type_code === 'camera' ? 'network' : 'usb'
        )
      }
    },
    connectionAddress(row) {
      if (row.transport === 'network') {
        const host = row.connection_host || ''
        if (row.protocol === 'rtsp' && host) return `rtsp://${host.includes(':') ? '[' + host + ']' : host}:${row.connection_port || 554}${row.connection_path || ''}`
        return host
          ? `${host.includes(':') ? '[' + host + ']' : host}${
            row.connection_port ? ':' + row.connection_port : ''
          }`
          : '未填写'
      }
      if (['usb', 'serial'].includes(row.transport)) {
        return (
          [row.host_key, row.device_key].filter(Boolean).join(' / ') || '未填写'
        )
      }
      return row.transport === 'none' ? '无需地址' : '未配置'
    },
    async save() {
      if (this.busy) return
      if (!this.form.name || !this.form.name.trim()) {
        return this.$message.warning('请填写名称')
      }
      if (this.kind === 'station' && !this.form.location_id) {
        return this.$message.warning('请选择位置')
      }
      if (
        this.kind === 'station' &&
        (!this.form.ip_address || !this.form.ip_address.trim())
      ) {
        return this.$message.warning('请填写工位IP地址')
      }
      if (this.kind === 'device') {
        if (!this.form.model_id) return this.$message.warning('请选择设备规格')
        const error = connectionError(this.form.connection)
        if (error) return this.$message.warning(error)
      }
      this.busy = true
      try {
        const saved = await saveResource(this.kind, {
          ...this.form,
          ...(this.kind === 'device'
            ? { connection: connectionPayload(this.form.connection) }
            : {}),
          station_id: this.form.station_id || null,
          location_id: this.form.location_id || null,
          ip_address: this.form.ip_address ? this.form.ip_address.trim() : null,
          owner_user_id: this.form.owner_user_id || null
        })
        if (this.kind === 'device' && this.form.connection.transport === 'network' && this.form.connection.protocol === 'rtsp') {
          // Read through the API again; old backend versions may silently ignore rtsp_url.
          this.$set(this.form, 'id', saved.data.id)
          this.$set(this.form, 'version', saved.data.version)
          const { data } = await fetchResource('device', saved.data.id)
          this.$set(this.form, 'version', data.version)
          if (!data.connection || data.connection.rtsp_url !== this.form.connection.rtsp_url.trim()) {
            this.$message.error('完整RTSP地址未保存到数据库，请重启后端加载最新代码后重试')
            return
          }
        }
        this.dialog = false
        this.$message.success('已保存')
        await this.load()
      } catch (e) {
        /* preserve form */
      } finally {
        this.busy = false
      }
    },
    async command(action, row) {
      if (this.busy) return
      if (action === 'edit' || action === 'connection') return this.open(row)
      if (action === 'delete') {
        try {
          await this.$confirm(
            '确认删除“' + row.name + '”？有业务引用时无法删除。',
            '删除确认',
            { type: 'warning' }
          )
          this.busy = true
          await removeResource(this.kind, row)
          await this.load()
        } catch (e) {
          /* cancelled or reported */
        } finally {
          this.busy = false
        }
        return
      }
      this.busy = true
      try {
        const { data } = await fetchResource(this.kind, row.id)
        this.releaseCameraPreview()
        this.detail = data
        this.details = true
      } catch (e) {
        /* reported */
      } finally {
        this.busy = false
      }
    },
    async preview() {
      if (this.cameraPreviewBusy) return
      const seq = ++this.cameraPreviewSequence
      this.cameraPreviewBusy = true
      try {
        const blob = await previewDevice(this.detail.id)
        if (seq !== this.cameraPreviewSequence) return
        if (this.cameraPreviewUrl) URL.revokeObjectURL(this.cameraPreviewUrl)
        this.cameraPreviewUrl = URL.createObjectURL(blob)
        this.$message.success('连接成功，已获取摄像头画面')
      } catch (e) {
        /* reported */
      } finally {
        if (seq === this.cameraPreviewSequence) this.cameraPreviewBusy = false
      }
    }
  }
}

