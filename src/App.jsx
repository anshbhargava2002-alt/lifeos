import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from "recharts";

// ─── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(
  "https://xvzskblvseoamoxjaufl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2enNrYmx2c2VvYW1veGphdWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDg1NjEsImV4cCI6MjA5NDEyNDU2MX0.qxygAr6zJW-O-1LnC8Qdk0wgsyXp3X7cQ3h-p87UHYk"
);

// ─── Local fallback ──────────────────────────────────────────────────────────
const K = { cats: "lo4_cats", future: "lo4_future", history: "lo4_history" };
function lload(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
function lsave(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_CATS = ["Health", "Learning", "Career", "Discipline", "Home"];
const CAT_COLORS   = ["#7dd3d8","#94a3b8","#5eead4","#a8b8c8","#67e8d4","#b0c4ce","#4db6ac","#78909c","#80cbc4","#90a4ae"];

// iPhone 13 Pro: 390×844 logical px, safe areas top ~47px, bottom ~34px
const ACC    = "#7dd3d8";
const ACC2   = "#3d9fa8";
const BG0    = "#09090b";
const BG1    = "#18181b";
const BG2    = "#27272a";
const BG3    = "#3f3f46";
const T1     = "#f4f4f5";
const T2     = "#a1a1aa";
const T3     = "#52525b";
const BORDER = "#27272a";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtShort = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" }); } catch { return d; } };
const fmtFull  = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };
const todayStr = () => new Date().toLocaleDateString("en-CA");
const monthKey = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", year: "numeric" }); } catch { return ""; } };
const yearKey  = (d) => { try { return String(new Date(d + "T00:00:00").getFullYear()); } catch { return ""; } };

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Lbl = ({ children }) => (
  <div style={{ fontSize: 10, color: T3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{children}</div>
);
const Card = ({ children, style }) => (
  <div style={{ background: BG1, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "16px", ...style }}>{children}</div>
);
const Btn = ({ onClick, children, accent, sm, style, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: sm ? "8px 16px" : "12px 20px",
      background: accent ? ACC2 : "transparent",
      border: `1px solid ${accent ? ACC2 : BG3}`,
      borderRadius: 12, color: accent ? "#000" : T2,
      fontWeight: accent ? 600 : 400,
      fontSize: sm ? 13 : 15,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "opacity .15s",
      ...style,
    }}
  >{children}</button>
);
const Inp = ({ style, ...p }) => (
  <input {...p} style={{ background: BG0, border: `1px solid ${BG3}`, borderRadius: 12, padding: "12px 14px", color: T1, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box", WebkitAppearance: "none", ...style }} />
);
const Sel = ({ style, children, ...p }) => (
  <select {...p} style={{ background: BG0, border: `1px solid ${BG3}`, borderRadius: 12, padding: "12px 10px", color: T1, fontSize: 15, outline: "none", WebkitAppearance: "none", ...style }}>{children}</select>
);
const StatCard = ({ label, val, color }) => (
  <Card style={{ padding: "14px" }}>
    <Lbl>{label}</Lbl>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T1, lineHeight: 1 }}>{val}</div>
  </Card>
);
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: BG2, border: `1px solid ${BG3}`, borderRadius: 10, padding: "8px 14px", fontSize: 12 }}>
      <div style={{ color: T2, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || ACC }}>{p.name}: <b>{p.value}</b></div>)}
    </div>
  );
};

