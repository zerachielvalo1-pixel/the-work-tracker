import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useTasks } from '../lib/useTasks'
import { TASK_TYPES, typeLabel } from '../lib/types'
import type { TaskDraft } from '../lib/useTasks'

export default function NewTask({ onSaved }: { onSaved: () => void }) {
  const { sections, createTask, error, clearError } = useTasks()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<string>('article')
  const [sectionId, setSectionId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [wordCount, setWordCount] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    setBusy(true)

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setBusy(false)
      return
    }

    const draft: TaskDraft = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      section_id: sectionId || null,
      priority,
      due_date: dueDate || null,
      target_word_count: wordCount ? parseInt(wordCount, 10) : null,
      external_link: externalLink.trim() || null,
    }

    const ok = await createTask(draft, userData.user.id)
    setBusy(false)

    if (!ok) return

    setSaved(true)
    // Brief confirmation, then return to the list where the new task is visible.
    window.setTimeout(onSaved, 550)
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page__head">
        <h1 className="page__title">New task</h1>
        <p className="page__sub">
          Pitch a story, photo, layout, or piece for an issue.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        {saved && (
          <div className="notice" role="status">
            Saved. Taking you to the list…
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="nt-title">
            Title <span className="form-label__req" aria-hidden="true">*</span>
          </label>
          <input
            id="nt-title"
            className="input"
            type="text"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            enterKeyHint="next"
            aria-required="true"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="nt-description">
            Description
          </label>
          <textarea
            id="nt-description"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-grid">
          <div>
            <label className="form-label" htmlFor="nt-type">
              Type <span className="form-label__req" aria-hidden="true">*</span>
            </label>
            <select
              id="nt-type"
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{typeLabel(t)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="nt-section">
              Section
            </label>
            <select
              id="nt-section"
              className="select"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              <option value="">— none —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label className="form-label" htmlFor="nt-priority">
              Priority
            </label>
            <select
              id="nt-priority"
              className="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="nt-due">
              Due date
            </label>
            <input
              id="nt-due"
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid" style={{ marginBottom: 24 }}>
          <div>
            <label className="form-label" htmlFor="nt-words">
              Target word count
            </label>
            <input
              id="nt-words"
              className="input"
              type="number"
              min={0}
              inputMode="numeric"
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="nt-link">
              External link
            </label>
            <input
              id="nt-link"
              className="input"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://docs.google.com/…"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
            />
          </div>
        </div>

        <div className="btn-row">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save task'}
          </button>

          <button type="button" className="btn btn--ghost" onClick={onSaved}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
