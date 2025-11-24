import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { loginWithGoogle } from "../lib/firebase";
import { apiLogin } from "../lib/api";
import { isValidEmailDomain, getEmailValidationError } from "../lib/emailValidator"; // <-- AGREGADO

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ VALIDAR EMAIL ANTES DE ENVIAR
    if (!isValidEmailDomain(email)) {
      alert(getEmailValidationError(email));
      setLoading(false);
      return;
    }

    try {
      const response = await apiLogin({ email, password: pw });

      if (response.ok && response.user) {
        setUser(response.user);
        nav(response.user.role === "docente" ? "/docente" : "/estudiante");
      } else {
        alert("❌ " + (response.error || "Error al iniciar sesión"));
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.message
        || err.message 
        || "Error al iniciar sesión";
      
      alert("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const u = await loginWithGoogle("estudiante");
      if (!u) return;

      setUser(u);
      nav(u.role === "docente" ? "/docente" : "/estudiante");
    } catch (err) {
      console.error("Google login error:", err);
      alert("Error al iniciar sesión con Google");
    }
  };

  return (
    <div className="card max-w-md mx-auto overflow-hidden">
      <img
        src="https://cdn-icons-png.flaticon.com/128/19007/19007760.png"
        alt="Login Aula Segura"
        className="w-full h-40 object-cover rounded-xl mb-4"
      />

      <h2 className="text-2xl font-bold mb-1 text-center">
        Iniciar sesión
      </h2>
      <p className="text-center mb-4">
        Accede a tu cuenta para continuar
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Correo</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Contraseña</label>
          <input
            className="input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
        </div>

        <button 
          className="btn btn-primary w-full" 
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {/* 🎯 NUEVO: Botón de acceso como invitado */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O</span>
          </div>
        </div>

        <button
          onClick={() => nav("/invitado")}
          className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg flex items-center justify-center gap-2"
        >
          <span className="text-xl">🎯</span>
          Entrar como invitado (sin cuenta)
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="mb-2">O entra con:</p>
        <button
          onClick={handleGoogleLogin}
          className="btn btn-outline w-full"
          disabled={loading}
        >
          🔵 Google
        </button>
      </div>

      <p className="text-center text-sm mt-4">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-blue-500 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
