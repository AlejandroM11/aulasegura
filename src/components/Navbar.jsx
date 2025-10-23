import { Link, useNavigate } from "react-router-dom";
import { getUser, logout } from "../lib/auth";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../lib/theme";

export default function Navbar() {
  const nav = useNavigate();
  const { dark, setDark } = useContext(ThemeContext);
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
      <div className="max-w-5xl mx-auto px-3 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-semibold text-blue-600 dark:text-blue-400"
        >
          Aula Segura
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="btn btn-outline"
          >
            {dark ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
          {user ? (
            <>
              <span className="text-sm">
                {user.email} • <b>{user.role}</b>
              </span>
              <button
                className="btn btn-primary"
                onClick={() => {
                  logout();
                  nav("/login");
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Ingresar
              </Link>
              <Link to="/register" className="btn btn-outline">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
