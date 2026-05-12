import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const supabaseUrl =
  'https://xvzskblvseoamoxjaufl.supabase.co'

const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2enNrYmx2c2VvYW1veGphdWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDg1NjEsImV4cCI6MjA5NDEyNDU2MX0.qxygAr6zJW-O-1LnC8Qdk0wgsyXp3X7cQ3h-p87UHYk'

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

const defaultTasks = [
  {
    id: 1,
    task: 'Lift or Run',
    category: 'Health',
    points: 15,
    completed: false,
  }
]

export default function LifeOSApp() {
  const [tasks, setTasks] = useState([])
  const [history, setHistory] = useState([])
  const [taskName, setTaskName] = useState('')
  const [category, setCategory] = useState('Health')
  const [points, setPoints] = useState(10)
  const [categories, setCategories] = useState([
    'Health',
    'Learning',
    'Career',
    'Discipline',
  ])
  const [newCategory, setNewCategory] = useState('')
  const [futureTasks, setFutureTasks] = useState([])
  const [futureTaskName, setFutureTaskName] = useState('')
  const [futureTaskDate, setFutureTaskDate] = useState('')

  const today = new Date().toLocaleDateString()

useEffect(() => {
  loadTasks()
}, [])

const loadTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  if (data.length === 0) {
    await supabase
      .from('tasks')
      .insert(defaultTasks)

    setTasks(defaultTasks)
  } else {
    setTasks(data)
  }
}

  useEffect(() => {
    localStorage.setItem('lifeos_tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('lifeos_history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    const savedFutureTasks = localStorage.getItem('lifeos_future_tasks')

    if (savedFutureTasks) {
      setFutureTasks(JSON.parse(savedFutureTasks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'lifeos_future_tasks',
      JSON.stringify(futureTasks)
    )
  }, [futureTasks])

  const totalPossible = useMemo(() => {
    return tasks.reduce((sum, task) => sum + Number(task.points), 0)
  }, [tasks])

  const totalEarned = useMemo(() => {
    return tasks
      .filter((task) => task.completed)
      .reduce((sum, task) => sum + Number(task.points), 0)
  }, [tasks])

  const completion = totalPossible
    ? Math.round((totalEarned / totalPossible) * 100)
    : 0

  const totalXP = useMemo(() => {
    const historicalXP = history.reduce((sum, day) => sum + day.score, 0)
    return historicalXP + totalEarned
  }, [history, totalEarned])

  const level = Math.floor(totalXP / 500) + 1

  const streak = useMemo(() => {
    return history.filter((day) => day.completion >= 70).length
  }, [history])

const toggleTask = async (id) => {
  const updatedTasks = tasks.map((task) =>
    task.id === id
      ? {
          ...task,
          completed: !task.completed,
        }
      : task
  )

  setTasks(updatedTasks)

  const updatedTask = updatedTasks.find(
    (t) => t.id === id
  )

  await supabase
    .from('tasks')
    .update({
      completed: updatedTask.completed,
    })
    .eq('id', id)
}

const addTask = async () => {
  if (!taskName.trim()) return

  const newTask = {
    task: taskName,
    category,
    points: Number(points),
    completed: false,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([newTask])
    .select()

  if (error) {
    console.error(error)
    return
  }

  setTasks((prev) => [...prev, ...data])

  setTaskName('')
  setPoints(10)
}

  const startNewDay = () => {
    if (tasks.length > 0) {
      const archive = {
        date: today,
        score: totalEarned,
        completion,
      }

      setHistory((prev) => [archive, ...prev])
    }

    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        completed: false,
      }))
    )
  }

  const monthlyStats = useMemo(() => {
    const grouped = {}

    history.forEach((day) => {
      const month = new Date(day.date).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      })

      if (!grouped[month]) {
        grouped[month] = {
          total: 0,
          count: 0,
        }
      }

      grouped[month].total += day.score
      grouped[month].count += 1
    })

    return Object.entries(grouped).map(([month, data]) => ({
      month,
      average: Math.round(data.total / data.count),
    }))
  }, [history])

  const addFutureTask = () => {
    if (!futureTaskName.trim()) return

    const newFutureTask = {
      id: Date.now(),
      name: futureTaskName,
      expectedDate: futureTaskDate,
    }

    setFutureTasks((prev) => [newFutureTask, ...prev])

    setFutureTaskName('')
    setFutureTaskDate('')
  }

  const removeFutureTask = (id) => {
    setFutureTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const addCategory = () => {
    if (!newCategory.trim()) return

    if (categories.includes(newCategory)) return

    setCategories((prev) => [...prev, newCategory])
    setNewCategory('')
  }

  const removeCategory = (catToRemove) => {
    setCategories((prev) =>
      prev.filter((cat) => cat !== catToRemove)
    )

    setTasks((prev) =>
      prev.filter((task) => task.category !== catToRemove)
    )

    if (category === catToRemove && categories.length > 1) {
      const fallback = categories.find((c) => c !== catToRemove)
      if (fallback) setCategory(fallback)
    }
  }

  const categoryScores = categories.map(
    (cat) => {
      const catTasks = tasks.filter((t) => t.category === cat)

      const possible = catTasks.reduce((s, t) => s + t.points, 0)

      const earned = catTasks
        .filter((t) => t.completed)
        .reduce((s, t) => s + t.points, 0)

      return {
        name: cat,
        value: possible ? Math.round((earned / possible) * 100) : 0,
      }
    }
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">LifeOS</h1>
            <p className="text-zinc-400 mt-1">
              Personal KPI + XP Tracker
            </p>
            <p className="text-zinc-500 text-sm mt-2">{today}</p>
          </div>

          <button
            onClick={startNewDay}
            className="bg-white text-black px-4 py-2 rounded-2xl font-medium hover:scale-105 transition"
          >
            Start New Day
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Today's Score" value={totalEarned} />
          <StatCard title="Completion" value={`${completion}%`} />
          <StatCard title="Current Streak" value={streak} />
          <StatCard title="XP Level" value={level} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-semibold">Today's Tasks</h2>
            </div>

            <div className="bg-zinc-800 rounded-2xl p-4 mb-5 grid md:grid-cols-4 gap-3">
              <input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Task name"
                className="bg-zinc-900 rounded-xl px-3 py-2 outline-none"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-zinc-900 rounded-xl px-3 py-2 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="bg-zinc-900 rounded-xl px-3 py-2 outline-none"
              />

              <button
                onClick={addTask}
                className="bg-white text-black rounded-xl font-medium"
              >
                Add Task
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task.task}
                  category={task.category}
                  points={task.points}
                  completed={task.completed}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
              <h2 className="text-xl font-semibold mb-4">
                Add Categories
              </h2>

              <div className="flex gap-2 mb-5">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category"
                  className="flex-1 bg-zinc-800 rounded-xl px-3 py-2 outline-none"
                />

                <button
                  onClick={addCategory}
                  className="bg-white text-black px-4 rounded-xl font-medium"
                >
                  Add
                </button>
              </div>

              <h2 className="text-xl font-semibold mb-4">
                Category Scores
              </h2>

              <div className="flex flex-wrap gap-2 mb-5">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="bg-zinc-800 px-3 py-2 rounded-xl flex items-center gap-2"
                  >
                    <span>{cat}</span>

                    <button
                      onClick={() => removeCategory(cat)}
                      className="text-zinc-400 hover:text-red-400 transition text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {categoryScores.map((cat) => (
                  <CategoryBar
                    key={cat.name}
                    name={cat.name}
                    value={cat.value}
                  />
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
              <h2 className="text-xl font-semibold mb-4">Lifetime Stats</h2>

              <div className="space-y-3 text-zinc-300">
                <div className="flex justify-between">
                  <span>Total XP</span>
                  <span>{totalXP}</span>
                </div>

                <div className="flex justify-between">
                  <span>Days Logged</span>
                  <span>{history.length}</span>
                </div>

                <div className="flex justify-between">
                  <span>Best Day</span>
                  <span>
                    {history.length
                      ? Math.max(...history.map((d) => d.score))
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
          <h2 className="text-2xl font-semibold mb-4">
            Daily Performance Records
          </h2>

          <div className="overflow-x-auto mb-6">
            <div className="min-w-full space-y-2">
              {history.length === 0 && (
                <p className="text-zinc-500">No daily records yet.</p>
              )}

              {history.map((day, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-800 rounded-2xl p-4 flex justify-between items-center"
                >
                  <span>{day.date}</span>
                  <span>{day.score} XP</span>
                  <span>{day.completion}% Completion</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4">
            Monthly Summary
          </h2>

          <div className="bg-zinc-800 rounded-3xl p-4 mb-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />

                <XAxis
                  dataKey="month"
                  stroke="#a1a1aa"
                />

                <YAxis stroke="#a1a1aa" />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '16px',
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#ffffff"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mb-2">
            {monthlyStats.length === 0 && (
              <p className="text-zinc-500">No monthly data yet.</p>
            )}

            {monthlyStats.map((month, idx) => (
              <div
                key={idx}
                className="bg-zinc-800 rounded-2xl p-4 flex justify-between items-center"
              >
                <span>{month.month}</span>
                <span>Average XP: {month.average}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
          <h2 className="text-2xl font-semibold mb-4">
            Foreseeable Future Tasks
          </h2>

          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <input
              value={futureTaskName}
              onChange={(e) => setFutureTaskName(e.target.value)}
              placeholder="Future task or goal"
              className="bg-zinc-800 rounded-xl px-3 py-2 outline-none"
            />

            <input
              type="date"
              value={futureTaskDate}
              onChange={(e) => setFutureTaskDate(e.target.value)}
              className="bg-zinc-800 rounded-xl px-3 py-2 outline-none"
            />

            <button
              onClick={addFutureTask}
              className="bg-white text-black rounded-xl font-medium"
            >
              Add Future Task
            </button>
          </div>

          <div className="space-y-3">
            {futureTasks.length === 0 && (
              <p className="text-zinc-500">
                No future tasks planned yet.
              </p>
            )}

            {futureTasks.map((task) => (
              <div
                key={task.id}
                className="bg-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-medium text-lg">{task.name}</h3>
                  <p className="text-zinc-400 text-sm">
                    Expected: {task.expectedDate || 'No date set'}
                  </p>
                </div>

                <button
                  onClick={() => removeFutureTask(task.id)}
                  className="text-red-400 hover:text-red-300 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
          <h2 className="text-2xl font-semibold mb-4">History</h2>

          <div className="space-y-3">
            {history.length === 0 && (
              <p className="text-zinc-500">No archived days yet.</p>
            )}

            {history.map((day, idx) => (
              <div
                key={idx}
                className="bg-zinc-800 rounded-2xl p-4 flex justify-between"
              >
                <span>{day.date}</span>
                <span>{day.score} XP</span>
                <span>{day.completion}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
      <p className="text-zinc-400 text-sm">{title}</p>
      <h2 className="text-4xl font-bold mt-2">{value}</h2>
    </div>
  )
}

function TaskCard({
  task,
  category,
  points,
  completed,
  onToggle,
}) {
  return (
    <div className="bg-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-700 transition">
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          className="w-5 h-5"
        />

        <div>
          <h3
            className={`font-medium text-lg ${
              completed ? 'line-through text-zinc-500' : ''
            }`}
          >
            {task}
          </h3>
          <p className="text-zinc-400 text-sm">{category}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xl font-bold">+{points}</p>
        <p className="text-zinc-400 text-sm">XP</p>
      </div>
    </div>
  )
}

function CategoryBar({ name, value }) {
  return (
    <div>
      <div className="flex justify-between mb-1 text-sm">
        <span>{name}</span>
        <span>{value}%</span>
      </div>

      <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

