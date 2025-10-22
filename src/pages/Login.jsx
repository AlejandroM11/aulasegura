import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const nav = useNavigate();

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

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle("estudiante"); // rol temporal
      const list = JSON.parse(localStorage.getItem("users") || "[]");
      const u = list.find((x) => x.email === result.email);
      if (!u)
        return alert(
          "Esa cuenta de Google no está registrada. Regístrate primero."
        );
      setUser(u);
      nav(u.role === "docente" ? "/docente" : "/estudiante");
    } catch (err) {
      console.error(err);
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
          />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input
            className="input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
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
