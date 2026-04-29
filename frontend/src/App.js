import { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const API = "http://localhost:5000";

// Pie labels
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;

  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: "12px", fontWeight: "bold" }}
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [securityStep, setSecurityStep] = useState(1);
  const [question, setQuestion] = useState("");

  const [authForm, setAuthForm] = useState({
    username: "",
    password: "",
    monthlyIncome: "",
    monthlyBudget: "",
    securityQuestion: "",
    securityAnswer: ""
  });

  const [resetData, setResetData] = useState({
    username: "",
    answer: "",
    newPassword: ""
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: ""
  });

  const [expenses, setExpenses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  // AUTH
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

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  // RESET
const getQuestion = async () => {
  try {
    const res = await axios.post(`${API}/api/auth/security-question`, {
      username: resetData.username
    });

    setQuestion(res.data.question);
    setSecurityStep(2);
  } catch (err) {
    alert(err.response?.data?.error || "Invalid username, please try again");
  }
};

const resetWithSecurity = async () => {
  try {
    await axios.post(`${API}/api/auth/security-reset`, {
      username: resetData.username,
      answer: resetData.answer,
      newPassword: resetData.newPassword
    });

    alert("Password reset successful");

    // FULL RESET (this fixes duplicate UI bug)
    setMode("login");
    setSecurityStep(1);
    setResetData({
      username: "",
      answer: "",
      newPassword: ""
    });
    setQuestion("");

  } catch (err) {
    alert(err.response?.data?.error || "Error");
  }
};

  // DATA 3
  const fetchUser = async () => {
    const res = await axios.get(`${API}/api/auth/me`, getHeaders());
    setUserData(res.data);
  };

  const fetchExpenses = async () => {
    const res = await axios.get(`${API}/api/expenses`, getHeaders());
    setExpenses(res.data);
  };

const addExpense = async () => {
  try {
    // optional validation (recommended)
    if (!form.title || !form.amount || !form.category) {
      alert("Please fill out all fields");
      return;
    }

    await axios.post(`${API}/api/expenses`, form, getHeaders());

    setForm({ title: "", amount: "", category: "" });
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
  if (user) {
    fetchUser();
    fetchExpenses();
  }
}, [user]);

  // CALCULATIONS
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budget = userData?.monthlyBudget || 1;
  const percent = Math.min((totalSpent / budget) * 100, 100);

  const color =
    percent < 70 ? "#22c55e" : percent < 90 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    let start = 0;
    const end = percent;

    const timer = setInterval(() => {
      start += 1;
      setAnimatedPercent(start);
      if (start >= end) clearInterval(timer);
    }, 10);

    return () => clearInterval(timer);
  }, [percent]);

  const categoryData = Object.values(
    expenses.reduce((acc, e) => {
      if (!acc[e.category]) {
        acc[e.category] = { name: e.category, value: 0 };
      }
      acc[e.category].value += e.amount;
      return acc;
    }, {})
  );

  // AUTH UI
  if (!user) {
    return (
      <div style={styles.centerPage}>
        <div style={styles.authCard}>
          <h2>CampusBudget</h2>

          <div style={styles.tabContainer}>
            <button
              style={mode === "login" ? styles.activeTab : styles.tab}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              style={mode === "register" ? styles.activeTab : styles.tab}
              onClick={() => setMode("register")}
            >
              Sign Up
            </button>
          </div>

          {mode !== "reset" && (
            <>
              <input
                style={styles.input}
                placeholder="Username"
                onChange={(e) =>
                  setAuthForm({ ...authForm, username: e.target.value })
                }
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
              />
            </>
          )}

          {mode === "register" && (
            <>
              <input
                style={styles.input}
                placeholder="Monthly Income"
                onChange={(e) =>
                  setAuthForm({ ...authForm, monthlyIncome: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Monthly Budget"
                onChange={(e) =>
                  setAuthForm({ ...authForm, monthlyBudget: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Security Question"
                onChange={(e) =>
                  setAuthForm({ ...authForm, securityQuestion: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Security Answer"
                onChange={(e) =>
                  setAuthForm({ ...authForm, securityAnswer: e.target.value })
                }
              />
            </>
          )}

          {mode === "reset" && !user && (
            <>
              {securityStep === 1 && (
                <>
                  <input
                    style={styles.input}
                    placeholder="Username"
                    onChange={(e) =>
                      setResetData({ ...resetData, username: e.target.value })
                    }
                  />
                  <button onClick={getQuestion}>Continue</button>
                </>
              )}

              {securityStep === 2 && (
                <>
                  <p>{question}</p>
                  <input
                    style={styles.input}
                    placeholder="Answer"
                    onChange={(e) =>
                      setResetData({ ...resetData, answer: e.target.value })
                    }
                  />
                  <input
                    style={styles.input}
                    placeholder="New Password"
                    onChange={(e) =>
                      setResetData({
                        ...resetData,
                        newPassword: e.target.value
                      })
                    }
                  />
                  <button onClick={resetWithSecurity}>
                    Reset Password
                  </button>
                </>
              )}
            </>
          )}

          {mode !== "reset" && (
            <button onClick={handleAuth}>
              {mode === "login" ? "Login" : "Create Account"}
            </button>
          )}

          {loginAttempts >= 3 && (
            <button onClick={() => setMode("reset")}>
              Reset Password
            </button>
          )}
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={{ padding: "20px" }}>
      <h2>CampusBudget</h2>
      <button onClick={logout}>Logout</button>

      {/* 🔥 Budget Wheel */}
      <div style={styles.circleWrapper}>
        <div
          style={{
            ...styles.circle,
            background: `conic-gradient(${color} ${animatedPercent}%, #e5e7eb ${animatedPercent}%)`
          }}
        >
          <div style={styles.innerCircle}>
            <h2>{Math.round(animatedPercent)}%</h2>
            <p>${totalSpent} / ${budget}</p>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={categoryData} dataKey="value" label={renderCustomizedLabel}>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={["#3b82f6","#22c55e","#f59e0b","#ef4444"][i % 4]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

{/* Add Expense */}
<input
  placeholder="Title"
  value={form.title}
  onChange={(e) =>
    setForm({ ...form, title: e.target.value })
  }
/>

<input
  placeholder="Amount"
  type="number"
  value={form.amount}
  onChange={(e) =>
    setForm({
      ...form,
      amount: Number(e.target.value)
    })
  }
/>

<input
  placeholder="Category"
  value={form.category}
  onChange={(e) =>
    setForm({ ...form, category: e.target.value })
  }
/>

<button onClick={addExpense}>Add</button>

      {/* Expenses */}
      {expenses.map(e => (
        <div key={e._id}>
          {e.title} - ${e.amount}
          <button onClick={()=>deleteExpense(e._id)}>X</button>
        </div>
      ))}
    </div>
  );
}

// STYLES
const styles = {
  // PAGE
  centerPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)"
  },

  // AUTH CARD
  authCard: {
    background: "#111827",
    padding: "30px",
    width: "320px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    color: "white"
  },

  tabContainer: {
    display: "flex",
    marginBottom: "15px",
    borderRadius: "8px",
    overflow: "hidden"
  },

  tab: {
    flex: 1,
    padding: "10px",
    background: "#1f2937",
    color: "#9ca3af",
    border: "none",
    cursor: "pointer"
  },

  activeTab: {
    flex: 1,
    padding: "10px",
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer"
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#1f2937",
    color: "white",
    outline: "none"
  },

  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    marginTop: "10px"
  },

  secondaryButton: {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "none",
    background: "#374151",
    color: "#9ca3af",
    cursor: "pointer",
    marginTop: "10px"
  },

  // MAIN APP
  appContainer: {
    background: "#0f172a",
    minHeight: "100vh",
    padding: "20px",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  logoutButton: {
    background: "#ef4444",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer"
  },

  // CARD
  card: {
    background: "#111827",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.4)",
    marginBottom: "20px"
  },

  // CIRCLE
  circleWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px"
  },

  circle: {
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  innerCircle: {
    width: "130px",
    height: "130px",
    background: "#0f172a",
    borderRadius: "50%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },

  // EXPENSE INPUTS
  inputRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px"
  },

  // EXPENSE LIST
  expenseItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderBottom: "1px solid #1f2937"
  },

  deleteButton: {
    background: "#ef4444",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  }
  
};
export default App;