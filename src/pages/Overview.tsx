import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
  priority: string
}

export default function Overview({ userName }: { userName: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tasks')
      .select('id,title,status,due_date,priority')
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        setTasks((data as Task[]) ?? [])
        setLoading(false)
      })
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in7 = new Date(today)
  in7.setDate(in7.getDate() + 7)

  const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'killed')
  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const dueThisWeek = open.filter((t) => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d >= today && d <= in7
  })
  const overdue = open.filter((t) => {
    if (!t.due_date) return false
    return new Date(t.due_date) < today
  })

  const upcoming = open.filter((t) => t.due_date).slice(0, 6)

  const stats = [
    { value: open.length,       label: 'Total open' },
    { value: inProgress.length, label: 'In progress' },
    { value: dueThisWeek.length,label: 'Due this week' },
    { value: overdue.length,    label: 'Overdue' },
  ]

  return (
    <div>
      <h1 style={{
        fontFamily: 'Georgia, serif',
        fontSize: 28,
        fontWeight: 900,
        margin: '0 0 6px',
        letterSpacing: '-0.02em',
      }}>
        Welcome back, {userName}.
      </h1>
      <p style={{ fontSize: 13, color: '#6B5B8E', margin: '0 0 28px' }}>
        Here's what's happening with The Work's content.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 28,
      }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              border: '1px solid #E5DDF5',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <b style={{
              display: 'block',
              fontFamily: 'Georgia, serif',
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 6,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg,#7C3AED,#A855F7,#D946EF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {loading ? '—' : s.value}
            </b>
            <span style={{
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#6B5B8E',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #E5DDF5',
        borderRadius: 12,
        padding: 22,
      }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 18,
          fontWeight: 900,
          margin: '0 0 4px',
        }}>
          Upcoming deadlines
        </h2>
        <p style={{ fontSize: 13, color: '#6B5B8E', margin: '0 0 18px' }}>
          The next tasks by due date.
        </p>

        {loading ? (
          <p style={{ color: '#6B5B8E', fontSize: 13 }}>Loading…</p>
        ) : upcoming.length === 0 ? (
          <p style={{ color: '#6B5B8E', fontSize: 13 }}>No deadlines scheduled.</p>
        ) : (
          upcoming.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #EFE8FA',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#1A0E2E',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 12, color: '#9A8EB8', marginTop: 2 }}>
                  {t.status.replace('_', ' ')} · {t.priority}
                </div>
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#6B5B8E',
                marginLeft: 12,
                whiteSpace: 'nowrap',
              }}>
                {t.due_date
                  ? new Date(t.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}