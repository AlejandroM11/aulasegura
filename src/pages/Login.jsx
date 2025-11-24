import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { loginWithGoogle } from "../lib/firebase";
import { apiLogin } from "../lib/api";
import { isValidEmailDomain, getEmailValidationError } from "../lib/emailValidator";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    // ⛔ VALIDAR DOMINIO
    if (!isValidEmailDomain(email)) {
      alert(getEmailValidationError(email));
      return;
    }

    setLoading(true);

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
      {/* ... resto igual ... */}
    </div>
  );
}
