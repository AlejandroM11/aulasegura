import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../lib/firebase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState("estudiante");
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    let list = JSON.parse(localStorage.getItem("users") || "[]");
    if (list.some((u) => u.email === email))
      return alert("Ese correo ya existe.");
    const u = { email, password: pw, role };
    list.push(u);
    localStorage.setItem("users", JSON.stringify(list));
    setUser(u);
    nav(role === "docente" ? "/docente" : "/estudiante");
  };

  const handleGoogleRegister = async () => {
    try {
      const u = await loginWithGoogle(role);
      setUser(u);
      nav(u.role === "docente" ? "/docente" : "/estudiante");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Crear cuenta</h2>
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
        <div>
          <label className="label">Rol</label>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
          </select>
        </div>
        <button className="btn btn-primary w-full">Registrarme</button>
      </form>

      <div className="mt-6 text-center">
        <p className="mb-2">O regístrate con:</p>
        <button
          onClick={handleGoogleRegister}
          className="btn btn-outline w-full"
        >
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
