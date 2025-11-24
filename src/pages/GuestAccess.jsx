import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { apiGetExamByCode } from "../lib/api";
import { setUser } from "../lib/auth";

export default function GuestAccess() {
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");
  const [examCode, setExamCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuestAccess = async (e) => {
    e.preventDefault();

    if (!guestName.trim()) {
      alert("❌ Por favor ingresa tu nombre");
      return;
    }

    if (!examCode.trim()) {
      alert("❌ Por favor ingresa el código del examen");
      return;
    }

    if (guestName.trim().length < 3) {
      alert("❌ El nombre debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await apiGetExamByCode(examCode.trim().toUpperCase());

      if (response.ok && response.exam) {
        const guestUser = {
          uid: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: `invitado_${Date.now()}@temporal.local`,
          name: guestName.trim(),
          role: "estudiante",
          isGuest: true,
          examCode: examCode.trim().toUpperCase()
        };

        setUser(guestUser);
        navigate("/estudiante");
      } else {
        alert("❌ Código de examen inválido");
      }
    } catch (error) {
      alert("❌ Código de examen no encontrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center">
          <div className="text-6xl mb-2">🎯</div>
          <h2 className="text-2xl font-bold text-white">Acceso Rápido</h2>
        </div>

        <div className="p-6">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Ingresa al examen sin necesidad de crear una cuenta
          </p>

          <form onSubmit={handleGuestAccess} className="space-y-4">
            <div>
              <label className="label font-semibold">👤 Tu nombre completo</label>
              <input
                className="input"
                type="text"
                placeholder="Juan Pérez"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
            </div>

            <div>
              <label className="label font-semibold">🔑 Código del examen</label>
              <input
                className="input text-center font-mono text-xl font-bold"
                type="text"
                placeholder="ABC123"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                required
                maxLength={10}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full text-lg py-3"
              disabled={loading}
            >
              {loading ? "⏳ Verificando..." : "🚀 Comenzar examen"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h3 className="font-bold text-sm mb-2">ℹ️ Información</h3>
            <ul className="text-xs space-y-1">
              <li>• No necesitas crear una cuenta</li>
              <li>• Tu sesión es temporal</li>
              <li>• Tus respuestas se guardan automáticamente</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-blue-600 hover:underline"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}