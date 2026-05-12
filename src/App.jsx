import { useState, useMemo, useEffect } from "react";

const STORAGE_KEY_TASKS = "lifeos_v2_tasks";
const STORAGE_KEY_HISTORY = "lifeos_v2_history";
const STORAGE_KEY_CATS = "lifeos_v2_categories";
const STORAGE_KEY_FUTURE = "lifeos_v2_future";

const DEFAULT_CATS = ["Health", "Learning", "Career", "Discipline", "Home"];
const CAT_COLORS = [
  "#a78bfa", "#34d399", "#f97316", "#60a5fa", "#f472b6",
  "#facc15", "#2dd4bf", "#fb923c", "#a3e635", "#c084fc",
];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

const today = () => new Date().toLocaleDateString("en-CA");

export default function LifeOS() {
  const [tasks, setTasks] = useState(() => load(STORAGE_KEY_TASKS, []));
  const [history, setHistory] = useState(() => load(STORAGE_KEY_HISTORY, []));
  const [categories, setCategories] = useState(() => load(STORAGE_KEY_CATS, DEFAULT_CATS));
  const [futureTasks, setFutureTasks] = useState(() => load(STORAGE_KEY_FUTURE, []));

  const [taskName, setTaskName] = useState("");
  const [taskCat, setTaskCat] = useState("");
  const [taskPts, setTaskPts] = useState(10);
  const [newCat, setNewCat] = useState("");
  const [futName, setFutName] = useState("");
  const [futDate, setFutDate] = useState("");
  const [tab, setTab] = useState("today");
  const [confirmNewDay, setConfirmNewDay] = useState(false);
  const [toast, setToast] = useState(null);

  const activeCat = taskCat || categories[0] || "";

  useEffect(() => { save(STORAGE_KEY_TASKS, tasks); }, [tasks]);
  useEffect(() => { save(STORAGE_KEY_HISTORY, history); }, [history]);
  useEffect(() => { save(STORAGE_KEY_CATS, categories); }, [categories]);
  useEffect(() => { save(STORAGE_KEY_FUTURE, futureTasks); }, [futureTasks]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const totalPossible = useMemo(() => tasks.reduce((s, t) => s + Number(t.points), 0), [tasks]);
  const totalEarned = useMemo(() => tasks.filter(t => t.completed).reduce((s, t) => s + Number(t.points), 0), [tasks]);
  const completion = totalPossible ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const totalXP = useMemo(() => history.reduce((s, d) => s + d.score, 0) + totalEarned, [history, totalEarned]);
  const level = Math.floor(totalXP / 500) + 1;
  const xpInLevel = totalXP % 500;
  const streak = useMemo(() => {
    let s = 0;
    for (const d of [...history].reverse()) {
      if (d.completion >= 50) s++; else break;
    }
    return s;
  }, [history]);

  const catColor = (name) => {
    const idx = categories.indexOf(name);
    return CAT_COLORS[idx % CAT_COLORS.length];
  };

  const addTask = () => {
    if (!taskName.trim()) return;
    const t = { id: Date.now(), task: taskName.trim(), category: activeCat, points: Number(taskPts), completed: false };
    setTasks(p => [...p, t]);
    setTaskName("");
    setTaskPts(10);
    showToast("Task added");
  };

  const toggleTask = (id) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(p => p.filter(t => t.id !== id));
  };

  const doNewDay = () => {
    if (tasks.length > 0) {
      setHistory(p => [{ date: today(), score: totalEarned, completion, tasks: tasks.length }, ...p]);
    }
    setTasks([]);
    setConfirmNewDay(false);
    showToast("Day logged! Fresh start 🌅");
    setTab("today");
  };

  const addCategory = () => {
    const c = newCat.trim();
    if (!c || categories.includes(c)) return;
    setCategories(p => [...p, c]);
    setNewCat("");
  };

  const removeCat = (cat) => {
    setCategories(p => p.filter(c => c !== cat));
    setTasks(p => p.filter(t => t.category !== cat));
  };

  const addFuture = () => {
    if (!futName.trim()) return;
    setFutureTasks(p => [{ id: Date.now(), name: futName.trim(), date: futDate }, ...p]);
    setFutName(""); setFutDate("");
  };

  const catScores = categories.map(cat => {
    const ct = tasks.filter(t => t.category === cat);
    const poss = ct.reduce((s, t) => s + t.points, 0);
    const earned = ct.filter(t => t.completed).reduce((s, t) => s + t.points, 0);
    return { name: cat, pct: poss ? Math.round((earned / poss) * 100) : 0, color: catColor(cat) };
  });

  const bestDay = history.length ? Math.max(...history.map(d => d.score)) : 0;
  const avgCompletion = history.length ? Math.round(history.reduce((s, d) => s + d.completion, 0) / history.length) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e6f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "0" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#1e1b2e", border: "1px solid #3d3859", borderRadius: 12, padding: "10px 18px", fontSize: 14, color: "#c4bde8", zIndex: 999, boxShadow: "0 4px 24px #0006" }}>
          {toast}
        </div>
      )}

      {/* Confirm modal */}
      {confirmNewDay && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#13111f", border: "1px solid #3d3859", borderRadius: 20, padding: "32px 36px", maxWidth: 380, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", color: "#e8e6f0" }}>End the day?</h3>
            <p style={{ color: "#8b82b0", fontSize: 14, margin: "0 0 24px" }}>This will log your score ({totalEarned} XP, {completion}% done) and clear today's tasks.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setConfirmNewDay(false)} style={{ padding: "10px 22px", background: "transparent", border: "1px solid #3d3859", borderRadius: 10, color: "#8b82b0", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={doNewDay} style={{ padding: "10px 22px", background: "#7c3aed", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Log & Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#0d0b18", borderBottom: "1px solid #1e1b2e", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#e8e6f0" }}>Ansh's LifeOS</span>
            <span style={{ fontSize: 12, color: "#6d648f", background: "#1a1628", padding: "2px 8px", borderRadius: 6, border: "1px solid #2a2440" }}>Lv {level}</span>
          </div>
          <div style={{ fontSize: 12, color: "#4a4268", marginTop: 3 }}>{new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
        <button
          onClick={() => setConfirmNewDay(true)}
          style={{ padding: "9px 20px", background: "#7c3aed", border: "none", borderRadius: 12, color: "#fff", fontWeight: 500, fontSize: 14, cursor: "pointer", letterSpacing: "0.01em" }}
        >
          End Day →
        </button>
      </div>

      {/* Stat bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 1, borderBottom: "1px solid #1e1b2e", background: "#1e1b2e" }}>
        {[
          { label: "Today's XP", val: totalEarned },
          { label: "Done", val: `${completion}%` },
          { label: "Streak", val: `${streak}d` },
          { label: "Total XP", val: totalXP },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: "#0d0b18", padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#4a4268", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#e8e6f0", lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* XP bar */}
      <div style={{ padding: "10px 28px", background: "#0d0b18", borderBottom: "1px solid #1e1b2e", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 12, color: "#6d648f", minWidth: 80 }}>Lv {level} → {level + 1}</span>
        <div style={{ flex: 1, height: 5, background: "#1e1b2e", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(xpInLevel / 500) * 100}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 3, transition: "width 0.4s" }} />
        </div>
        <span style={{ fontSize: 12, color: "#6d648f", minWidth: 60, textAlign: "right" }}>{xpInLevel}/500 XP</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e1b2e", background: "#0d0b18", padding: "0 20px" }}>
        {[["today", "Today"], ["categories", "Categories"], ["history", "History"], ["future", "Future"]].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{ padding: "13px 18px", background: "transparent", border: "none", borderBottom: tab === id ? "2px solid #7c3aed" : "2px solid transparent", color: tab === id ? "#c4b5fd" : "#4a4268", cursor: "pointer", fontSize: 14, fontWeight: tab === id ? 500 : 400, transition: "color 0.15s", marginBottom: -1 }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>

        {/* TODAY TAB */}
        {tab === "today" && (
          <div>
            {/* Add task form */}
            <div style={{ background: "#13111f", border: "1px solid #1e1b2e", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#6d648f", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Add a task</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "center" }}>
                <input
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  placeholder="What needs doing?"
                  style={{ background: "#0d0b18", border: "1px solid #2a2440", borderRadius: 10, padding: "10px 14px", color: "#e8e6f0", fontSize: 14, outline: "none" }}
                />
                <select
                  value={activeCat}
                  onChange={e => setTaskCat(e.target.value)}
                  style={{ background: "#0d0b18", border: "1px solid #2a2440", borderRadius: 10, padding: "10px 12px", color: "#e8e6f0", fontSize: 14, outline: "none" }}
                >
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  value={taskPts}
                  min={1} max={100}
                  onChange={e => setTaskPts(e.target.value)}
                  style={{ background: "#0d0b18", border: "1px solid #2a2440", borderRadius: 10, padding: "10px 10px", color: "#e8e6f0", fontSize: 14, outline: "none", width: 72, textAlign: "center" }}
                />
                <button
                  onClick={addTask}
                  style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Task progress */}
            {tasks.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#6d648f" }}>
                  <span>{tasks.filter(t => t.completed).length}/{tasks.length} tasks</span>
                  <span>{completion}%</span>
                </div>
                <div style={{ height: 6, background: "#1e1b2e", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${completion}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            {/* Task list */}
            {tasks.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#3d3859" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
                <div style={{ fontSize: 16 }}>No tasks yet. Add one above.</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tasks.map(t => (
                <div
                  key={t.id}
                  style={{ background: t.completed ? "#0d0b18" : "#13111f", border: `1px solid ${t.completed ? "#1a1628" : "#1e1b2e"}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s", opacity: t.completed ? 0.6 : 1 }}
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTask(t.id)}
                    style={{ width: 18, height: 18, accentColor: "#7c3aed", cursor: "pointer", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 400, color: t.completed ? "#4a4268" : "#e8e6f0", textDecoration: t.completed ? "line-through" : "none" }}>{t.task}</div>
                    <div style={{ fontSize: 12, marginTop: 3 }}>
                      <span style={{ color: catColor(t.category), background: catColor(t.category) + "22", padding: "1px 8px", borderRadius: 5 }}>{t.category}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: t.completed ? "#6d648f" : "#a78bfa" }}>+{t.points}</div>
                    <div style={{ fontSize: 11, color: "#3d3859" }}>XP</div>
                  </div>
                  <button
                    onClick={() => deleteTask(t.id)}
                    style={{ background: "transparent", border: "none", color: "#3d3859", cursor: "pointer", fontSize: 18, padding: "4px", lineHeight: 1, flexShrink: 0 }}
                    title="Delete"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {tab === "categories" && (
          <div>
            {/* Add category */}
            <div style={{ background: "#13111f", border: "1px solid #1e1b2e", borderRadius: 16, padding: 20, marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: "#6d648f", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>New category</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCategory()}
                  placeholder="Category name"
                  style={{ flex: 1, background: "#0d0b18", border: "1px solid #2a2440", borderRadius: 10, padding: "10px 14px", color: "#e8e6f0", fontSize: 14, outline: "none" }}
                />
                <button
                  onClick={addCategory}
                  style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Category progress bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {catScores.map(cat => (
                <div key={cat.name} style={{ background: "#13111f", border: "1px solid #1e1b2e", borderRadius: 16, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 15, fontWeight: 500, color: "#e8e6f0" }}>{cat.name}</span>
                      <span style={{ fontSize: 12, color: "#4a4268" }}>
                        ({tasks.filter(t => t.category === cat.name).length} task{tasks.filter(t => t.category === cat.name).length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: cat.color }}>{cat.pct}%</span>
                      <button
                        onClick={() => removeCat(cat.name)}
                        style={{ background: "transparent", border: "none", color: "#3d3859", cursor: "pointer", fontSize: 16, padding: "2px 6px" }}
                        title="Remove category"
                      >×</button>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "#1e1b2e", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${cat.pct}%`, background: cat.color, borderRadius: 4, transition: "width 0.4s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Days logged", val: history.length },
                { label: "Best day", val: `${bestDay} XP` },
                { label: "Avg completion", val: `${avgCompletion}%` },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: "#13111f", border: "1px solid #1e1b2e", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: "#4a4268", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#e8e6f0" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* History list */}
            {history.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#3d3859" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div>End your first day to see history.</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((d, i) => (
                <div key={i} style={{ background: "#13111f", border: "1px solid #1e1b2e", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 15, color: "#e8e6f0", fontWeight: 500 }}>{fmt(d.date)}</div>
                    <div style={{ fontSize: 12, color: "#4a4268", marginTop: 4 }}>{d.tasks} tasks</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#4a4268", marginBottom: 3 }}>XP</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>{d.score}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#4a4268", marginBottom: 3 }}>Done</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: d.completion >= 70 ? "#34d399" : d.completion >= 40 ? "#facc15" : "#f97316" }}>{d.completion}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FUTURE TAB */}
        {tab === "future" && (
          <div>
            <div style={{ background: "#13111f", border: "1px solid #1e1b2e", borderRadius: 16, padding: 20, marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: "#6d648f", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Plan a future task</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10 }}>
                <input
                  value={futName}
                  onChange={e => setFutName(e.target.value)}
                  placeholder="Goal or upcoming task"
                  style={{ background: "#0d0b18", border: "1px solid #2a2440", borderRadius: 10, padding: "10px 14px", color: "#e8e6f0", fontSize: 14, outline: "none" }}
                />
                <input
                  type="date"
                  value={futDate}
                  onChange={e => setFutDate(e.target.value)}
                  style={{ background: "#0d0b18", border: "1px solid #2a2440", borderRadius: 10, padding: "10px 12px", color: "#e8e6f0", fontSize: 14, outline: "none" }}
                />
                <button
                  onClick={addFuture}
                  style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
            </div>

            {futureTasks.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#3d3859" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔭</div>
                <div>Nothing planned yet.</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {futureTasks.map(t => {
                const daysUntil = t.date ? Math.ceil((new Date(t.date) - new Date()) / 86400000) : null;
                return (
                  <div key={t.id} style={{ background: "#13111f", border: "1px solid #1e1b2e", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 15, color: "#e8e6f0", fontWeight: 500 }}>{t.name}</div>
                      {t.date && (
                        <div style={{ fontSize: 12, color: "#6d648f", marginTop: 4 }}>
                          {fmt(t.date)}
                          {daysUntil !== null && (
                            <span style={{ marginLeft: 8, color: daysUntil <= 3 ? "#f97316" : "#4a4268" }}>
                              {daysUntil > 0 ? `in ${daysUntil}d` : daysUntil === 0 ? "today" : `${Math.abs(daysUntil)}d ago`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setFutureTasks(p => p.filter(x => x.id !== t.id))}
                      style={{ background: "transparent", border: "none", color: "#3d3859", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}
                    >×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}