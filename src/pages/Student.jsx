import { useEffect, useState } from "react";
import { apiGetExamByCode, apiCreateSubmission } from "../lib/api";
import { getUser } from "../lib/auth";
import useExamGuard from "../hooks/useExamGuard";
import { motion } from "framer-motion";

export default function Student() {
  const [code, setCode] = useState("");
  const [exam, setExam] = useState(null);
  const [ans, setAns] = useState({});
  const [t, setT] = useState(0);
  const [fin, setFin] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const user = getUser();
  const timeOutside = useExamGuard(() => !fin && finish(true));

  useEffect(() => {
    let iv;
    if (exam && !fin) {
      setT(exam.durationMinutes * 60);

      // Pantalla completa al iniciar examen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }

      iv = setInterval(
        () =>
          setT((x) => {
            if (x <= 1) {
              clearInterval(iv);
              finish(false);
              return 0;
            }
            return x - 1;
          }),
        1000
      );
    }
    return () => clearInterval(iv);
  }, [exam]);

  // 🔵 Unirse al examen desde el backend
  const join = async () => {
    if (!code.trim()) {
      alert("Por favor ingresa un código");
      return;
    }

    setLoading(true);
    try {
      const response = await apiGetExamByCode(code.trim());
      
      if (response.ok && response.exam) {
        setExam(response.exam);
        setAns({});
      } else {
        alert("Código inválido o examen no encontrado");
      }
    } catch (error) {
      console.error("Error al buscar examen:", error);
      alert("Error al buscar el examen. Verifica el código.");
    } finally {
      setLoading(false);
    }
  };

  const ch = (id, v) =>
    setAns((a) => ({
      ...a,
      [id]: v,
    }));

  // 🔵 Enviar resultados al backend
  const finish = async (forced) => {
    if (!exam) return;

    const submission = {
      examId: exam.id,
      code: exam.code,
      title: exam.title,
      studentEmail: user?.email || "anónimo",
      studentName: user?.name || "Estudiante",
      submittedAt: new Date().toISOString(),
      answers: ans,
      timeOutsideMs: timeOutside,
      forced,
    };

    try {
      await apiCreateSubmission(submission);
      setFin(true);
      alert("✅ Examen enviado exitosamente al docente.");
      
      // Salir de pantalla completa
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error al enviar examen:", error);
      alert("❌ Error al enviar el examen. Intenta de nuevo.");
    }
  };

  // Pantalla de unirse al examen
  if (!exam) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-700">
          <h2 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-4">
            Unirse a un examen
          </h2>

          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Ingresa el código proporcionado por tu docente
          </p>

          <div className="flex gap-3">
            <input
              className="input border-blue-300 dark:border-blue-600 focus:ring-2 focus:ring-blue-500"
              placeholder="Código del examen"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={loading}
            />

            <button
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={join}
              disabled={loading}
            >
              {loading ? "Buscando..." : "Ingresar"}
            </button>
          </div>

          <p className="mt-3 text-sm text-center text-gray-500 dark:text-gray-400">
            Ejemplo:{" "}
            <b className="text-blue-600 dark:text-blue-400">ABC123</b>
          </p>
        </div>
      </motion.div>
    );
  }

  // Examen activo
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{exam.title}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Código: <b className="text-blue-600">{exam.code}</b>
          </span>
          <div className="text-lg font-bold">
            Tiempo:{" "}
            <span className={t < 60 ? "text-red-500" : ""}>
              {Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <ul className="space-y-4">
        {exam.questions?.map((q) => (
          <li
            key={q.id}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800"
          >
            <p className="mb-3 font-medium text-gray-800 dark:text-gray-100">
              {q.text}
            </p>

            {q.type === "mc" ? (
              <div className="space-y-2">
                {q.options?.map((op, i) => (
                  <label 
                    key={i} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition"
                  >
                    <input
                      type="radio"
                      name={"q" + q.id}
                      checked={ans[q.id] === i}
                      onChange={() => ch(q.id, i)}
                      className="w-4 h-4"
                    />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="input"
                rows="4"
                placeholder="Escribe tu respuesta aquí..."
                value={ans[q.id] || ""}
                onChange={(e) => ch(q.id, e.target.value)}
              />
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <button
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => finish(false)}
          disabled={fin}
        >
          {fin ? "✅ Examen enviado" : "Finalizar examen"}
        </button>

        <div className="flex items-center gap-4 text-sm">
          <span className={timeOutside > 10000 ? "text-red-500 font-bold" : "text-gray-600 dark:text-gray-400"}>
            ⚠️ Tiempo fuera: {(timeOutside / 1000).toFixed(1)}s
          </span>
          {timeOutside > 20000 && (
            <span className="text-red-600 font-bold animate-pulse">
              ¡Cuidado! Permanece en la página
            </span>
          )}
        </div>
      </div>
    </div>
  );
}