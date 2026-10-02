import { useEffect, useRef, useState } from 'react'
import { PriorityBadge, StatusBadge } from './Badges'
import { useTasks } from '../lib/useTasks'
import {
  BOARD_STATUSES,
  formatDate,
  statusLabel,
  typeLabel,
} from '../lib/types'
import type { Task } from '../lib/types'

/**
 * Detail/edit sheet for one task. Slides in from the right below 900px
 * (bottom sheet style) and sits as a panel on desktop.
 *
 * It surfaces the fields the app already stores but never displayed —
 * description, word count, external link, completion — so nothing collected by
 * the New task form is invisible afterwards.
 */
export default function TaskDrawer({
  task,
  onClose,
}: {
  task: Task
  onClose: () => void
}) {
  const { sections, updateTask, deleteTask } = useTasks()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  // Focus the close button so keyboard users land inside the sheet.
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const sectionName =
    sections.find((s) => s.id === task.section_id)?.name ?? '—'

  async function patch(next: Partial<Task>) {
    setBusy(true)
    await updateTask(task.id, next)
    setBusy(false)
  }

  async function handleStatus(next: string) {
    await patch({
      status: next,
      completed_at: next === 'done' ? new Date().toISOString() : null,
    })
  }

  async function handleDelete() {
    setBusy(true)
    const ok = await deleteTask(task.id)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <>
      <div className="sheet__scrim is-open" onClick={onClose} aria-hidden="true" />

      <aside
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-sheet-title"
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="task-sheet-title">
            {task.title}
          </h2>
          <button
            type="button"
            className="sheet__close"
            onClick={onClose}
            aria-label="Close task details"
            ref={closeRef}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="sheet__body">
          <dl className="detail">
            <div className="detail__row">
              <dt>Status</dt>
              <dd><StatusBadge status={task.status} /></dd>
            </div>
            <div className="detail__row">
              <dt>Priority</dt>
              <dd><PriorityBadge priority={task.priority} /></dd>
            </div>
            <div className="detail__row">
              <dt>Type</dt>
              <dd style={{ textTransform: 'capitalize' }}>{typeLabel(task.type)}</dd>
            </div>
            <div className="detail__row">
              <dt>Section</dt>
              <dd>{sectionName}</dd>
            </div>
            <div className="detail__row">
              <dt>Due</dt>
              <dd>{formatDate(task.due_date, true)}</dd>
            </div>
            <div className="detail__row">
              <dt>Words</dt>
              <dd>{task.target_word_count ?? '—'}</dd>
            </div>
            <div className="detail__row">
              <dt>Created</dt>
              <dd>{formatDate(task.created_at, true)}</dd>
            </div>
            {task.completed_at && (
              <div className="detail__row">
                <dt>Completed</dt>
                <dd>{formatDate(task.completed_at, true)}</dd>
              </div>
            )}
          </dl>

          {task.description && (
            <section className="sheet__section">
              <h3 className="sheet__label">Description</h3>
              <p className="sheet__text">{task.description}</p>
            </section>
          )}

          {task.external_link && (
            <section className="sheet__section">
              <h3 className="sheet__label">External link</h3>
              <a
                className="sheet__link"
                href={task.external_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {task.external_link}
              </a>
            </section>
          )}

          <section className="sheet__section">
            <h3 className="sheet__label">Move to</h3>
            <div className="chip-row">
              {BOARD_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  disabled={busy || task.status === s}
                  aria-pressed={task.status === s}
                  onClick={() => void handleStatus(s)}
                >
                  {statusLabel(s)}
                </button>
              ))}
              {task.status !== 'killed' && (
                <button
                  type="button"
                  className="chip chip--danger"
                  disabled={busy}
                  onClick={() => void handleStatus('killed')}
                >
                  Killed
                </button>
              )}
            </div>
          </section>

          {task.status === 'done' && (
            <p className="muted-note">
              Marked done. Reopen it above if that was a mistake.
            </p>
          )}
        </div>

        <footer className="sheet__foot">
          {confirmingDelete ? (
            <>
              <span className="muted-note">Delete this task permanently?</span>
              <div className="btn-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={busy}
                  onClick={() => void handleDelete()}
                >
                  {busy ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--ghost btn--danger-text"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete task
            </button>
          )}
        </footer>
      </aside>
    </>
  )
}

/** Statuses exposed to the "move to" control, kept in one place. */
