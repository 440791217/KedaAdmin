export const statusLabels = ['未开始', '进行中', '已完成', '已归档']
export const statusTypes = ['info', 'primary', 'success', 'warning']
export function nextStatuses(status) {
  return ({ 0: [1, 3], 1: [2, 3], 2: [1, 3], 3: [] })[status] || []
}
export function entityPayload(form, creating, subproject) {
  const data = { name: form.name.trim(), description: form.description || null }
  if (!subproject) data.customer_name = form.customer_name || null
  if (creating) data.code = form.code
  else data.version = form.version
  if (creating) data.owner_user_id = form.owner_user_id
  return data
}
