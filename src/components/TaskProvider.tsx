import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { TASK_COLUMNS } from '../lib/types'
import type { Section, Task } from '../lib/types'
import { TaskContext } from '../lib/useTasks'
import type { TaskContextValue, TaskDraft } from '../lib/useTasks'

function message(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message
    if (typeof m === 'string' && m) return m
  }
  return fallback
}

export default function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true)

    const [tasksResult, sectionsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select(TASK_COLUMNS)
        .order('created_at', { ascending: false }),
      supabase.from('sections').select('id,name,sort_order').order('sort_order'),
    ])

    if (tasksResult.error) {
      setError(message(tasksResult.error, 'Could not load tasks.'))
    } else {
      setTasks((tasksResult.data as Task[]) ?? [])
    }

    if (sectionsResult.error) {
      // Sections are optional decoration for the forms; a failure here should
      // not blank the whole app.
      console.error(sectionsResult.error)
    } else {
      setSections((sectionsResult.data as Section[]) ?? [])
    }

    if (showSpinner) setLoading(false)
  }, [])

  useEffect(() => {
    // Fetch-on-mount is exactly the "synchronise with an external system"
    // case this rule carves out: Supabase is the external system, and the
    // state update happens after the await resolves rather than during
    // render. The loader is not part of a render-driven data flow.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(true)
  }, [load])

  const refresh = useCallback(async () => {
    await load(false)
  }, [load])

  const createTask = useCallback(
    async (draft: TaskDraft, createdBy: string) => {
      // Optimistic insert so the new task appears instantly. The temporary id
      // is replaced by the row the server returns.
      const optimisticId = `temp-${Date.now()}`
      const now = new Date().toISOString()
      const optimistic: Task = {
        id: optimisticId,
        title: draft.title,
        description: draft.description,
        type: draft.type,
        status: 'pitched',
        priority: draft.priority,
        section_id: draft.section_id,
        due_date: draft.due_date,
        target_word_count: draft.target_word_count,
        external_link: draft.external_link,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
        completed_at: null,
        issue_id: null,
      }
      setTasks((prev) => [optimistic, ...prev])

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({ ...draft, status: 'pitched', created_by: createdBy })
        .select(TASK_COLUMNS)
        .single()

      if (insertError || !data) {
        setTasks((prev) => prev.filter((t) => t.id !== optimisticId))
        setError(message(insertError, 'Could not save the task.'))
        return false
      }

      const saved = data as Task
      setTasks((prev) => prev.map((t) => (t.id === optimisticId ? saved : t)))
      return true
    },
    [],
  )

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    let previous: Task | undefined
    setTasks((prev) => {
      previous = prev.find((t) => t.id === id)
      return prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    })

    const { error: updateError } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)

    if (updateError) {
      // Roll the optimistic change back so the UI never lies about saved state.
      if (previous) {
        const restore = previous
        setTasks((prev) => prev.map((t) => (t.id === id ? restore : t)))
      }
      setError(message(updateError, 'Could not update the task.'))
      return false
    }
    return true
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    let removed: Task | undefined
    let index = -1
    setTasks((prev) => {
      index = prev.findIndex((t) => t.id === id)
      removed = prev[index]
      return prev.filter((t) => t.id !== id)
    })

    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id)

    if (deleteError) {
      if (removed) {
        const restore = removed
        const at = index
        setTasks((prev) => {
          const next = [...prev]
          next.splice(at < 0 ? next.length : at, 0, restore)
          return next
        })
      }
      setError(message(deleteError, 'Could not delete the task.'))
      return false
    }
    return true
  }, [])

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      sections,
      loading,
      error,
      clearError: () => setError(null),
      refresh,
      createTask,
      updateTask,
      deleteTask,
    }),
    [tasks, sections, loading, error, refresh, createTask, updateTask, deleteTask],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
