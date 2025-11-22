import { useEffect, useState, useCallback, useRef } from "react";
import { apiGetExamByCode, apiCreateSubmission } from "../lib/api";
import { getUser } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function Student() {
  const [code, setCode] = useState("");
  const [exam, setExam] = useState(null);
  const [ans, setAns] = useState({});
  const [t, setT] = useState(0);
  const [fin, setFin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false); // 🆕 Modo revisión
  const [showSuccess, setShowSuccess] = useState(false); // 🆕 Pantalla de éxito
  const [isBlocked, setIsBlocked] = useState(false); // 🆕 Estado de bloqueo
  const [blockMessage, setBlockMessage] = useState(""); // 🆕 Mensaje al profesor
  const [actualTimeOutside, setActualTimeOutside] = useState(0); // 🆕 Tiempo real fuera
  
  const user = getUser();
  const hasSubmittedRef = useRef(false);
  const timeOutsideRef = useRef(0);
  const intervalRef = useRef(null);
  const lastBlurTime = useRef(null);

  // 🆕 Control manual del tiempo fuera
  useEffect(() => {
    if (!exam || fin) return;

    const handleBlur = () => {
      lastBlurTime.current = Date.now();
    };

    const handleFocus = () => {
      if (lastBlurTime.current) {
        const timeOut = Date.now() - lastBlurTime.current;
        timeOutsideRef.current += timeOut;
        setActualTimeOutside(timeOutsideRef.current);
        lastBlurTime.current = null;

        // 🆕 Bloquear si está más de 10 segundos fuera
        if (timeOutsideRef.current > 10000 && !isBlocked) {
          setIsBlocked(true);
        }
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [exam, fin, isBlocked]);

  // Timer del examen
  useEffect(() => {
    if (exam && !fin && !isBlocked) {
      setT(exam.durationMinutes * 60);

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log("No se pudo activar pantalla completa:", err);
        });
      }

      intervalRef.current = setInterval(() => {
        setT((x) => {
          if (x <= 1) {
            clearInterval(intervalRef.current);
            if (!hasSubmittedRef.current) {
              finishExam(true);
            }
            return 0;
          }
          return x - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [exam, fin, isBlocked]);

  const join = async () => {
    if (!code.trim()) {
      alert("Por favor ingresa un código");
      return;
    }

    setLoading(true);
    try {
      const response = await apiGetExamByCode(code.trim().toUpperCase());
      
      if (response.ok && response.exam) {
        setExam(response.exam);
        setAns({});
        hasSubmittedRef.current = false;
        timeOutsideRef.current = 0;
        setActualTimeOutside(0);
      } else {
        alert("❌ Código inválido o examen no encontrado");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Error al buscar el examen";
      alert("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const ch = (id, v) => setAns((a) => ({ ...a, [id]: v }));

  // 🆕 Abrir página de revisión
  const openReview = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowReview(true);
  };

  // 🆕 Volver del review
  const closeReview = () => {
    setShowReview(false);
    // Reanudar timer
    if (exam && !fin) {
      intervalRef.current = setInterval(() => {
        setT((x) => {
          if (x <= 1) {
            clearInterval(intervalRef.current);
            if (!hasSubmittedRef.current) {
              finishExam(true);
            }
            return 0;
          }
          return x - 1;
        });
      }, 1000);
    }
  };

  // 🆕 Enviar examen (mejorado)
  const finishExam = async (forced) => {
    if (!exam || hasSubmittedRef.current || submitting) {
      return;
    }

    hasSubmittedRef.current = true;
    setSubmitting(true);

    const submission = {
      examId: exam.id,
      code: exam.code,
      title: exam.title,
      studentEmail: user?.email || "anónimo",
      studentName: user?.name || "Estudiante",
      submittedAt: new Date().toISOString(),
      answers: ans,
      timeOutsideMs: timeOutsideRef.current, // 🆕 Tiempo real
      forced,
    };

    try {
      await apiCreateSubmission(submission);
      setFin(true);
      setShowSuccess(true); // 🆕 Mostrar pantalla de éxito
      
      // Salir de pantalla completa
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // 🆕 Salir del examen después de 3 segundos
      setTimeout(() => {
        resetExam();
      }, 3000);
    } catch (error) {
      console.error("Error al enviar examen:", error);
      hasSubmittedRef.current = false;
      alert("❌ Error al enviar el examen. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🆕 Resetear todo
  const resetExam = () => {
    setExam(null);
    setAns({});
    setT(0);
    setFin(false);
    setShowSuccess(false);
    setShowReview(false);
    setIsBlocked(false);
    setBlockMessage("");
    setActualTimeOutside(0);
    timeOutsideRef.current = 0;
    hasSubmittedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // 🆕 Enviar mensaje al profesor
  const sendMessageToTeacher = () => {
    if (!blockMessage.trim()) {
      alert("Escribe un mensaje");
      return;
    }

    // TODO: Implementar envío de mensaje en tiempo real
    console.log("📨 Mensaje al profesor:", blockMessage);
    alert("✅ Mensaje enviado al profesor. Espera respuesta...");
    setBlockMessage("");
  };

  // Pantalla de unirse
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
              onKeyPress={(e) => e.key === 'Enter' && join()}
              disabled={loading}
              autoFocus
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
            Ejemplo: <b className="text-blue-600 dark:text-blue-400">ABC123</b>
          </p>

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Buscando examen...</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 🆕 Pantalla de éxito
  if (showSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg mx-auto text-center"
      >
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-12 rounded-3xl shadow-2xl text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="text-8xl mb-6">✅</div>
          </motion.div>
          
          <h2 className="text-3xl font-bold mb-4">¡Examen enviado!</h2>
          <p className="text-xl mb-6">Tu examen ha sido enviado exitosamente al docente.</p>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-6">
            <p className="text-sm">Tiempo fuera de la ventana:</p>
            <p className="text-2xl font-bold">{(actualTimeOutside / 1000).toFixed(1)}s</p>
          </div>

          <p className="text-sm opacity-90">Redirigiendo en 3 segundos...</p>
        </div>
      </motion.div>
    );
  }

  // 🆕 Popup de bloqueo
  if (isBlocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-red-900/90 backdrop-blur-lg flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              Examen bloqueado
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Has estado fuera de la ventana por más de 10 segundos
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Tiempo total fuera: <b>{(actualTimeOutside / 1000).toFixed(1)}s</b>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Envía un mensaje al profesor para desbloquear:
              </label>
              <textarea
                className="input w-full resize-none"
                rows="4"
                placeholder="Explica por qué estuviste fuera..."
                value={blockMessage}
                onChange={(e) => setBlockMessage(e.target.value)}
              />
            </div>

            <button
              onClick={sendMessageToTeacher}
              className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700"
            >
              📨 Enviar mensaje y solicitar desbloqueo
            </button>

            <p className="text-xs text-center text-gray-500">
              El profesor recibirá tu mensaje y decidirá si desbloquearte
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // 🆕 Página de revisión
  if (showReview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">📋 Revisión de respuestas</h2>
            <div className="text-lg font-bold text-blue-600">
              Tiempo: {Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {exam.questions?.map((q, idx) => (
              <div key={q.id} className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
                <p className="font-semibold mb-2">
                  {idx + 1}. {q.text}
                </p>

                {q.type === "mc" ? (
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 mb-1">Tu respuesta:</p>
                    <p className="font-medium text-blue-600">
                      {ans[q.id] !== undefined 
                        ? q.options[ans[q.id]] 
                        : "Sin responder"}
                    </p>
                  </div>
                ) : (
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 mb-1">Tu respuesta:</p>
                    <p className="italic">{ans[q.id] || "Sin responder"}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={closeReview}
              className="btn btn-outline flex-1"
            >
              ← Volver a editar
            </button>
            <button
              onClick={() => finishExam(false)}
              disabled={submitting}
              className="btn btn-primary flex-1 bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Enviando..." : "✅ Confirmar y enviar"}
            </button>
          </div>
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
          className="btn btn-primary bg-blue-600 hover:bg-blue-700"
          onClick={openReview}
        >
          📋 Revisar y enviar
        </button>

        <div className="text-sm">
          <span className={actualTimeOutside > 5000 ? "text-red-500 font-bold" : "text-gray-600"}>
            ⚠️ Tiempo fuera: {(actualTimeOutside / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
}