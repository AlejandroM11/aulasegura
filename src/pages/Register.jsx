import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { loginWithGoogle } from "../lib/firebase";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("estudiante");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔵 Registrar usuario en el backend
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password: pw,
        name,
        role
      });

      if (response.data.ok) {
        const newUser = {
          uid: response.data.uid,
          email: response.data.email,
          name: response.data.name,
          role: response.data.role,
          fromGoogle: false
        };

        // Guardar en localStorage y redirigir
        setUser(newUser);
        alert("✅ Cuenta creada exitosamente");
        nav(role === "docente" ? "/docente" : "/estudiante");
      } else {
        alert("❌ " + response.data.error);
      }
    } catch (err) {
      console.error("Error al registrar:", err);
      alert("❌ Error al crear la cuenta: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const u = await loginWithGoogle(role);
      if (u) {
        setUser(u);
        nav(u.role === "docente" ? "/docente" : "/estudiante");
      }
    } catch (err) {
      console.error(err);
      alert("Error al registrarse con Google");
    }
  };

  return (
    <div className="card max-w-md mx-auto overflow-hidden">
      <img
        src="https://img.freepik.com/free-vector/students-taking-exam-online_52683-39549.jpg"
        alt="Registro Aula Segura"
        className="w-full h-40 object-cover rounded-xl mb-4"
      />

      <h2 className="text-2xl font-bold mb-1 text-center">
        Crear cuenta
      </h2>
      <p className="text-center mb-4">
        Únete a Aula Segura y comienza a aprender
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nombre completo</label>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Pérez"
          />
        </div>

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
            minLength={6}
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

        <button 
          className="btn btn-primary w-full" 
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="mb-2">O regístrate con:</p>
        <button
          onClick={handleGoogleRegister}
          className="btn btn-outline w-full"
          disabled={loading}
        >
          🔵 Google
        </button>
      </div>

      <p className="text-center text-sm mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-blue-500 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}