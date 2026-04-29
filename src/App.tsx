import { useEffect, useState } from 'react'
import './App.css'

interface Task {
  task_id: number
  task_name: string
  created_date: string
  created_date_formatted: string
  creator_name: string
  project_name: string
  status: string
  deadline: string
}

const STATUS_LABELS: Record<string, string> = {
  task_status1: 'Not Started',
  task_status2: 'In Progress',
  task_status3: 'Completed',
  task_status9: 'Pending',
}

function formatStatus(s: string): string {
  return STATUS_LABELS[s] ?? s
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const COLUMNS: [keyof Task, string][] = [
  ['task_name', 'Task'],
  ['project_name', 'Project'],
  ['creator_name', 'Creator'],
  ['status', 'Status'],
  ['created_date', 'Created'],
  ['deadline', 'Deadline'],
]

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCreator, setSelectedCreator] = useState('all')
  const [sortKey, setSortKey] = useState<keyof Task>('created_date')
  const [sortAsc, setSortAsc] = useState(false)

  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysSinceMonday)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  useEffect(() => {
    fetch('https://scoro-insights.onrender.com/api/tasks/weekly')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Task[]) => setTasks(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const creators = ['all', ...Array.from(new Set(tasks.map(t => t.creator_name))).sort()]

  const filtered = tasks
    .filter(t => selectedCreator === 'all' || t.creator_name === selectedCreator)
    .slice()
    .sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''))
      return sortAsc ? cmp : -cmp
    })

  function handleSort(key: keyof Task) {
    if (key === sortKey) setSortAsc(p => !p)
    else { setSortKey(key); setSortAsc(true) }
  }

  if (loading) return <div className="state-msg">Loading tasks…</div>
  if (error) return <div className="state-msg error">Error: {error}</div>

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Weekly Tasks {formatShortDate(monday)} - {formatShortDate(friday)}</h1>
          <p className="subtitle">Showing {filtered.length} of {tasks.length} tasks</p>
        </div>
        <div className="controls">
          <label htmlFor="creator-filter">Creator</label>
          <select
            id="creator-filter"
            value={selectedCreator}
            onChange={e => setSelectedCreator(e.target.value)}
          >
            {creators.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All creators' : c}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {COLUMNS.map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)} className="sortable">
                  {label}
                  <span className={`sort-icon ${key === sortKey ? 'active' : ''}`}>
                    {key === sortKey ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(task => (
              <tr key={task.task_id}>
                <td className="task-name"><a href={`https://estiponagroup.scoro.com/tasks/view/${task.task_id}`} target="_blank" rel="noopener noreferrer">{task.task_name}</a></td>
                <td>{task.project_name}</td>
                <td>{task.creator_name}</td>
                <td>
                  <span className={`badge ${task.status}`}>{formatStatus(task.status)}</span>
                </td>
                <td>{formatDate(task.created_date)}</td>
                <td>{formatDate(task.deadline)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="empty">No tasks found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
