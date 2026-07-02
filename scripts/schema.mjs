// Shared entry schema + a dependency-free validator.
// Keeping this zero-dependency means `npm ci` stays lean in CI.

const TYPES = new Set(['rating', 'enforcement'])
const METRIC_KINDS = new Set(['percent', 'stars'])

export function validateEntry(e) {
  const errors = []
  if (!e || typeof e !== 'object') return ['not an object']
  if (!e.id || typeof e.id !== 'string') errors.push('missing id')
  if (!e.name || typeof e.name !== 'string') errors.push('missing name')
  if (!e.area || typeof e.area !== 'string') errors.push('missing area')
  if (!TYPES.has(e.type)) errors.push(`type must be one of ${[...TYPES].join(' / ')}`)
  if (!e.inspectedOn || !/^\d{4}-\d{2}-\d{2}$/.test(e.inspectedOn))
    errors.push('inspectedOn must be YYYY-MM-DD')
  if (e.metric != null) {
    if (!METRIC_KINDS.has(e.metric.kind)) errors.push('metric.kind must be percent / stars')
    if (e.metric.value != null && typeof e.metric.value !== 'number')
      errors.push('metric.value must be a number or null')
  }
  if (!e.source || typeof e.source !== 'string') errors.push('missing source')
  return errors
}
