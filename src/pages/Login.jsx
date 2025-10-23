import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const nav = useNavigate();

  // 🧩 Login normal con correo y contraseña
  const submit = (e) => {
    e.preventDefault();
    const list = JSON.parse(localStorage.getItem("users") || "[]");
    const u = list.find((x) => x.email === email && x.password === pw);
    if (u) {
      setUser(u);
      nav(u.role === "docente" ? "/docente" : "/estudiante");
    } else {
      alert("Credenciales inválidas");
    }
  };

  // 🔥 Login con Google corregido
  const handleGoogleLogin = async () => {
    try {
      const u = await loginWithGoogle("estudiante"); // rol por defecto
      if (!u) return; // si hubo error o conflicto, se detiene

      // ✅ Si el login fue exitoso, redirige automáticamente
      setUser(u);
      nav(u.role === "docente" ? "/docente" : "/estudiante");
    } catch (err) {
      console.error("Error en inicio de sesión con Google:", err);
      alert("Error al iniciar sesión con Google");
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>

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

        <button className="btn btn-primary w-full">Entrar</button>
      </form>

      <div className="mt-6 text-center">
        <p className="mb-2">O entra con:</p>
        <button onClick={handleGoogleLogin} className="btn btn-outline w-full">
          Google
        </button>
      </div>
    </div>
  );
}
