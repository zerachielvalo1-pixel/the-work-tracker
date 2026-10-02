import { statusLabel } from '../lib/types'

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pitched:     { bg: '#F3EFEA', fg: '#7A6E64' },
  assigned:    { bg: '#E7F0FB', fg: '#1F5FA8' },
  in_progress: { bg: '#EFE8FA', fg: '#7C3AED' },
  in_review:   { bg: '#F0EAF7', fg: '#6A4C93' },
  copyread:    { bg: '#FCEFFE', fg: '#B01FA8' },
  layout:      { bg: '#FFF4E5', fg: '#9A5B00' },
  approval:    { bg: '#FFF9DB', fg: '#8A6D00' },
  done:        { bg: '#E6F4EC', fg: '#1F7A4D' },
  killed:      { bg: '#FDECEA', fg: '#8F1D17' },
}

const PRIORITY_COLORS: Record<string, { bg: string; fg: string }> = {
  low:    { bg: '#F2EDFB', fg: '#6B5B8E' },
  normal: { bg: '#F2EDFB', fg: '#3D2E5C' },
  high:   { bg: '#FFF4E5', fg: '#9A5B00' },
  urgent: { bg: '#FDECEA', fg: '#8F1D17' },
}

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#F2EDFB', fg: '#3D2E5C' }
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {statusLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_COLORS[priority] ?? { bg: '#F2EDFB', fg: '#3D2E5C' }
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {priority}
    </span>
  )
}

/** Colour used for the overdue highlight, exported so pages stay consistent. */
export const OVERDUE_COLOR = '#8F1D17'
