import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Banner from "./components/Banner";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Student from "./pages/Student";
import Teacher from "./pages/Teacher";
import Results from "./pages/Results"; // ← 🔵 NUEVO
import Home from "./pages/Home";
import { getUser, logout } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";

function Protected({ role, children }) {
  const u = getUser();
  if (!u) return <Navigate to="/login" />;

  if (role && u.role !== role)
    return <Navigate to={u.role === "docente" ? "/docente" : "/estudiante"} />;

  return children;
}

export default function App() {
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const autoRedirect = user ? (
    <Navigate to={user.role === "docente" ? "/docente" : "/estudiante"} replace />
  ) : null;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Banner />
        <Navbar user={user} onLogout={logout} />

        <div className="max-w-5xl mx-auto px-3 py-6">
          <Routes>
            {/* 🏠 Inicio */}
            <Route path="/" element={<Home />} />

            {/* 🔐 Login / Registro */}
            <Route
              path="/login"
              element={user ? autoRedirect : <Login />}
            />
            <Route
              path="/register"
              element={user ? autoRedirect : <Register />}
            />

            {/* 🎓 Estudiante */}
            <Route
              path="/estudiante"
              element={
                <Protected role="estudiante">
                  <Student />
                </Protected>
              }
            />

            {/* 👨‍🏫 Docente */}
            <Route
              path="/docente"
              element={
                <Protected role="docente">
                  <Teacher />
                </Protected>
              }
            />

            {/* 🆕 📊 Resultados — protegida para docentes */}
            <Route
              path="/resultados"
              element={
                <Protected role="docente">
                  <Results />
                </Protected>
              }
            />

            {/* 🚪 Default */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}
