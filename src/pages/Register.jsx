import { useState } from "react";
import { setUser } from "../lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { loginWithGoogle } from "../lib/firebase";
import { apiRegister } from "../lib/api";
import { isValidEmailDomain, getEmailValidationError } from "../lib/emailValidator";

export default function Register() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("estudiante");
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
      const response = await apiRegister({
        email,
        password: pw,
        name,
        role
      });

      if (response.ok) {
        const newUser = {
          uid: response.uid,
          email: response.email,
          name: response.name,
          role: response.role,
          fromGoogle: false
        };

        setUser(newUser);
        alert("✅ Cuenta creada exitosamente");
        nav(role === "docente" ? "/docente" : "/estudiante");
      } else {
        alert("❌ " + response.error);
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
      {/* ... resto igual ... */}
    </div>
  );
}
