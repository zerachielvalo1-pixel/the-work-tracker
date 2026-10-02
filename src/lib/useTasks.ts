import { createContext, useContext } from 'react'
import type { Section, Task } from './types'

export type TaskDraft = {
  title: string
  description: string | null
  type: string
  section_id: string | null
  priority: string
  due_date: string | null
  target_word_count: number | null
  external_link: string | null
}

export type TaskContextValue = {
  tasks: Task[]
  sections: Section[]
  loading: boolean
  /** Human-readable message for the last failed operation, or null. */
  error: string | null
  clearError: () => void
  refresh: () => Promise<void>
  createTask: (draft: TaskDraft, createdBy: string) => Promise<boolean>
  updateTask: (id: string, patch: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
}

export const TaskContext = createContext<TaskContextValue | null>(null)

/**
 * Shared task data. Every page reads from this one source, so a change made on
 * one panel is immediately visible on the others and the app loads the dataset
 * once instead of per screen.
 */
export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used inside <TaskProvider>')
  return ctx
}
