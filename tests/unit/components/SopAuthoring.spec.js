import Vue from 'vue'
import ElementUI from 'element-ui'
import { createLocalVue, mount } from '@vue/test-utils'
import Authoring from '@/views/sop/editor/index.vue'
import VisualCanvas from '@/shared/sop/components/VisualCanvas.vue'
import ProjectAssociation from '@/views/sop/editor/components/ProjectAssociation.vue'
import request from '@/utils/request'
jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue(); localVue.use(ElementUI)
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve(); await Vue.nextTick() }
const image = () => ({ id: '10', file_id: '11', original_name: 'reference.png', visual: null })
const revision = () => ({ id: '8', title: '维护SOP', status: 0, version: 2, revision_no: 1, steps: [{ id: '9', title: '准备', instruction: '按图操作', version: 0, attachments: [image()] }] })
const document = () => ({ id: '7', code: 'SOP-TEST', name: '维护', managing_project_name: '管理项目', can_edit: true, can_publish: true })
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
let wrappers; let value
it('uploads a camera photo through the existing step image API and selects the new attachment', async() => {
  const w = page(Authoring); await flush()
  const r = revision(); r.version = 3; r.steps[0].attachments.push({ id: '12', file_id: '13', original_name: 'camera.jpg', visual: null })
  request.mockImplementation(c => c.responseType === 'blob' ? Promise.resolve(new Blob(['jpeg'])) : Promise.resolve({ data: r }))
  const job = { file: new File(['jpeg'], 'camera.jpg', { type: 'image/jpeg' }), onSuccess: jest.fn(), onError: jest.fn() }
  await w.vm.useCameraImage(job); await flush()
  const upload = request.mock.calls.find(([c]) => c.url === '/sop/7/version/8/step/9/image')[0]
  expect(upload.data.get('file')).toBe(job.file); expect(upload.data.get('version')).toBe('2')
  expect(w.vm.currentImageId).toBe('12'); expect(w.vm.activeStep.attachments).toHaveLength(2)
  expect(job.onSuccess).toHaveBeenCalled(); expect(job.onError).not.toHaveBeenCalled()
})
it('preserves the current image on failed camera upload and blocks unsaved annotations', async() => {
  const w = page(Authoring); await flush(); request.mockClear(); request.mockRejectedValueOnce(new Error('upload failed'))
  const job = { file: new File(['jpeg'], 'camera.jpg', { type: 'image/jpeg' }), onSuccess: jest.fn(), onError: jest.fn() }
  await w.vm.useCameraImage(job)
  expect(w.vm.currentImageId).toBe('10'); expect(job.onError).toHaveBeenCalled(); expect(job.onSuccess).not.toHaveBeenCalled()
  request.mockClear(); w.vm.work.step.instruction = '未保存'; await w.vm.useCameraImage(job)
  expect(request).not.toHaveBeenCalled()
})
function page(component, propsData = {}, extra = {}) { const w = mount(component, { localVue, sync: false, propsData, mocks: { $route: { params: { sopId: '7', revisionId: '8' }, query: {}, fullPath: '/sop/7/version/8/edit' }, $router: { push: jest.fn().mockResolvedValue() }, $confirm: jest.fn().mockResolvedValue(), $message: { success: jest.fn(), error: jest.fn() }}, stubs: { transition: true, 'transition-group': true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }, ...extra }); wrappers.push(w); return w }
beforeEach(() => { wrappers = []; value = 0; request.mockReset(); URL.createObjectURL = jest.fn().mockReturnValue('blob:reference'); URL.revokeObjectURL = jest.fn(); Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: a => a.fill(++value) }}); request.mockImplementation(c => { if (c.responseType === 'blob') return Promise.resolve(new Blob(['png'])); if (c.url === '/sop/7') return Promise.resolve({ data: document() }); return Promise.resolve({ data: revision() }) }) })
afterEach(() => { wrappers.forEach(w => w.destroy()); if (originalCrypto)Object.defineProperty(window, 'crypto', originalCrypto); else delete window.crypto })
describe('unified SOP authoring', () => {
  it('renders published task content in the same three-column workspace without source requests or mutations', async() => {
    const r = revision(); r.status = 1
    const w = page(Authoring, { embedded: true, viewOnly: true, contentSopId: '7', contentRevisionId: '8', previewRevision: r, taskContext: { project_id: '1', subproject_id: '2', task_id: '5', task_content: '1', image_mode: 'task', name: '任务甲' }}); await flush(); expect(w.vm.editable).toBe(false); expect(w.find('.authoring-columns').exists()).toBe(true); expect(request.mock.calls.some(([c]) => c.url.startsWith('/sop/'))).toBe(false); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/2/task/5/image/11' })); request.mockClear(); await w.vm.saveAll(); expect(request).not.toHaveBeenCalled()
  })

  it('publishes and applies in a single task request with both captured versions', async() => {
    const w = page(Authoring); await flush(); w.vm.$route.query = { project_id: '1', subproject_id: '2', task_id: '5', task_version: '3' }; request.mockClear(); await w.vm.publishAndUse(); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/2/task/5/publish', method: 'put', data: { sop_id: '7', revision_id: '8', revision_version: 2, task_version: 3 }})); expect(w.vm.$router.push).toHaveBeenCalledWith('/project/1/subproject/2/task/5')
  })
  it('keeps authoring open without success when publish-and-use fails', async() => {
    const w = page(Authoring); await flush(); w.vm.$route.query = { project_id: '1', subproject_id: '2', task_id: '5', task_version: '3' }; request.mockRejectedValueOnce({ code: 409 }); await w.vm.publishAndUse(); expect(w.vm.$router.push).not.toHaveBeenCalled(); expect(w.vm.$message.success).not.toHaveBeenCalled(); expect(w.vm.revision.status).toBe(0)
  })

  it('requires a station before opening the camera and does not start unsolicited streams', async() => { const w = page(Authoring); await flush(); expect(w.find('.authoring-columns').exists()).toBe(true); expect(w.text()).toContain('请先关联工位'); expect(w.text()).toContain('管理项目'); expect(w.vm.dirty).toBe(false); expect(request.mock.calls.some(([c]) => /camera|rtsp/.test(c.url))).toBe(false) })
  it('saves header, step configuration and normalized marks in one request', async() => {
    const w = page(Authoring); await flush(); w.vm.dimensions({ width: 640, height: 480 }); expect(w.vm.dirty).toBe(false)
    w.vm.work.step.detection_wait_seconds = 3; w.vm.work.step.voice_enabled = true; w.vm.work.step.voice_text = '检查底图'
    w.vm.createMark({ kind: 'rect', x: 0.1, y: 0.2, width: 0.3, height: 0.4 }); await flush(); expect(w.vm.dirty).toBe(true)
    const saved = revision(); saved.version = 3; saved.steps[0] = { ...saved.steps[0], ...w.vm.work.step, version: 1, attachments: [{ ...image(), visual: JSON.parse(JSON.stringify(w.vm.visual)) }] }
    request.mockImplementationOnce(() => Promise.resolve({ data: saved })); await w.vm.saveAll(); await flush()
    const sent = request.mock.calls.map(([c]) => c).find(c => c.url.endsWith('/authoring'))
    expect(sent.method).toBe('put'); expect(sent.data.step).toEqual(expect.objectContaining({ version: 0, revision_version: 2, detection_wait_seconds: 3, voice_text: '检查底图' })); expect(sent.data.visuals[0].guide_items[0]).toEqual(expect.objectContaining({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 })); expect(sent.data.revision.version).toBe(2); expect(w.vm.dirty).toBe(false)
  })
  it('keeps local marks after a conflicting save and never silently reloads them away', async() => { const w = page(Authoring); await flush(); w.vm.dimensions({ width: 640, height: 480 }); w.vm.createMark({ kind: 'rect', x: 0.1, y: 0.1, width: 0.2, height: 0.2 }); const snapshot = JSON.stringify(w.vm.work); request.mockClear(); request.mockRejectedValueOnce({ code: 409 }); await w.vm.saveAll(); await flush(); expect(w.vm.stale).toBe(true); expect(JSON.stringify(w.vm.work)).toBe(snapshot); expect(request).toHaveBeenCalledTimes(1); expect(w.text()).toContain('本地修改仍保留') })
  it('supports detection configuration and undo without mutating the loaded version', async() => { const w = page(Authoring); await flush(); w.vm.dimensions({ width: 640, height: 480 }); w.vm.markMode = 'detect'; w.vm.createMark({ kind: 'rect', x: 0.1, y: 0.1, width: 0.2, height: 0.2 }); expect(w.vm.visual.detection_regions[0].detect_type).toBe('object'); expect(w.vm.revision.steps[0].attachments[0].visual).toBeNull(); w.vm.undo(); expect(w.vm.items).toHaveLength(0); expect(w.vm.dirty).toBe(false) })
  it('shows published marks read-only without a direct project association entry', async() => { const r = revision(); r.status = 1; request.mockImplementation(c => c.responseType === 'blob' ? Promise.resolve(new Blob(['png'])) : Promise.resolve({ data: c.url === '/sop/7' ? document() : r })); const w = page(Authoring); await flush(); expect(w.vm.editable).toBe(false); expect(w.text()).not.toContain('关联项目'); w.vm.createMark({ kind: 'rect', x: 0, y: 0, width: 0.2, height: 0.2 }); expect(w.vm.items).toHaveLength(0); request.mockClear(); await w.vm.saveAll(); expect(request).not.toHaveBeenCalled() })
  it('draws and moves on original-image ratios regardless of display dimensions', async() => { const w = page(VisualCanvas, { src: 'blob:image', width: 800, height: 400, tool: 'rect' }); w.vm.$refs.svg.getBoundingClientRect = () => ({ left: 10, top: 20, width: 400, height: 200 }); w.vm.start({ button: 0, clientX: 50, clientY: 60 }, null); w.vm.move({ clientX: 210, clientY: 160 }); w.vm.end(); expect(w.emitted('create')[0][0]).toEqual({ kind: 'rect', x: 0.1, y: 0.2, width: 0.4, height: 0.49999999999999994 }); await w.setProps({ tool: 'select' }); const item = { id: 'r', kind: 'rect', x: 0.1, y: 0.2, width: 0.4, height: 0.5 }; w.vm.start({ button: 0, clientX: 50, clientY: 60 }, item); w.vm.move({ clientX: 500, clientY: 500 }); const moved = w.emitted('update')[0][0]; expect(moved.x + moved.width).toBeCloseTo(1); expect(moved.y + moved.height).toBeCloseTo(1) })
  it('associates the exact published revision and updates an existing binding', async() => { const w = page(ProjectAssociation, { visible: false, document: document(), revision: { ...revision(), status: 1 }}); w.vm.projectId = '20'; w.vm.target = { can_manage: true, target_version: 5, items: [{ id: '21', sop_id: '7', version: 2 }] }; request.mockResolvedValueOnce({ data: {}}); await w.vm.save(); expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/20/sop/21', method: 'put', data: { sop_id: '7', revision_id: '8', target_version: 5, version: 2 }})); expect(w.emitted('update:visible')[0]).toEqual([false]) })
})

it('saves dragged step order with the captured revision version and preserves the selected step', async() => {
  const w = page(Authoring); await flush(); const r = revision(); r.steps.push({ id: '12', title: '检查', instruction: '复核产品', version: 0, attachments: [] }); w.vm.accept(r); await flush(); request.mockClear()
  const saved = { ...r, version: 3, steps: [r.steps[1], r.steps[0]] }; request.mockResolvedValueOnce({ data: saved })
  await w.vm.reorderSteps([r.steps[1], r.steps[0]]); await flush()
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/sop/7/version/8/step/sort', method: 'put', data: { ids: ['12', '9'], version: 2 }}))
  expect(w.vm.revision.steps.map(s => s.id)).toEqual(['12', '9']); expect(w.vm.currentStepId).toBe('9')
})
it('retains the loaded order on a failed drag save and blocks unsaved or conflicting changes', async() => {
  const w = page(Authoring); await flush(); const r = revision(); r.steps.push({ id: '12', title: '检查', instruction: '复核产品', version: 0, attachments: [] }); w.vm.accept(r); await flush(); request.mockClear()
  w.vm.work.step.instruction = '未保存'; await w.vm.reorderSteps([r.steps[1], r.steps[0]]); expect(request).not.toHaveBeenCalled()
  w.vm.accept(r); await flush(); request.mockClear(); request.mockRejectedValueOnce({ code: 409 }); await w.vm.reorderSteps([r.steps[1], r.steps[0]])
  expect(w.vm.revision.steps.map(s => s.id)).toEqual(['9', '12']); expect(w.vm.stale).toBe(true)
})

