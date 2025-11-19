import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate, Link } from "react-router-dom";
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

        <button className="btn btn-primary w-full">Entrar</button>
      </form>

      <div className="mt-6 text-center">
        <p className="mb-2">O entra con:</p>
        <button
          onClick={handleGoogleLogin}
          className="btn btn-outline w-full"
        >
          Google
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
