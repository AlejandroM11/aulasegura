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

  // 🆕 Pantalla de éxito mejorada
  if (showSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-12 rounded-3xl shadow-2xl text-white">
          {/* Decoración de fondo */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            {/* Animación del check */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="mb-8"
            >
              <div className="bg-white/20 backdrop-blur w-32 h-32 mx-auto rounded-full flex items-center justify-center">
                <div className="text-8xl">✅</div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-4xl font-bold mb-3">¡Examen enviado con éxito!</h2>
              <p className="text-xl mb-8 opacity-90">
                Tu examen ha sido enviado exitosamente al docente
              </p>
            </motion.div>
            
            {/* Información del examen */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/20 backdrop-blur rounded-2xl p-6 mb-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm opacity-80 mb-1">Examen</p>
                  <p className="text-2xl font-bold">{exam.title}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-80 mb-1">Código</p>
                  <p className="text-2xl font-bold font-mono">{exam.code}</p>
                </div>
              </div>
              
              <div className="border-t border-white/30 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm opacity-80 mb-1">Preguntas respondidas</p>
                    <p className="text-3xl font-bold">
                      {Object.keys(ans).filter(k => ans[k] !== undefined && ans[k] !== "").length}/{exam.questions?.length || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm opacity-80 mb-1">Tiempo fuera</p>
                    <p className="text-3xl font-bold">
                      {(actualTimeOutside / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2 text-sm"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <p className="opacity-80">Redirigiendo en 3 segundos...</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 🆕 Popup de bloqueo mejorado
  if (isBlocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      >
        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse delay-75"></div>
        </div>

        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full mx-4"
        >
          {/* Icono animado */}
          <motion.div
            animate={{ 
              rotate: [0, -5, 5, -5, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="text-center mb-6"
          >
            <div className="bg-red-100 dark:bg-red-900/30 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4">
              <div className="text-6xl">🚫</div>
            </div>
            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              ¡Examen bloqueado!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Has salido de la ventana del examen
            </p>
          </motion.div>

          {/* Información del bloqueo */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                ⚠️
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-300">
                  Tiempo total fuera de la ventana
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {(actualTimeOutside / 1000).toFixed(1)} segundos
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Has excedido el límite de 10 segundos permitido fuera de la ventana del examen.
            </p>
          </div>

          {/* Formulario de mensaje */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                💬 Envía un mensaje al profesor
              </label>
              <textarea
                className="input w-full resize-none border-2 focus:border-blue-500"
                rows="4"
                placeholder="Explica la razón por la que saliste de la ventana (ej: problema técnico, llamada urgente, etc.)"
                value={blockMessage}
                onChange={(e) => setBlockMessage(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Sé honesto y específico. El profesor revisará tu mensaje.
              </p>
            </div>

            <button
              onClick={sendMessageToTeacher}
              disabled={!blockMessage.trim()}
              className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📨 Enviar mensaje y solicitar desbloqueo
            </button>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                <b>Nota:</b> El profesor recibirá tu mensaje en tiempo real y decidirá si permitirte continuar con el examen.
              </p>
            </div>
          </div>

          {/* Decoración */}
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-red-500 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-red-600 rounded-full opacity-10 animate-pulse"></div>
        </motion.div>
      </motion.div>
    );
  }

  // 🆕 Página de revisión COMPLETA con confirmación
  if (showReview) {
    const answeredCount = exam.questions?.filter(q => ans[q.id] !== undefined && ans[q.id] !== "").length || 0;
    const totalQuestions = exam.questions?.length || 0;
    const unansweredQuestions = exam.questions?.filter(q => ans[q.id] === undefined || ans[q.id] === "") || [];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto"
      >
        <div className="card">
          {/* Header con timer detenido */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h2 className="text-3xl font-bold mb-2">📋 Revisión Final</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Verifica tus respuestas antes de enviar
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Tiempo restante</div>
              <div className="text-3xl font-bold text-blue-600">
                {Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")}
              </div>
              <div className="text-xs text-gray-500 mt-1">⏸️ Timer pausado</div>
            </div>
          </div>

          {/* Resumen de respuestas */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{answeredCount}</div>
              <div className="text-sm text-gray-600">Respondidas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{totalQuestions - answeredCount}</div>
              <div className="text-sm text-gray-600">Sin responder</div>
            </div>
          </div>

          {/* Advertencia de preguntas sin responder */}
          {unansweredQuestions.length > 0 && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                    Tienes {unansweredQuestions.length} pregunta(s) sin responder
                  </h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {unansweredQuestions.map((q, idx) => (
                      <li key={q.id}>• Pregunta {exam.questions.indexOf(q) + 1}: {q.text.substring(0, 50)}...</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Listado completo de preguntas y respuestas */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Tus respuestas:</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {exam.questions?.map((q, idx) => {
                const hasAnswer = ans[q.id] !== undefined && ans[q.id] !== "";
                
                return (
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border-2 rounded-xl p-4 ${
                      hasAnswer 
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-300' 
                        : 'bg-red-50 dark:bg-red-900/10 border-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-2xl ${hasAnswer ? '' : 'opacity-50'}`}>
                        {hasAnswer ? '✅' : '❌'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold mb-3">
                          {idx + 1}. {q.text}
                        </p>

                        {q.type === "mc" ? (
                          <div className="ml-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Tu respuesta:</p>
                            {hasAnswer ? (
                              <p className="font-medium text-blue-600 text-lg">
                                {q.options[ans[q.id]]}
                              </p>
                            ) : (
                              <p className="text-red-500 italic">Sin responder</p>
                            )}
                          </div>
                        ) : (
                          <div className="ml-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Tu respuesta:</p>
                            {hasAnswer ? (
                              <p className="text-gray-800 dark:text-gray-200">
                                {ans[q.id]}
                              </p>
                            ) : (
                              <p className="text-red-500 italic">Sin responder</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Confirmación final */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl mb-6">
            <h3 className="font-bold text-lg mb-2">⚠️ Confirmación de envío</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Una vez que envíes el examen, <b>no podrás modificar tus respuestas</b>. 
              Asegúrate de haber revisado todo cuidadosamente.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={closeReview}
              className="btn btn-outline flex-1 text-lg py-3"
            >
              ← No, seguir editando
            </button>
            <button
              onClick={() => finishExam(false)}
              disabled={submitting}
              className="btn btn-primary flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-3"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Enviando...
                </span>
              ) : (
                "✅ Sí, enviar examen"
              )}
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