// ─── Charts ───────────────────────────────────────────────────────────────────
function Chart30({ history }) {
  const data = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-CA");
      const rec = history.find(h => h.date === key);
      days.push({ label: fmtShort(key), score: rec ? rec.score : null });
    }
    return days;
  }, [history]);
  if (!data.some(d => d.score !== null))
    return <div style={{ color: T3, fontSize: 13, textAlign: "center", padding: "28px 0" }}>End your first day to see this chart.</div>;
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={BG3} vertical={false} />
        <XAxis dataKey="label" stroke={T3} tick={{ fontSize: 10, fill: T3 }} tickLine={false} axisLine={false} interval={6} />
        <YAxis stroke={T3} tick={{ fontSize: 10, fill: T3 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTip />} />
        <Line type="monotone" dataKey="score" name="XP" stroke={ACC} strokeWidth={2} dot={false} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
function MonthBar({ monthly }) {
  if (!monthly.length) return null;
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={monthly} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={BG3} vertical={false} />
        <XAxis dataKey="month" stroke={T3} tick={{ fontSize: 10, fill: T3 }} tickLine={false} axisLine={false} />
        <YAxis stroke={T3} tick={{ fontSize: 10, fill: T3 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTip />} />
        <Bar dataKey="avgXP" name="Avg XP" fill={ACC} radius={[4,4,0,0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function LifeOS() {
  // tasks come from Supabase; everything else local-first with Supabase backup
  const [tasks,       setTasks]       = useState([]);
  const [history,     setHistory]     = useState(() => lload(K.history, []));
  const [categories,  setCategories]  = useState(() => lload(K.cats,    DEFAULT_CATS));
  const [futureTasks, setFutureTasks] = useState(() => lload(K.future,  []));
  const [syncing,     setSyncing]     = useState(false);
  const [syncErr,     setSyncErr]     = useState(null);

  // form state
  const [taskName, setTaskName] = useState("");
  const [taskCat,  setTaskCat]  = useState("");
  const [taskPts,  setTaskPts]  = useState(10);
  const [newCat,   setNewCat]   = useState("");
  const [futName,  setFutName]  = useState("");
  const [futDate,  setFutDate]  = useState("");
  const [tab,      setTab]      = useState("today");
  const [modal,    setModal]    = useState(false);
  const [toast,    setToast]    = useState(null);
  const [histView, setHistView] = useState("chart");

  const activeCat = taskCat || categories[0] || "";

  // persist non-task state locally
  useEffect(() => { lsave(K.history, history);    }, [history]);
  useEffect(() => { lsave(K.cats,    categories); }, [categories]);
  useEffect(() => { lsave(K.future,  futureTasks);}, [futureTasks]);

  const showToast = (msg, err) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Supabase: load tasks ──────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setSyncing(true); setSyncErr(null);
    const { data, error } = await supabase.from("tasks").select("*").order("id", { ascending: true });
    setSyncing(false);
    if (error) { setSyncErr("Sync failed"); return; }
    setTasks(data || []);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalPoss   = useMemo(() => tasks.reduce((s, t) => s + Number(t.points), 0), [tasks]);
  const totalEarned = useMemo(() => tasks.filter(t => t.completed).reduce((s, t) => s + Number(t.points), 0), [tasks]);
  const completion  = totalPoss ? Math.round((totalEarned / totalPoss) * 100) : 0;
  const totalXP     = useMemo(() => history.reduce((s, d) => s + d.score, 0) + totalEarned, [history, totalEarned]);
  const level       = Math.floor(totalXP / 500) + 1;
  const xpInLevel   = totalXP % 500;
  const streak      = useMemo(() => {
    let s = 0;
    for (const d of [...history].sort((a, b) => b.date.localeCompare(a.date))) {
      if (d.completion >= 50) s++; else break;
    }
    return s;
  }, [history]);

  const catColor  = (name) => CAT_COLORS[categories.indexOf(name) % CAT_COLORS.length];
  const catScores = categories.map(cat => {
    const ct     = tasks.filter(t => t.category === cat);
    const poss   = ct.reduce((s, t) => s + t.points, 0);
    const earned = ct.filter(t => t.completed).reduce((s, t) => s + t.points, 0);
    return { name: cat, pct: poss ? Math.round((earned / poss) * 100) : 0, color: catColor(cat), count: ct.length };
  });

  const bestDay       = history.length ? Math.max(...history.map(d => d.score)) : 0;
  const avgCompletion = history.length ? Math.round(history.reduce((s, d) => s + d.completion, 0) / history.length) : 0;
  const avgXP         = history.length ? Math.round(history.reduce((s, d) => s + d.score, 0)      / history.length) : 0;

  const monthly = useMemo(() => {
    const g = {};
    history.forEach(d => {
      const k = monthKey(d.date); if (!k) return;
      if (!g[k]) g[k] = { total: 0, count: 0, comp: 0 };
      g[k].total += d.score; g[k].count++; g[k].comp += d.completion;
    });
    return Object.entries(g).map(([month, v]) => ({ month, avgXP: Math.round(v.total / v.count), avgComp: Math.round(v.comp / v.count), days: v.count })).sort((a,b) => a.month.localeCompare(b.month));
  }, [history]);

  const yearly = useMemo(() => {
    const g = {};
    history.forEach(d => {
      const k = yearKey(d.date); if (!k) return;
      if (!g[k]) g[k] = { total: 0, count: 0, comp: 0 };
      g[k].total += d.score; g[k].count++; g[k].comp += d.completion;
    });
    return Object.entries(g).map(([year, v]) => ({ year, totalXP: v.total, avgXP: Math.round(v.total / v.count), avgComp: Math.round(v.comp / v.count), days: v.count })).sort((a,b) => a.year.localeCompare(b.year));
  }, [history]);

  const catHistStats = useMemo(() => {
    const g = {};
    history.forEach(d => {
      if (!d.catBreakdown) return;
      Object.entries(d.catBreakdown).forEach(([cat, xp]) => { g[cat] = (g[cat] || 0) + xp; });
    });
    return g;
  }, [history]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const addTask = async () => {
    if (!taskName.trim()) return;
    const row = { task: taskName.trim(), category: activeCat, points: Number(taskPts), completed: false };
    // optimistic
    const tempId = Date.now();
    setTasks(p => [...p, { ...row, id: tempId }]);
    setTaskName(""); setTaskPts(10);
    const { data, error } = await supabase.from("tasks").insert([row]).select();
    if (error) { showToast("Couldn't save task", true); setTasks(p => p.filter(t => t.id !== tempId)); return; }
    setTasks(p => p.map(t => t.id === tempId ? data[0] : t));
    showToast("Task added");
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const next = !task.completed;
    setTasks(p => p.map(t => t.id === id ? { ...t, completed: next } : t));
    const { error } = await supabase.from("tasks").update({ completed: next }).eq("id", id);
    if (error) setTasks(p => p.map(t => t.id === id ? { ...t, completed: !next } : t));
  };

  const deleteTask = async (id) => {
    const prev = tasks.find(t => t.id === id);
    setTasks(p => p.filter(t => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { showToast("Delete failed", true); setTasks(p => [...p, prev]); }
  };

  const doNewDay = async () => {
    if (tasks.length > 0) {
      const catBreakdown = {};
      tasks.filter(t => t.completed).forEach(t => { catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.points; });
      setHistory(p => [{ date: todayStr(), score: totalEarned, completion, tasks: tasks.length, catBreakdown }, ...p]);
    }
    // delete all tasks from Supabase
    const { error } = await supabase.from("tasks").delete().neq("id", 0);
    if (error) { showToast("Couldn't clear tasks", true); return; }
    setTasks([]); setModal(false); showToast("Day logged ✓"); setTab("today");
  };

  const addCategory = () => {
    const c = newCat.trim();
    if (!c || categories.includes(c)) return;
    setCategories(p => [...p, c]); setNewCat("");
  };
  const removeCat = (cat) => { setCategories(p => p.filter(c => c !== cat)); setTasks(p => p.filter(t => t.category !== cat)); };
  const addFuture = () => {
    if (!futName.trim()) return;
    setFutureTasks(p => [{ id: Date.now(), name: futName.trim(), date: futDate }, ...p]);
    setFutName(""); setFutDate("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // iPhone 13 Pro = 390px wide, safe area insets handled via env()
  return (
    <div style={{ minHeight: "100vh", background: BG0, color: T1, fontFamily: "'SF Pro Text', 'Inter', 'Segoe UI', sans-serif", maxWidth: 390, margin: "0 auto", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* toast */}
      {toast && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top, 0px) + 12px)", left: "50%", transform: "translateX(-50%)", background: toast.err ? "#3f1010" : BG2, border: `1px solid ${toast.err ? "#7f2020" : BG3}`, borderRadius: 20, padding: "8px 20px", fontSize: 13, color: toast.err ? "#f87171" : T2, zIndex: 9999, whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* end-day modal — slides up from bottom like iOS sheet */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: BG1, border: `1px solid ${BG3}`, borderRadius: "20px 20px 0 0", padding: `28px 24px calc(28px + env(safe-area-inset-bottom, 0px))`, width: "100%", boxSizing: "border-box" }}>
            <div style={{ width: 36, height: 4, background: BG3, borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ fontSize: 17, fontWeight: 600, color: T1, marginBottom: 8 }}>End the day?</div>
            <div style={{ fontSize: 14, color: T2, marginBottom: 24 }}>Logs <b style={{ color: ACC }}>{totalEarned} XP</b> ({completion}% done) and clears today's tasks across all devices.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => setModal(false)} style={{ flex: 1, textAlign: "center" }}>Cancel</Btn>
              <Btn onClick={doNewDay} accent style={{ flex: 1, textAlign: "center" }}>Log & clear</Btn>
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.5px" }}>LifeOS</span>
            <span style={{ fontSize: 12, color: T3, background: BG2, padding: "2px 8px", borderRadius: 6, border: `1px solid ${BG3}` }}>Lv {level}</span>
            {syncing && <span style={{ fontSize: 11, color: T3 }}>syncing…</span>}
            {syncErr && <span style={{ fontSize: 11, color: "#f87171" }}>⚠ offline</span>}
          </div>
          <div style={{ fontSize: 12, color: T3, marginTop: 2 }}>
            {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </div>
        <Btn onClick={() => setModal(true)} accent sm>End Day</Btn>
      </div>

      {/* XP bar */}
      <div style={{ padding: "12px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T3, marginBottom: 5 }}>
          <span>Lv {level}</span><span>{xpInLevel} / 500 XP</span>
        </div>
        <div style={{ height: 3, background: BG2, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(xpInLevel / 500) * 100}%`, background: ACC, borderRadius: 2, transition: "width .5s" }} />
        </div>
      </div>

      {/* stat chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: "12px 20px" }}>
        {[
          { label: "XP today", val: totalEarned, color: ACC },
          { label: "Done",     val: `${completion}%` },
          { label: "Streak",   val: `${streak}d` },
          { label: "Total XP", val: totalXP },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: BG1, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px" }}>
            <div style={{ fontSize: 9, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: color || T1, lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* tab bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 12px" }}>
        {[["today","Today"],["categories","Categories"],["history","History"],["future","Future"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "11px 4px", background: "transparent", border: "none", borderBottom: tab === id ? `2px solid ${ACC}` : "2px solid transparent", color: tab === id ? ACC : T3, cursor: "pointer", fontSize: 13, fontWeight: tab === id ? 500 : 400, transition: "color .15s", marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {/* content */}
      <div style={{ padding: "16px 20px", paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>

        {/* ── TODAY ──────────────────────────────────────────────────── */}
        {tab === "today" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Lbl>Add task</Lbl>
              <Inp value={taskName} onChange={e => setTaskName(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="What needs doing?" style={{ marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <Sel value={activeCat} onChange={e => setTaskCat(e.target.value)} style={{ flex: 1 }}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </Sel>
                <Inp value={taskPts} onChange={e => setTaskPts(e.target.value)} type="number" min={1} max={999} style={{ width: 70 }} />
              </div>
              <Btn onClick={addTask} accent style={{ width: "100%", textAlign: "center" }}>+ Add task</Btn>
            </Card>

            {tasks.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T3, marginBottom: 6 }}>
                  <span>{tasks.filter(t => t.completed).length}/{tasks.length} done</span>
                  <span>{completion}%</span>
                </div>
                <div style={{ height: 3, background: BG2, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${completion}%`, background: ACC, borderRadius: 2, transition: "width .3s" }} />
                </div>
              </div>
            )}

            {tasks.length === 0 && syncing && (
              <div style={{ textAlign: "center", padding: "40px 0", color: T3, fontSize: 14 }}>Loading tasks…</div>
            )}
            {tasks.length === 0 && !syncing && (
              <div style={{ textAlign: "center", padding: "40px 0", color: T3, fontSize: 14 }}>No tasks yet</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ background: t.completed ? BG0 : BG1, border: `1px solid ${t.completed ? BG1 : BORDER}`, borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", gap: 13, opacity: t.completed ? 0.5 : 1, transition: "all .2s" }}>
                  <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} style={{ width: 18, height: 18, accentColor: ACC, cursor: "pointer", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: t.completed ? T3 : T1, textDecoration: t.completed ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.task}</div>
                    <span style={{ fontSize: 11, color: catColor(t.category), background: catColor(t.category) + "20", padding: "2px 8px", borderRadius: 5, marginTop: 4, display: "inline-block" }}>{t.category}</span>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: t.completed ? T3 : ACC }}>+{t.points}</div>
                    <div style={{ fontSize: 9, color: T3 }}>XP</div>
                  </div>
                  <button onClick={() => deleteTask(t.id)} style={{ background: "transparent", border: "none", color: T3, cursor: "pointer", fontSize: 18, padding: "2px 4px", flexShrink: 0, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CATEGORIES ──────────────────────────────────────────────── */}
        {tab === "categories" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Lbl>New category</Lbl>
              <div style={{ display: "flex", gap: 8 }}>
                <Inp value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} placeholder="Category name" style={{ flex: 1 }} />
                <Btn onClick={addCategory} accent sm>Add</Btn>
              </div>
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {catScores.map(cat => (
                <div key={cat.name} style={{ background: BG1, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: cat.color }} />
                      <span style={{ fontSize: 15, color: T1 }}>{cat.name}</span>
                      <span style={{ fontSize: 12, color: T3 }}>({cat.count})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 19, fontWeight: 700, color: cat.color }}>{cat.pct}%</span>
                      <button onClick={() => removeCat(cat.name)} style={{ background: "transparent", border: "none", color: T3, cursor: "pointer", fontSize: 17, padding: "1px 4px" }}>×</button>
                    </div>
                  </div>
                  <div style={{ height: 4, background: BG2, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${cat.pct}%`, background: cat.color, borderRadius: 2, transition: "width .4s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ─────────────────────────────────────────────────── */}
        {tab === "history" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
              <StatCard label="Days logged" val={history.length} />
              <StatCard label="Best day"    val={`${bestDay} XP`} color={ACC} />
              <StatCard label="Avg done"    val={`${avgCompletion}%`} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 18 }}>
              <StatCard label="Avg XP/day" val={avgXP} color={ACC} />
              <StatCard label="Streak"     val={`${streak} days`} />
            </div>

            {/* sub-nav pills */}
            <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
              {[["chart","30-day"],["monthly","Monthly"],["yearly","Yearly"],["log","Log"]].map(([id, lbl]) => (
                <button key={id} onClick={() => setHistView(id)} style={{ padding: "7px 14px", background: histView === id ? ACC2 : BG2, border: "none", borderRadius: 20, color: histView === id ? "#000" : T2, fontSize: 13, fontWeight: histView === id ? 600 : 400, cursor: "pointer" }}>{lbl}</button>
              ))}
            </div>

            {histView === "chart" && (
              <Card>
                <Lbl>XP — last 30 days</Lbl>
                <Chart30 history={history} />
                {Object.keys(catHistStats).length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <Lbl>All-time XP by category</Lbl>
                    {Object.entries(catHistStats).sort((a,b)=>b[1]-a[1]).map(([cat, xp]) => {
                      const max = Math.max(...Object.values(catHistStats));
                      const color = catColor(cat);
                      return (
                        <div key={cat} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T2, marginBottom: 4 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />{cat}
                            </span>
                            <span style={{ color }}>{xp} XP</span>
                          </div>
                          <div style={{ height: 4, background: BG2, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.round((xp/max)*100)}%`, background: color, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {histView === "monthly" && (
              <div>
                {!monthly.length && <div style={{ color: T3, fontSize: 13, textAlign: "center", padding: "36px 0" }}>No data yet</div>}
                {monthly.length > 0 && (
                  <>
                    <Card style={{ marginBottom: 12 }}>
                      <Lbl>Avg XP per month</Lbl>
                      <MonthBar monthly={monthly} />
                    </Card>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[...monthly].reverse().map(m => (
                        <div key={m.month} style={{ background: BG1, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 15, color: T1, fontWeight: 500 }}>{m.month}</div>
                            <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>{m.days} days</div>
                          </div>
                          <div style={{ display: "flex", gap: 20 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 10, color: T3, marginBottom: 2 }}>Avg XP</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: ACC }}>{m.avgXP}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 10, color: T3, marginBottom: 2 }}>Avg done</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: m.avgComp >= 70 ? "#5eead4" : m.avgComp >= 40 ? "#94a3b8" : T3 }}>{m.avgComp}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {histView === "yearly" && (
              <div>
                {!yearly.length && <div style={{ color: T3, fontSize: 13, textAlign: "center", padding: "36px 0" }}>No data yet</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...yearly].reverse().map(y => (
                    <Card key={y.year}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: ACC }}>{y.year}</span>
                        <span style={{ fontSize: 12, color: T3 }}>{y.days} days</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                        {[{ label: "Total XP", val: y.totalXP },{ label: "Avg XP", val: y.avgXP },{ label: "Avg done", val: `${y.avgComp}%` }].map(({ label, val }) => (
                          <div key={label} style={{ background: BG2, borderRadius: 10, padding: "10px" }}>
                            <div style={{ fontSize: 9, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: T1 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {histView === "log" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!history.length && <div style={{ color: T3, fontSize: 13, textAlign: "center", padding: "36px 0" }}>No history yet</div>}
                {history.map((d, i) => (
                  <div key={i} style={{ background: BG1, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, color: T1 }}>{fmtFull(d.date)}</div>
                      <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>{d.tasks} tasks</div>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: T3, marginBottom: 2 }}>XP</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: ACC }}>{d.score}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: T3, marginBottom: 2 }}>Done</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: d.completion >= 70 ? "#5eead4" : d.completion >= 40 ? "#94a3b8" : T3 }}>{d.completion}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FUTURE ──────────────────────────────────────────────────── */}
        {tab === "future" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Lbl>Plan a future task</Lbl>
              <Inp value={futName} onChange={e => setFutName(e.target.value)} placeholder="Goal or upcoming task" style={{ marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <Inp type="date" value={futDate} onChange={e => setFutDate(e.target.value)} style={{ flex: 1 }} />
                <Btn onClick={addFuture} accent sm>Add</Btn>
              </div>
            </Card>
            {!futureTasks.length && <div style={{ color: T3, fontSize: 13, textAlign: "center", padding: "36px 0" }}>Nothing planned yet</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {futureTasks.map(t => {
                const du = t.date ? Math.ceil((new Date(t.date + "T00:00:00") - new Date()) / 86400000) : null;
                return (
                  <div key={t.id} style={{ background: BG1, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, color: T1 }}>{t.name}</div>
                      {t.date && (
                        <div style={{ fontSize: 12, color: T2, marginTop: 3 }}>
                          {fmtFull(t.date)}
                          {du !== null && <span style={{ marginLeft: 8, color: du <= 3 ? "#fb923c" : T3 }}>{du > 0 ? `in ${du}d` : du === 0 ? "today" : `${Math.abs(du)}d ago`}</span>}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setFutureTasks(p => p.filter(x => x.id !== t.id))} style={{ background: "transparent", border: "none", color: T3, cursor: "pointer", fontSize: 18, padding: "2px 6px" }}>×</button>
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