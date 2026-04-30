import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const API = "https://campusbudget.onrender.com";

const CATEGORIES = [
  "Food & Dining", "Groceries", "Transportation", "Housing & Rent",
  "Utilities", "Entertainment", "Healthcare", "Education",
  "Clothing", "Personal Care", "Subscriptions", "Travel",
  "Fitness", "Gifts & Donations", "Electronics", "Other"
];

const COLORS = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#a855f7","#ec4899","#14b8a6","#f97316"];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: "11px", fontWeight: "bold" }}>
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

function Calendar({ expenses, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [position, setPosition] = useState({ x: window.innerWidth - 240, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];

  const spendingByDay = {};
  expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      spendingByDay[day] = (spendingByDay[day] || 0) + e.amount;
    }
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const allCells = [...blanks, ...days];

  const onMouseDown = (e) => {
    setDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (dragging) {
        setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
      }
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  return (
    <div style={{
      ...calStyles.wrapper,
      left: position.x,
      top: position.y,
      right: "unset",
      cursor: dragging ? "grabbing" : "default"
    }}>
      {/* Drag Handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          textAlign: "center", color: "#4b5563", fontSize: "14px",
          marginBottom: "6px", userSelect: "none", cursor: dragging ? "grabbing" : "grab",
          letterSpacing: "4px", paddingBottom: "4px",
          borderBottom: "1px solid #1f2937"
        }}
      >
        ⠿ ⠿ ⠿
      </div>

      <div style={calStyles.header}>
        <button onClick={prevMonth} style={calStyles.navBtn}>‹</button>
        <span style={calStyles.monthLabel}>{monthNames[month]} {year}</span>
        <button onClick={nextMonth} style={calStyles.navBtn}>›</button>
      </div>

      <div style={calStyles.grid}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={calStyles.dayLabel}>{d}</div>
        ))}
        {allCells.map((day, i) => {
          const spent = day ? spendingByDay[day] : null;
          const hasSpending = spent > 0;
          const today = new Date();
          const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          return (
            <div
              key={i}
              onClick={() => day && onDateClick(new Date(year, month, day))}
              title={day ? `Click to add expense on ${monthNames[month]} ${day}` : ""}
              style={{
                ...calStyles.cell,
                background: hasSpending ? "#1e3a5f" : isToday ? "#1f2937" : "transparent",
                border: isToday ? "1px solid #3b82f6" : hasSpending ? "1px solid #3b82f6" : "1px solid transparent",
                color: day ? "white" : "transparent",
                cursor: day ? "pointer" : "default",
                outline: isToday ? "2px solid #3b82f680" : "none",
              }}
              onMouseEnter={e => { if (day) e.currentTarget.style.background = "#1e3a5f88"; }}
              onMouseLeave={e => { if (day) e.currentTarget.style.background = hasSpending ? "#1e3a5f" : isToday ? "#1f2937" : "transparent"; }}
            >
              <div style={{ fontSize: "11px", fontWeight: "bold" }}>{day || ""}</div>
              {hasSpending && (
                <div style={{ fontSize: "9px", color: "#60a5fa", marginTop: "1px" }}>${spent}</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: "8px", fontSize: "9px", color: "#4b5563" }}>
        Click a date to add expense
      </div>
    </div>
  );
}

const calStyles = {
  wrapper: {
    background: "#111827", borderRadius: "12px", padding: "12px",
    width: "220px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    position: "fixed", zIndex: 100,
    border: "1px solid #1f2937"
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  monthLabel: { color: "white", fontSize: "13px", fontWeight: "bold" },
  navBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px", padding: "0 4px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" },
  dayLabel: { color: "#6b7280", fontSize: "10px", textAlign: "center", padding: "2px 0", fontWeight: "bold" },
  cell: { borderRadius: "4px", padding: "3px 2px", textAlign: "center", fontSize: "11px", minHeight: "28px", transition: "background 0.15s" }
};

function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [securityStep, setSecurityStep] = useState(1);
  const [question, setQuestion] = useState("");
  const [authForm, setAuthForm] = useState({
    username: "", password: "", monthlyIncome: "",
    monthlyBudget: "", securityQuestion: "", securityAnswer: ""
  });
  const [resetData, setResetData] = useState({ username: "", answer: "", newPassword: "" });
  const [form, setForm] = useState({ title: "", amount: "", category: "" });
  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ monthlyIncome: "", monthlyBudget: "" });

  // Calendar date modal state
  const [calendarModal, setCalendarModal] = useState({ open: false, date: null });
  const [calForm, setCalForm] = useState({ title: "", amount: "", category: "" });
  const [calCustomCategory, setCalCustomCategory] = useState("");
  const [calIsCustom, setCalIsCustom] = useState(false);

  const getHeaders = () => ({
    headers: { Authorization: localStorage.getItem("token") }
  });

  const handleAuth = async () => {
    try {
      if (mode === "register") {
        await axios.post(`${API}/api/auth/register`, authForm);
        alert("Account created");
        setMode("login");
        return;
      }
      const res = await axios.post(`${API}/api/auth/login`, authForm);
      localStorage.setItem("token", res.data.token);
      setUser(res.data.userId);
      setLoginAttempts(0);
    } catch {
      setLoginAttempts((prev) => prev + 1);
      alert("Invalid login");
    }
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  const getQuestion = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/security-question`, { username: resetData.username });
      setQuestion(res.data.question);
      setSecurityStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "Invalid username");
    }
  };

  const resetWithSecurity = async () => {
    try {
      await axios.post(`${API}/api/auth/security-reset`, {
        username: resetData.username, answer: resetData.answer, newPassword: resetData.newPassword
      });
      alert("Password reset successful");
      setMode("login"); setSecurityStep(1);
      setResetData({ username: "", answer: "", newPassword: "" });
      setQuestion("");
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/api/auth/me`, getHeaders());
      setUserData(res.data);
      setSettingsForm({
        monthlyIncome: res.data.monthlyIncome || "",
        monthlyBudget: res.data.monthlyBudget || ""
      });
    } catch (err) {
      console.log("fetchUser not available on this server");
    }
  };

  const fetchExpenses = async () => {
    const res = await axios.get(`${API}/api/expenses`, getHeaders());
    setExpenses(res.data);
  };

  const updateSettings = async () => {
    try {
      await axios.put(`${API}/api/auth/update`, settingsForm, getHeaders());
      alert("Settings updated!");
      setShowSettings(false);
      fetchUser();
    } catch (err) {
      alert(err.response?.data?.error || "Error updating settings");
    }
  };

  const addExpense = async () => {
    try {
      const finalCategory = isCustom ? customCategory : form.category;
      if (!form.title || !form.amount || !finalCategory) {
        alert("Please fill out all fields");
        return;
      }
      await axios.post(`${API}/api/expenses`, { ...form, category: finalCategory }, getHeaders());
      setForm({ title: "", amount: "", category: "" });
      setCustomCategory("");
      setIsCustom(false);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.error || "Error adding expense");
    }
  };

  const addExpenseForDate = async () => {
    try {
      const finalCategory = calIsCustom ? calCustomCategory : calForm.category;
      if (!calForm.title || !calForm.amount || !finalCategory) {
        alert("Please fill out all fields");
        return;
      }
      await axios.post(`${API}/api/expenses`, {
        ...calForm,
        category: finalCategory,
        date: calendarModal.date
      }, getHeaders());
      setCalForm({ title: "", amount: "", category: "" });
      setCalCustomCategory("");
      setCalIsCustom(false);
      setCalendarModal({ open: false, date: null });
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.error || "Error adding expense");
    }
  };

  const deleteExpense = async (id) => {
    await axios.delete(`${API}/api/expenses/${id}`, getHeaders());
    fetchExpenses();
  };

  useEffect(() => {
    if (user) { fetchUser(); fetchExpenses(); }
  }, [user]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budget = userData?.monthlyBudget || 1;
  const percent = Math.min((totalSpent / budget) * 100, 100);
  const color = percent < 70 ? "#22c55e" : percent < 90 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    let start = 0;
    const timer = setInterval(() => {
      start += 1;
      setAnimatedPercent(start);
      if (start >= percent) clearInterval(timer);
    }, 10);
    return () => clearInterval(timer);
  }, [percent]);

  const categoryData = Object.values(
    expenses.reduce((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { name: e.category, value: 0 };
      acc[e.category].value += e.amount;
      return acc;
    }, {})
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <div style={styles.centerPage}>
        <div style={styles.authCard}>
          <h2 style={{ color: "white", marginBottom: "16px" }}>CampusBudget</h2>
          <div style={styles.tabContainer}>
            <button style={mode === "login" ? styles.activeTab : styles.tab} onClick={() => setMode("login")}>Login</button>
            <button style={mode === "register" ? styles.activeTab : styles.tab} onClick={() => setMode("register")}>Sign Up</button>
          </div>
          {mode !== "reset" && (
            <>
              <input style={styles.input} placeholder="Username"
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} />
              <input style={styles.input} type="password" placeholder="Password"
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
            </>
          )}
          {mode === "register" && (
            <>
              <input style={styles.input} placeholder="Monthly Income"
                onChange={(e) => setAuthForm({ ...authForm, monthlyIncome: e.target.value })} />
              <input style={styles.input} placeholder="Monthly Budget"
                onChange={(e) => setAuthForm({ ...authForm, monthlyBudget: e.target.value })} />
              <input style={styles.input} placeholder="Security Question"
                onChange={(e) => setAuthForm({ ...authForm, securityQuestion: e.target.value })} />
              <input style={styles.input} placeholder="Security Answer"
                onChange={(e) => setAuthForm({ ...authForm, securityAnswer: e.target.value })} />
            </>
          )}
          {mode === "reset" && (
            <>
              {securityStep === 1 && (
                <>
                  <input style={styles.input} placeholder="Username"
                    onChange={(e) => setResetData({ ...resetData, username: e.target.value })} />
                  <button style={styles.authBtn} onClick={getQuestion}>Continue</button>
                </>
              )}
              {securityStep === 2 && (
                <>
                  <p style={{ color: "#9ca3af" }}>{question}</p>
                  <input style={styles.input} placeholder="Answer"
                    onChange={(e) => setResetData({ ...resetData, answer: e.target.value })} />
                  <input style={styles.input} placeholder="New Password"
                    onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} />
                  <button style={styles.authBtn} onClick={resetWithSecurity}>Reset Password</button>
                </>
              )}
            </>
          )}
          {mode !== "reset" && (
            <button style={styles.authBtn} onClick={handleAuth}>
              {mode === "login" ? "Login" : "Create Account"}
            </button>
          )}
          {loginAttempts >= 3 && (
            <button style={{ ...styles.authBtn, background: "#374151", marginTop: "8px" }}
              onClick={() => setMode("reset")}>Forgot Password?</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", paddingRight: "260px", background: "#0f172a", minHeight: "100vh", color: "white" }}>

      {/* Draggable Calendar with click-to-add */}
      <Calendar
        expenses={expenses}
        onDateClick={(date) => {
          setCalForm({ title: "", amount: "", category: "" });
          setCalCustomCategory("");
          setCalIsCustom(false);
          setCalendarModal({ open: true, date });
        }}
      />

      {/* Calendar Date Expense Modal */}
      {calendarModal.open && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0, color: "white" }}>
              ➕ Add Expense for {calendarModal.date?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <input style={styles.input} placeholder="Title" value={calForm.title}
              onChange={(e) => setCalForm({ ...calForm, title: e.target.value })} />
            <input style={styles.input} placeholder="Amount" type="number" value={calForm.amount}
              onChange={(e) => setCalForm({ ...calForm, amount: Number(e.target.value) })} />
            <select style={{ ...styles.input, marginBottom: "10px" }}
              value={calIsCustom ? "custom" : calForm.category}
              onChange={(e) => {
                if (e.target.value === "custom") { setCalIsCustom(true); setCalForm({ ...calForm, category: "" }); }
                else { setCalIsCustom(false); setCalForm({ ...calForm, category: e.target.value }); }
              }}>
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="custom">✏️ Type my own...</option>
            </select>
            {calIsCustom && (
              <input style={styles.input} placeholder="Enter custom category" value={calCustomCategory}
                onChange={(e) => setCalCustomCategory(e.target.value)} />
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button style={styles.authBtn} onClick={addExpenseForDate}>Add Expense</button>
              <button style={{ ...styles.authBtn, background: "#374151" }}
                onClick={() => setCalendarModal({ open: false, date: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0, color: "white" }}>⚙️ Update Settings</h3>
            <label style={styles.label}>Monthly Income</label>
            <input style={styles.input} type="number" placeholder="Monthly Income"
              value={settingsForm.monthlyIncome}
              onChange={(e) => setSettingsForm({ ...settingsForm, monthlyIncome: Number(e.target.value) })} />
            <label style={styles.label}>Monthly Budget</label>
            <input style={styles.input} type="number" placeholder="Monthly Budget"
              value={settingsForm.monthlyBudget}
              onChange={(e) => setSettingsForm({ ...settingsForm, monthlyBudget: Number(e.target.value) })} />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button style={styles.authBtn} onClick={updateSettings}>Save Changes</button>
              <button style={{ ...styles.authBtn, background: "#374151" }}
                onClick={() => setShowSettings(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>CampusBudget</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowSettings(true)}
            style={{ background: "#374151", border: "none", padding: "8px 16px", borderRadius: "8px", color: "white", cursor: "pointer" }}>
            ⚙️ Settings
          </button>
          <button onClick={logout}
            style={{ background: "#ef4444", border: "none", padding: "8px 16px", borderRadius: "8px", color: "white", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {/* User Info Bar */}
      <div style={{ background: "#111827", borderRadius: "12px", padding: "12px 20px", marginBottom: "20px", display: "flex", gap: "30px" }}>
        <span style={{ color: "#9ca3af" }}>👤 <strong style={{ color: "white" }}>{userData?.username}</strong></span>
        <span style={{ color: "#9ca3af" }}>💰 Income: <strong style={{ color: "#22c55e" }}>${userData?.monthlyIncome || 0}</strong></span>
        <span style={{ color: "#9ca3af" }}>🎯 Budget: <strong style={{ color: "#3b82f6" }}>${userData?.monthlyBudget || 0}</strong></span>
        <span style={{ color: "#9ca3af" }}>💸 Spent: <strong style={{ color: color }}>${totalSpent}</strong></span>
      </div>

      {/* Budget Wheel */}
      <div style={styles.circleWrapper}>
        <div style={{
          ...styles.circle,
          background: `conic-gradient(${color} ${animatedPercent}%, #1f2937 ${animatedPercent}%)`
        }}>
          <div style={styles.innerCircle}>
            <h2 style={{ margin: 0, color }}>{Math.round(animatedPercent)}%</h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>${totalSpent} / ${budget}</p>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div style={{ width: "100%", height: 300, marginBottom: "20px" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={categoryData} dataKey="value" label={renderCustomizedLabel}>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => `$${val}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Add Expense Form */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Title" value={form.title} style={styles.formInput}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Amount" type="number" value={form.amount}
          style={{ ...styles.formInput, width: "100px" }}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
        <select style={styles.formInput}
          value={isCustom ? "custom" : form.category}
          onChange={(e) => {
            if (e.target.value === "custom") { setIsCustom(true); setForm({ ...form, category: "" }); }
            else { setIsCustom(false); setForm({ ...form, category: e.target.value }); }
          }}>
          <option value="">Select Category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="custom">✏️ Type my own...</option>
        </select>
        {isCustom && (
          <input placeholder="Enter custom category" value={customCategory}
            style={styles.formInput}
            onChange={(e) => setCustomCategory(e.target.value)} />
        )}
        <button onClick={addExpense}
          style={{ background: "#2563eb", border: "none", padding: "10px 20px", borderRadius: "8px", color: "white", cursor: "pointer", fontWeight: "bold" }}>
          Add Expense
        </button>
      </div>

      {/* Expense Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #374151" }}>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Date & Time</th>
            <th style={styles.th}>Delete</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(e => (
            <tr key={e._id} style={{ borderBottom: "1px solid #1f2937" }}>
              <td style={styles.td}>{e.title}</td>
              <td style={styles.td}>${e.amount}</td>
              <td style={styles.td}>
                <span style={{ background: "#1e3a5f", color: "#60a5fa", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                  {e.category}
                </span>
              </td>
              <td style={{ ...styles.td, color: "#9ca3af", fontSize: "12px" }}>{formatDate(e.date)}</td>
              <td style={styles.td}>
                <button onClick={() => deleteExpense(e._id)}
                  style={{ background: "#ef4444", border: "none", padding: "4px 10px", borderRadius: "6px", color: "white", cursor: "pointer" }}>
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  centerPage: {
    height: "100vh", display: "flex", justifyContent: "center",
    alignItems: "center", background: "linear-gradient(135deg, #0f172a, #1e293b)"
  },
  authCard: {
    background: "#111827", padding: "30px", width: "320px",
    borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
  },
  tabContainer: { display: "flex", marginBottom: "15px", borderRadius: "8px", overflow: "hidden" },
  tab: { flex: 1, padding: "10px", background: "#1f2937", color: "#9ca3af", border: "none", cursor: "pointer" },
  activeTab: { flex: 1, padding: "10px", background: "#2563eb", color: "white", border: "none", cursor: "pointer" },
  input: {
    width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px",
    border: "1px solid #374151", background: "#1f2937", color: "white",
    outline: "none", boxSizing: "border-box"
  },
  authBtn: {
    width: "100%", padding: "10px", borderRadius: "8px", border: "none",
    background: "#2563eb", color: "white", cursor: "pointer", marginTop: "4px"
  },
  formInput: {
    padding: "10px", borderRadius: "8px", border: "1px solid #374151",
    background: "#1f2937", color: "white", outline: "none", fontSize: "14px"
  },
  label: { color: "#9ca3af", fontSize: "13px", marginBottom: "4px", display: "block" },
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)", display: "flex",
    justifyContent: "center", alignItems: "center", zIndex: 200
  },
  modal: {
    background: "#111827", padding: "30px", borderRadius: "16px",
    width: "340px", boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    border: "1px solid #374151"
  },
  circleWrapper: { display: "flex", justifyContent: "center", marginBottom: "20px" },
  circle: { width: "200px", height: "200px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" },
  innerCircle: {
    width: "130px", height: "130px", background: "#0f172a", borderRadius: "50%",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
  },
  th: { padding: "12px 10px", textAlign: "left", color: "#9ca3af", fontSize: "13px" },
  td: { padding: "12px 10px", color: "white" }
};

export default App;