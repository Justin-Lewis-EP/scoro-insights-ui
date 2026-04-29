import { useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Box,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  Alert,
  createTheme,
} from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import RefreshIcon from '@mui/icons-material/Refresh'

interface Task {
  task_id: number
  task_name: string
  created_date: string
  created_date_formatted: string
  creator_name: string
  project_name: string
  status: string
  deadline: string
  complexity: string
  time_planned: string
  time_actual: string
}

const STATUS_LABELS: Record<string, string> = {
  task_status1: 'Not Started',
  task_status2: 'In Progress',
  task_status3: 'Completed',
  task_status9: 'Pending',
}

const COMPLEXITY_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
}

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning'> = {
  task_status1: 'default',
  task_status2: 'primary',
  task_status3: 'success',
  task_status9: 'warning',
}

function formatStatus(s: string): string {
  return STATUS_LABELS[s] ?? s
}

function parseSeconds(t: string): number {
  if (!t) return 0
  const [h, m, s] = t.split(':').map(Number)
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0)
}

function formatDuration(t: string): string {
  if (!t) return '—'
  const total = parseSeconds(t)
  if (total === 0) return '0m'
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
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

const COLUMNS: { key: keyof Task; label: string }[] = [
  { key: 'task_name', label: 'Task' },
  { key: 'project_name', label: 'Project' },
  { key: 'creator_name', label: 'Creator' },
  { key: 'status', label: 'Status' },
  { key: 'created_date', label: 'Created' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'time_planned', label: 'Planned' },
  { key: 'time_actual', label: 'Actual' },
  { key: 'complexity', label: 'Complexity' },
]

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [tasks, setTasks] = useState<Task[]>([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCreator, setSelectedCreator] = useState('all')
  const [sortKey, setSortKey] = useState<keyof Task>('created_date')
  const [sortAsc, setSortAsc] = useState(false)

  const theme = useMemo(
    () => createTheme({ palette: { mode } }),
    [mode],
  )

  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysSinceMonday)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  function loadTasks(isInitial = false) {
    if (isInitial) setInitialLoad(true)
    else setRefreshing(true)
    setError(null)
    fetch('https://scoro-insights.onrender.com/api/tasks/weekly')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Task[]) => setTasks(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        setInitialLoad(false)
        setRefreshing(false)
      })
  }

  useEffect(() => { loadTasks(true) }, [])

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {initialLoad ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar position="static" elevation={0}>
            <Toolbar sx={{ gap: 1 }}>
              <CalendarTodayIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
                Scoro Insights
              </Typography>
              <Tooltip title="Refresh data">
                <span>
                  <IconButton color="inherit" onClick={() => loadTasks(false)} disabled={refreshing}>
                    <RefreshIcon sx={{
                      transition: 'transform 0.3s',
                      animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                      '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                    }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                <IconButton color="inherit" onClick={() => setMode(m => m === 'light' ? 'dark' : 'light')}>
                  {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ py: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>Failed to load tasks: {error}</Alert>
            )}

            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Weekly Tasks
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {formatShortDate(monday)} – {formatShortDate(friday)} &nbsp;·&nbsp; {filtered.length} of {tasks.length} tasks
                </Typography>
              </Box>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="creator-label">Creator</InputLabel>
                <Select
                  labelId="creator-label"
                  value={selectedCreator}
                  label="Creator"
                  onChange={e => setSelectedCreator(e.target.value)}
                >
                  {creators.map(c => (
                    <MenuItem key={c} value={c}>
                      {c === 'all' ? 'All creators' : c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ position: 'relative' }}>
              {refreshing && (
                <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, borderRadius: '8px 8px 0 0' }} />
              )}
              <TableContainer
                component={Paper}
                elevation={1}
                sx={{
                  borderRadius: 2,
                  opacity: refreshing ? 0.5 : 1,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: refreshing ? 'none' : 'auto',
                }}
              >
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: mode === 'light' ? 'grey.50' : 'grey.900' }}>
                      {COLUMNS.map(({ key, label }) => (
                        <TableCell key={key} sortDirection={sortKey === key ? (sortAsc ? 'asc' : 'desc') : false}>
                          <TableSortLabel
                            active={sortKey === key}
                            direction={sortKey === key ? (sortAsc ? 'asc' : 'desc') : 'asc'}
                            onClick={() => handleSort(key)}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                              {label}
                            </Typography>
                          </TableSortLabel>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map(task => (
                      <TableRow key={task.task_id} hover>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Typography
                            component="a"
                            href={`https://estiponagroup.scoro.com/tasks/view/${task.task_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            sx={{ fontWeight: 500, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {task.task_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{task.project_name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{task.creator_name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatus(task.status)}
                            color={STATUS_COLORS[task.status] ?? 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatDate(task.created_date)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatDate(task.deadline)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {formatDuration(task.time_planned)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: parseSeconds(task.time_actual) > parseSeconds(task.time_planned) ? 'error.main' : 'text.secondary' }}>
                            {formatDuration(task.time_actual)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {task.complexity
                            ? <Chip
                                label={task.complexity.charAt(0).toUpperCase() + task.complexity.slice(1)}
                                color={COMPLEXITY_COLORS[task.complexity.toLowerCase()] ?? 'default'}
                                size="small"
                                variant="outlined"
                              />
                            : <Typography variant="body2">—</Typography>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>No tasks found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Container>
        </Box>
      )}
    </ThemeProvider>
  )
}
