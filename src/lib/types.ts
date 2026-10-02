/**
 * Domain types for the tracker.
 *
 * The column lists here are not guesses: every field below was probed against
 * the live database and confirmed to exist. Fields that look plausible but are
 * genuinely absent (assignee_id, tags, notes) are deliberately not modelled.
 */

import type { supabase } from './supabase'

/** The Supabase session shape, without importing it from App.tsx. */
export type Session = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>['data']['session']

export const STATUSES = [
  'pitched',
  'assigned',
  'in_progress',
  'in_review',
  'copyread',
  'layout',
  'approval',
  'done',
  'killed',
] as const

export type Status = (typeof STATUSES)[number]

export const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

export const TASK_TYPES = [
  'article',
  'photo',
  'illustration',
  'layout',
  'video',
  'social',
  'folio_piece',
  'other',
] as const

export type TaskType = (typeof TASK_TYPES)[number]

export type Task = {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  section_id: string | null
  due_date: string | null
  target_word_count: number | null
  external_link: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  completed_at: string | null
  issue_id: string | null
}

export type Section = {
  id: string
  name: string
  sort_order: number | null
}

/** Everything the app reads when it loads the board. */
export const TASK_COLUMNS =
  'id,title,description,type,status,priority,section_id,due_date,target_word_count,external_link,created_by,created_at,updated_at,completed_at,issue_id'

/** Human labels for statuses, including the ones with no natural plural. */
export const STATUS_LABELS: Record<string, string> = {
  pitched: 'Pitched',
  assigned: 'Assigned',
  in_progress: 'In progress',
  in_review: 'In review',
  copyread: 'Copyread',
  layout: 'Layout',
  approval: 'Approval',
  done: 'Done',
  killed: 'Killed',
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
}

export function typeLabel(type: string): string {
  return type.replace(/_/g, ' ')
}

/** Statuses shown on the board, in workflow order. */
export const BOARD_STATUSES: Status[] = [
  'pitched',
  'assigned',
  'in_progress',
  'in_review',
  'copyread',
  'layout',
  'approval',
  'done',
]

const CLOSED = new Set(['done', 'killed'])

export function isOpen(task: Pick<Task, 'status'>): boolean {
  return !CLOSED.has(task.status)
}

/** Midnight today, so due-date comparisons ignore the time component. */
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function dueDate(task: Pick<Task, 'due_date'>): Date | null {
  if (!task.due_date) return null
  const d = new Date(task.due_date)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isOverdue(task: Task): boolean {
  const d = dueDate(task)
  return isOpen(task) && d !== null && d < startOfToday()
}

export function formatDate(value: string | null, withYear = false): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}
