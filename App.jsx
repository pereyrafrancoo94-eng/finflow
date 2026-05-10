import { useState, useMemo } from "react";

const CATEGORIES = {
  income: ["Salario", "Freelance", "Inversiones", "Otros ingresos"],
  expense: ["Vivienda", "Alimentación", "Transporte", "Salud", "Educación", "Entretenimiento", "Ropa", "Otros gastos"],
};

const CATEGORY_COLORS = {
  "Salario": "#2D6A4F", "Freelance": "#40916C", "Inversiones": "#52B788", "Otros ingresos": "#74C69D",
  "Vivienda": "#C9184A", "Alimentación": "#E05C2A", "Transporte": "#F4A261", "Salud": "#E76F51",
  "Educación": "#264653", "Entretenimiento": "#2A9D8F", "Ropa": "#8338EC", "Otros gastos": "#9B8EA8",
};

function formatMXN(n) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
}

const initialTransactions = [
  { id: 1, type: "income", category: "Salario", amount: 18000, desc: "Sueldo mayo", date: "2026-05-01" },
  { id: 2, type: "expense", category: "Vivienda", amount: 5500, desc: "Renta", date: "2026-05-02" },
  { id: 3, type: "expense", category: "Alimentación", amount: 3200, desc: "Supermercado", date: "2026-05-05" },
  { id: 4, type: "expense", category: "Transporte", amount: 900, desc: "Gasolina", date: "2026-05-06" },
  { id: 5, type: "income", category: "Freelance", amount: 4500, desc: "Proyecto diseño", date: "2026-05-08" },
  { id: 6, type: "expense", category: "Entretenimiento", amount: 650, desc: "Netflix + Spotify", date: "2026-05-09" },
];

const initialBudgets = {
  "Vivienda": 6000, "Alimentación": 4000, "Transporte": 1500, "Salud": 1000,
  "Educación": 800, "Entretenimiento": 1000, "Ropa": 500, "Otros gastos": 500,
};

const initialGoals = [
  { id: 1, name: "Fondo de emergencia", target: 50000, saved: 18000, color: "#2D6A4F", emoji: "🛡️" },
  { id: 2, name: "Vacaciones", target: 15000, saved: 6200, color: "#2A9D8F", emoji: "✈️" },
  { id: 3, name: "Laptop nueva", target: 25000, saved: 9500, color: "#8338EC", emoji: "💻" },
];

function DonutChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, background: "#F5F4F2", borderRadius: "50%" }} />;
  let cumulative = 0;
  const r = 50, cx = 60, cy = 60, stroke = 18;
  const circumference = 2 * Math.PI * r;
  const slices = data.map(d => {
    const pct = d.value / total;
    const slice = { ...d, offset: cumulative * circumference, dash: pct * circumference };
    cumulative += pct;
    return slice;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F0EE" strokeWidth={stroke} />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${s.dash} ${circumference - s.dash}`}
          strokeDashoffset={circumference / 4 - s.offset} />
      ))}
    </svg>
  );
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const over = value > max;
  return (
    <div style={{ background: "#F0F0EE", borderRadius: 4, height: 7, flex: 1, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: over ? "#C9184A" : color, borderRadius: 4 }} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [goals, setGoals] = useState(initialGoals);
  const [form, setForm] = useState({ type: "expense", category: "", amount: "", desc: "", date: new Date().toISOString().slice(0, 10) });
  const [goalForm, setGoalForm] = useState({ name: "", target: "", saved: "", emoji: "🎯" });
  const [filterType, setFilterType] = useState("all");
  const [addingGoal, setAddingGoal] = useState(false);
  const [editGoalId, setEditGoalId] = useState(null);
  const [editGoalAmount, setEditGoalAmount] = useState("");
  const [showAddTx, setShowAddTx] = useState(false);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpense;

  const expByCategory = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [transactions]);

  const incByCategory = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "income").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [transactions]);

  const donutExpData = Object.entries(expByCategory).map(([k, v]) => ({ label: k, value: v, color: CATEGORY_COLORS[k] || "#999" }));
  const donutIncData = Object.entries(incByCategory).map(([k, v]) => ({ label: k, value: v, color: CATEGORY_COLORS[k] || "#999" }));

  const filteredTx = useMemo(() =>
    transactions.filter(t => filterType === "all" || t.type === filterType)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, filterType]);

  function addTransaction() {
    if (!form.category || !form.amount || !form.date) return;
    setTransactions(prev => [...prev, { ...form, id: Date.now(), amount: parseFloat(form.amount) }]);
    setForm({ type: "expense", category: "", amount: "", desc: "", date: new Date().toISOString().slice(0, 10) });
    setShowAddTx(false);
  }

  function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  function addGoal() {
    if (!goalForm.name || !goalForm.target) return;
    setGoals(prev => [...prev, { id: Date.now(), name: goalForm.name, target: parseFloat(goalForm.target), saved: parseFloat(goalForm.saved) || 0, color: "#2D6A4F", emoji: goalForm.emoji }]);
    setGoalForm({ name: "", target: "", saved: "", emoji: "🎯" });
    setAddingGoal(false);
  }

  function addToGoal(id) {
    const amt = parseFloat(editGoalAmount);
    if (!amt) return;
    setGoals(prev => prev.map(g => g.id === id ? { ...g, saved: Math.min(g.saved + amt, g.target) } : g));
    setEditGoalId(null);
    setEditGoalAmount("");
  }

  const s = {
    app: { fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#FAFAF8", minHeight: "100dvh", color: "#1A1A18", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" },
    header: { background: "#FFFFFF", borderBottom: "1px solid #EBEBEA", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
    logo: { fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" },
    logoAccent: { color: "#2D6A4F" },
    main: { flex: 1, padding: "20px 16px 100px", overflowY: "auto" },
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#FFFFFF", borderTop: "1px solid #EBEBEA", display: "flex", padding: "8px 0 20px", zIndex: 10 },
    navBtn: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: active ? "#2D6A4F" : "#9B9B96" }),
    navLabel: (active) => ({ fontSize: 10, fontWeight: active ? 700 : 400 }),
    navIcon: { fontSize: 20 },
    card: { background: "#FFFFFF", borderRadius: 16, padding: 18, border: "1px solid #EBEBEA", marginBottom: 14 },
    cardTitle: { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B9B96", marginBottom: 10 },
    statValue: { fontSize: 28, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.1 },
    sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 14, letterSpacing: "-0.3px" },
    input: { width: "100%", border: "1px solid #E2E2E0", borderRadius: 12, padding: "13px 14px", fontSize: 16, background: "#FAFAF8", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#1A1A18", WebkitAppearance: "none" },
    select: { width: "100%", border: "1px solid #E2E2E0", borderRadius: 12, padding: "13px 14px", fontSize: 16, background: "#FAFAF8", outline: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer", color: "#1A1A18", WebkitAppearance: "none" },
    btn: (color = "#2D6A4F") => ({ background: color, color: "#FFF", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" }),
    btnGhost: { background: "transparent", color: "#6B6B67", border: "1px solid #E2E2E0", borderRadius: 12, padding: "12px 16px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
    txRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F5F5F3" },
    fab: { position: "fixed", bottom: 80, right: 20, width: 52, height: 52, borderRadius: "50%", background: "#2D6A4F", border: "none", color: "#FFF", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(45,106,79,0.35)", zIndex: 20 },
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 30, display: "flex", alignItems: "flex-end" },
    modalContent: { background: "#FFFFFF", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430, margin: "0 auto" },
  };

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const Dashboard = () => (
    <div>
      <div style={s.card}>
        <div style={s.cardTitle}>Balance del mes</div>
        <div style={{ ...s.statValue, color: balance >= 0 ? "#2D6A4F" : "#C9184A" }}>{formatMXN(balance)}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: "#9B9B96" }}>Ingresos</div>
            <div style={{ fontWeight: 700, color: "#2D6A4F", fontSize: 15 }}>{formatMXN(totalIncome)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9B9B96" }}>Gastos</div>
            <div style={{ fontWeight: 700, color: "#C9184A", fontSize: 15 }}>{formatMXN(totalExpense)}</div>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Gastos por categoría</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <DonutChart data={donutExpData} size={110} />
          <div style={{ flex: 1 }}>
            {donutExpData.slice(0, 4).map(d => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1, color: "#6B6B67" }}>{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{formatMXN(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={s.sectionTitle}>Últimos movimientos</div>
          <button style={{ ...s.btnGhost, padding: "6px 12px", fontSize: 12 }} onClick={() => setView("transactions")}>Ver todos</button>
        </div>
        {transactions.slice(-4).reverse().map(t => (
          <div key={t.id} style={s.txRow}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: (CATEGORY_COLORS[t.category] || "#999") + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {t.type === "income" ? "↑" : "↓"}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.desc || t.category}</div>
                <div style={{ fontSize: 11, color: "#9B9B96" }}>{t.category}</div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: t.type === "income" ? "#2D6A4F" : "#1A1A18" }}>
              {t.type === "income" ? "+" : "-"}{formatMXN(t.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────
  const Transactions = () => (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "income", "expense"].map(f => (
          <button key={f} onClick={() => setFilterType(f)} style={{
            background: filterType === f ? "#1A1A18" : "transparent",
            color: filterType === f ? "#FFF" : "#6B6B67",
            border: "1px solid " + (filterType === f ? "#1A1A18" : "#E2E2E0"),
            borderRadius: 20, padding: "7px 16px", fontSize: 13,
            fontWeight: filterType === f ? 600 : 400, cursor: "pointer", fontFamily: "inherit"
          }}>
            {f === "all" ? "Todos" : f === "income" ? "Ingresos" : "Gastos"}
          </button>
        ))}
      </div>
      <div style={s.card}>
        {filteredTx.length === 0 && <div style={{ color: "#9B9B96", fontSize: 14, textAlign: "center", padding: 24 }}>Sin movimientos</div>}
        {filteredTx.map(t => (
          <div key={t.id} style={s.txRow}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: (CATEGORY_COLORS[t.category] || "#999") + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: CATEGORY_COLORS[t.category] || "#999" }}>
                {t.type === "income" ? "+" : "−"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.desc || t.category}</div>
                <div style={{ fontSize: 11, color: "#9B9B96" }}>{t.date} · {t.category}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: t.type === "income" ? "#2D6A4F" : "#1A1A18" }}>
                {t.type === "income" ? "+" : "-"}{formatMXN(t.amount)}
              </span>
              <button onClick={() => deleteTransaction(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#CBCBC8", fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button style={s.fab} onClick={() => setShowAddTx(true)}>+</button>

      {/* Modal agregar */}
      {showAddTx && (
        <div style={s.modal} onClick={() => setShowAddTx(false)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ ...s.sectionTitle, marginBottom: 20 }}>Nuevo movimiento</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {["expense", "income"].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: "" }))} style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "1px solid " + (form.type === t ? "#2D6A4F" : "#E2E2E0"),
                  background: form.type === t ? "#F0F4F1" : "transparent", color: form.type === t ? "#2D6A4F" : "#6B6B67",
                  fontWeight: form.type === t ? 700 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
                }}>
                  {t === "expense" ? "Gasto" : "Ingreso"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <select style={s.select} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Categoría</option>
                {CATEGORIES[form.type].map(c => <option key={c}>{c}</option>)}
              </select>
              <input style={s.input} type="number" inputMode="decimal" placeholder="Monto" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              <input style={s.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <input style={s.input} placeholder="Descripción (opcional)" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
            </div>
            <button style={s.btn()} onClick={addTransaction}>Agregar movimiento</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── BUDGET ────────────────────────────────────────────────────────────────
  const Budget = () => (
    <div>
      <div style={s.card}>
        <div style={s.sectionTitle}>Presupuesto mensual</div>
        {CATEGORIES.expense.map(cat => {
          const budget = budgets[cat] || 0;
          const spent = expByCategory[cat] || 0;
          const over = spent > budget;
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          return (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[cat] }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{cat}</span>
                </div>
                <div style={{ fontSize: 12, color: over ? "#C9184A" : "#9B9B96", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{formatMXN(spent)} /</span>
                  <input type="number" value={budget}
                    onChange={e => setBudgets(b => ({ ...b, [cat]: parseFloat(e.target.value) || 0 }))}
                    style={{ border: "none", background: "transparent", width: 65, textAlign: "right", fontSize: 12, fontWeight: 600, color: "#1A1A18", outline: "none", fontFamily: "inherit" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MiniBar value={spent} max={budget} color={CATEGORY_COLORS[cat]} />
                <span style={{ fontSize: 11, color: over ? "#C9184A" : "#9B9B96", width: 32, textAlign: "right" }}>{pct.toFixed(0)}%</span>
              </div>
              {over && <div style={{ fontSize: 11, color: "#C9184A", marginTop: 3 }}>+{formatMXN(spent - budget)} excedido</div>}
            </div>
          );
        })}
        <div style={{ paddingTop: 14, borderTop: "1px solid #F0F0EE" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "#9B9B96" }}>Presupuestado</span>
            <span style={{ fontWeight: 700 }}>{formatMXN(Object.values(budgets).reduce((a, b) => a + b, 0))}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#9B9B96" }}>Gastado</span>
            <span style={{ fontWeight: 700, color: "#C9184A" }}>{formatMXN(totalExpense)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── GOALS ─────────────────────────────────────────────────────────────────
  const Goals = () => (
    <div>
      {goals.map(g => {
        const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
        const done = pct >= 100;
        return (
          <div key={g.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 26 }}>{g.emoji}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "#9B9B96" }}>{done ? "¡Meta alcanzada! 🎉" : `Faltan ${formatMXN(g.target - g.saved)}`}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: done ? "#2D6A4F" : "#1A1A18" }}>{formatMXN(g.saved)}</div>
                <div style={{ fontSize: 11, color: "#9B9B96" }}>de {formatMXN(g.target)}</div>
              </div>
            </div>
            <div style={{ background: "#F0F0EE", borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: done ? "#2D6A4F" : g.color, borderRadius: 8, transition: "width 0.7s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: done ? "#2D6A4F" : g.color }}>{pct.toFixed(1)}%</span>
              {!done && (
                editGoalId === g.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="number" inputMode="decimal" placeholder="Monto" value={editGoalAmount}
                      onChange={e => setEditGoalAmount(e.target.value)}
                      style={{ ...s.input, width: 100, padding: "8px 12px", fontSize: 14 }} />
                    <button style={{ ...s.btn(), width: "auto", padding: "8px 14px", fontSize: 13 }} onClick={() => addToGoal(g.id)}>Añadir</button>
                    <button style={{ ...s.btnGhost, padding: "8px 12px" }} onClick={() => setEditGoalId(null)}>✕</button>
                  </div>
                ) : (
                  <button style={{ ...s.btnGhost, fontSize: 13, padding: "8px 14px" }} onClick={() => setEditGoalId(g.id)}>+ Abonar</button>
                )
              )}
            </div>
          </div>
        );
      })}

      {addingGoal ? (
        <div style={s.card}>
          <div style={s.sectionTitle}>Nueva meta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <input style={s.input} placeholder="Nombre de la meta" value={goalForm.name} onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} />
            <input style={s.input} placeholder="Emoji (ej: 🏠)" value={goalForm.emoji} onChange={e => setGoalForm(f => ({ ...f, emoji: e.target.value }))} />
            <input style={s.input} type="number" inputMode="decimal" placeholder="Meta total ($)" value={goalForm.target} onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))} />
            <input style={s.input} type="number" inputMode="decimal" placeholder="Ya ahorrado ($)" value={goalForm.saved} onChange={e => setGoalForm(f => ({ ...f, saved: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={s.btn()} onClick={addGoal}>Crear meta</button>
            <button style={{ ...s.btnGhost, flex: "0 0 auto" }} onClick={() => setAddingGoal(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingGoal(true)} style={{ width: "100%", padding: 18, borderRadius: 16, border: "1.5px dashed #D0D0CC", background: "transparent", fontSize: 14, color: "#9B9B96", cursor: "pointer", fontFamily: "inherit" }}>
          + Nueva meta de ahorro
        </button>
      )}
    </div>
  );

  const views = { dashboard: <Dashboard />, transactions: <Transactions />, budget: <Budget />, goals: <Goals /> };
  const navItems = [
    { id: "dashboard", label: "Resumen", icon: "📊" },
    { id: "transactions", label: "Gastos", icon: "💸" },
    { id: "budget", label: "Presupuesto", icon: "📋" },
    { id: "goals", label: "Metas", icon: "🎯" },
  ];

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <header style={s.header}>
        <div style={s.logo}>fin<span style={s.logoAccent}>·</span>flow</div>
        <div style={{ fontSize: 12, color: "#9B9B96" }}>Mayo 2026</div>
      </header>
      <main style={s.main}>
        {views[view]}
      </main>
      <nav style={s.bottomNav}>
        {navItems.map(n => (
          <button key={n.id} style={s.navBtn(view === n.id)} onClick={() => setView(n.id)}>
            <span style={s.navIcon}>{n.icon}</span>
            <span style={s.navLabel(view === n.id)}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
