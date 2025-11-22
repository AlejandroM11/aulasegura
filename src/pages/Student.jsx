import { useEffect, useState, useRef } from "react";
import { apiGetExamByCode, apiCreateSubmission } from "../lib/api";
import { getUser } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  registerActiveStudent,
  updateStudentStatus,
  blockStudent,
  removeActiveStudent,
  listenToBlockStatus,
  sendMessageToTeacher
} from "../lib/firebase";

export default function Student() {
  const [code, setCode] = useState("");
  const [exam, setExam] = useState(null);
  const [ans, setAns] = useState({});
  const [t, setT] = useState(0);
  const [fin, setFin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockMessage, setBlockMessage] = useState("");
  const [violations, setViolations] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  const user = getUser();
  const hasSubmittedRef = useRef(false);
  const intervalRef = useRef(null);
  const isExamActiveRef = useRef(false);
  const unsubscribeBlockRef = useRef(null);

  // 🔥 Registrar estudiante en tiempo real al iniciar examen
  useEffect(() => {
    if (exam && user && !fin && !showReview) {
      console.log("🔥 Registrando estudiante activo:", user.email);
      
      registerActiveStudent(exam.code, {
        uid: user.uid || user.email,
        email: user.email,
        name: user.name,
        timeLeft: exam.durationMinutes * 60
      }).catch(console.error);

      // 🔥 Escuchar si el profesor lo desbloquea EN TIEMPO REAL
      const unsubscribe = listenToBlockStatus(
        exam.code,
        user.uid || user.email,
        (blocked, reason) => {
          console.log("📡 Estado de bloqueo actualizado desde Firebase:", blocked, reason);
          
          if (blocked && !isBlocked) {
            // Fue bloqueado por el sistema antifraude
            setIsBlocked(true);
            setBlockReason(reason || "Bloqueado por el profesor");
          } else if (!blocked && isBlocked) {
            // ✅ El profesor lo desbloqueó en tiempo real
            setIsBlocked(false);
            setBlockReason("");
            alert("✅ Has sido desbloqueado por el profesor. Puedes continuar.");
            
            // Reactivar pantalla completa
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }
        }
      );

      unsubscribeBlockRef.current = unsubscribe;

      // Actualizar estado cada 5 segundos para el monitoreo
      const statusInterval = setInterval(() => {
        const answeredCount = Object.keys(ans).filter(
          k => ans[k] !== undefined && ans[k] !== ""
        ).length;

        updateStudentStatus(exam.code, user.uid || user.email, {
          timeLeft: t,
          answeredCount,
          violations: violations.length,
          lastActivity: Date.now()
        }).catch(console.error);
      }, 5000);

      return () => {
        clearInterval(statusInterval);
        if (unsubscribeBlockRef.current) {
          unsubscribeBlockRef.current();
        }
      };
    }
  }, [exam, user, fin, showReview, ans, t, violations, isBlocked]);

  // 🔥 Sistema antifraude con notificación en tiempo real
  useEffect(() => {
    if (!exam || fin || showReview || isBlocked) {
      isExamActiveRef.current = false;
      return;
    }

    isExamActiveRef.current = true;

    const handleKeyDown = (e) => {
      if (!isExamActiveRef.current) return;

      if (e.key === 'Meta' || e.metaKey) {
        e.preventDefault();
        blockExamRealtime('Presionaste la tecla Windows');
        return;
      }

      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        blockExamRealtime('Intentaste cambiar de ventana (Alt+Tab)');
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        blockExamRealtime('Intentaste abrir el Administrador de Tareas');
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        blockExamRealtime('Intentaste salir de pantalla completa (F11)');
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        blockExamRealtime('Intentaste abrir DevTools (F12)');
        return;
      }

      if (e.key === 'PrintScreen') {
        e.preventDefault();
        blockExamRealtime('Intentaste tomar una captura de pantalla');
        return;
      }

      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        blockExamRealtime('Intentaste imprimir (Ctrl+P)');
        return;
      }
    };

    const handleBlur = () => {
      if (!isExamActiveRef.current) return;
      blockExamRealtime('Saliste de la ventana del examen');
    };

    const handleVisibilityChange = () => {
      if (!isExamActiveRef.current) return;
      if (document.hidden) {
        blockExamRealtime('Cambiaste de pestaña o minimizaste el navegador');
      }
    };

    const handleFullscreenChange = () => {
      if (!isExamActiveRef.current) return;
      if (!document.fullscreenElement) {
        blockExamRealtime('Saliste del modo pantalla completa');
      }
    };

    const handleContextMenu = (e) => {
      if (!isExamActiveRef.current) return;
      e.preventDefault();
      addViolationRealtime('Intentaste abrir el menú contextual');
      return false;
    };

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [exam, fin, showReview, isBlocked]);

  // 🔥 Bloquear y notificar al profesor EN TIEMPO REAL
  const blockExamRealtime = async (reason) => {
    if (isBlocked || fin || hasSubmittedRef.current) return;
    
    console.warn('🚫 EXAMEN BLOQUEADO:', reason);
    
    setIsBlocked(true);
    setBlockReason(reason);
    addViolationRealtime(reason);
    
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 🔥 Notificar al profesor INSTANTÁNEAMENTE
    try {
      await blockStudent(exam.code, user.uid || user.email, reason);
      console.log('✅ Profesor notificado en tiempo real');
    } catch (error) {
      console.error('Error al notificar al profesor:', error);
    }
  };

  const addViolationRealtime = async (reason) => {
    const newViolations = [...violations, {
      reason,
      timestamp: new Date().toISOString()
    }];
    
    setViolations(newViolations);

    try {
      await updateStudentStatus(exam.code, user.uid || user.email, {
        violations: newViolations.length,
        lastViolation: reason
      });
    } catch (error) {
      console.error('Error al actualizar violaciones:', error);
    }
  };

  // Timer del examen
  useEffect(() => {
    if (exam && !fin && !isBlocked && !showReview) {
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
            if (!hasSubmittedRef.current) finishExam(true);
            return 0;
          }
          return x - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [exam, fin, isBlocked, showReview]);

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
        setViolations([]);
        hasSubmittedRef.current = false;
      } else {
        alert("❌ Código inválido");
      }
    } catch (error) {
      alert("❌ " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const ch = (id, v) => setAns((a) => ({ ...a, [id]: v }));

  const openReview = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    isExamActiveRef.current = false;
    setShowReview(true);
  };

  const closeReview = () => {
    setShowReview(false);
    isExamActiveRef.current = true;
    
    if (exam && !fin && !isBlocked) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }

      intervalRef.current = setInterval(() => {
        setT((x) => {
          if (x <= 1) {
            clearInterval(intervalRef.current);
            if (!hasSubmittedRef.current) finishExam(true);
            return 0;
          }
          return x - 1;
        });
      }, 1000);
    }
  };

  const finishExam = async (forced) => {
    if (!exam || hasSubmittedRef.current || submitting) return;

    hasSubmittedRef.current = true;
    setSubmitting(true);
    isExamActiveRef.current = false;

    // Remover de estudiantes activos
    try {
      await removeActiveStudent(exam.code, user.uid || user.email);
    } catch (error) {
      console.error('Error al remover estudiante activo:', error);
    }

    const submission = {
      examId: exam.id,
      code: exam.code,
      title: exam.title,
      studentEmail: user?.email || "anónimo",
      studentName: user?.name || "Estudiante",
      submittedAt: new Date().toISOString(),
      answers: ans,
      violations: violations,
      wasBlocked: isBlocked,
      blockReason: blockReason || null,
      forced,
    };

    try {
      await apiCreateSubmission(submission);
      setFin(true);
      setShowSuccess(true);
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      setTimeout(() => resetExam(), 3000);
    } catch (error) {
      console.error("Error al enviar examen:", error);
      hasSubmittedRef.current = false;
      alert("❌ Error al enviar el examen");
    } finally {
      setSubmitting(false);
    }
  };

  const resetExam = () => {
    setExam(null);
    setAns({});
    setT(0);
    setFin(false);
    setShowSuccess(false);
    setShowReview(false);
    setIsBlocked(false);
    setBlockReason("");
    setBlockMessage("");
    setViolations([]);
    hasSubmittedRef.current = false;
    isExamActiveRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (unsubscribeBlockRef.current) unsubscribeBlockRef.current();
  };

  // 🔥 Enviar mensaje al profesor EN TIEMPO REAL
  const sendMessageToTeacherRealtime = async () => {
    if (!blockMessage.trim()) {
      alert("Escribe un mensaje");
      return;
    }

    try {
      await sendMessageToTeacher(exam.code, user.uid || user.email, blockMessage);
      alert("✅ Mensaje enviado. El profesor lo verá instantáneamente.");
      setBlockMessage("");
      setShowMessageModal(false);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert("❌ Error al enviar el mensaje");
    }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // ============ PANTALLA 1: UNIRSE ============
  if (!exam) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-4">Unirse a un examen</h2>
          <div className="flex gap-3">
            <input
              className="input"
              placeholder="Código del examen"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && join()}
              disabled={loading}
              autoFocus
            />
            <button className="btn btn-primary" onClick={join} disabled={loading}>
              {loading ? "Buscando..." : "Ingresar"}
            </button>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <h3 className="font-bold mb-2">⚠️ Advertencias</h3>
            <ul className="text-sm space-y-1">
              <li>• Serás monitoreado en tiempo real</li>
              <li>• No salgas de la ventana del examen</li>
              <li>• El profesor verá tus acciones instantáneamente</li>
            </ul>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ PANTALLA 2: BLOQUEADO ============
  if (isBlocked) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-red-500 to-red-700 p-8 rounded-2xl shadow-2xl text-white">
          <div className="text-center">
            <div className="text-7xl mb-4">🚫</div>
            <h2 className="text-3xl font-bold mb-4">Examen Bloqueado</h2>
            <div className="bg-white/20 backdrop-blur p-4 rounded-xl mb-6">
              <p className="text-xl font-semibold mb-2">Razón:</p>
              <p className="text-lg">{blockReason}</p>
            </div>

            {violations.length > 0 && (
              <div className="bg-white/10 p-4 rounded-xl mb-4 text-left">
                <p className="font-semibold mb-2">Historial de violaciones:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {violations.map((v, idx) => (
                    <div key={idx} className="text-xs bg-white/10 p-2 rounded">
                      • {v.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowMessageModal(true)}
              className="btn bg-white text-red-600 hover:bg-gray-100 w-full"
            >
              💬 Enviar mensaje al profesor
            </button>

            <p className="text-xs opacity-80 mt-4">
              El profesor fue notificado automáticamente. Espera a que te desbloquee.
            </p>
          </div>
        </div>

        {/* Modal mensaje */}
        <AnimatePresence>
          {showMessageModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowMessageModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="card max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Mensaje al profesor</h3>
                <textarea
                  className="input w-full resize-none"
                  rows="4"
                  placeholder="Explica tu situación..."
                  value={blockMessage}
                  onChange={(e) => setBlockMessage(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowMessageModal(false)} className="btn btn-outline flex-1">
                    Cancelar
                  </button>
                  <button
                    onClick={sendMessageToTeacherRealtime}
                    disabled={!blockMessage.trim()}
                    className="btn btn-primary flex-1"
                  >
                    ✅ Enviar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ============ PANTALLA 3: ÉXITO ============
  if (showSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center">
        <div className="bg-gradient-to-br from-green-500 to-green-700 p-12 rounded-3xl shadow-2xl text-white">
          <div className="text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-4xl font-bold mb-4">¡Examen enviado!</h2>
          <p className="text-xl">Tus respuestas han sido guardadas</p>
        </div>
      </motion.div>
    );
  }

  // ============ PANTALLA 4: REVISAR ============
  if (showReview) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">📝 Revisar respuestas</h2>
            <button onClick={closeReview} className="btn btn-outline">← Volver</button>
          </div>

          <div className="space-y-4">
            {exam.questions.map((q, idx) => {
              const answer = ans[q.id];
              const isAnswered = answer !== undefined && answer !== "";

              return (
                <div key={q.id} className={`p-4 rounded-xl border-2 ${isAnswered ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                  <p className="font-semibold mb-2">{idx + 1}. {q.text}</p>
                  {q.type === "mc" && (
                    <p className="text-sm ml-4">
                      {isAnswered ? `✅ ${q.options[answer]}` : "❌ Sin responder"}
                    </p>
                  )}
                  {q.type === "open" && (
                    <p className="text-sm ml-4">
                      {isAnswered ? answer : "❌ Sin responder"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={closeReview} className="btn btn-outline flex-1">← Seguir</button>
            <button onClick={() => finishExam(false)} disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? "Enviando..." : "✅ Enviar"}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ PANTALLA 5: EXAMEN ============
  const answered = Object.keys(ans).filter(k => ans[k] !== undefined && ans[k] !== "").length;
  const total = exam.questions.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-xl mb-6 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-sm opacity-90">Código: {exam.code}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{fmt(t)}</div>
            <p className="text-xs opacity-80">Restante</p>
          </div>
        </div>
        
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div className="bg-white h-full transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
        <p className="text-xs mt-2 text-center">{answered} de {total} respondidas</p>
      </div>

      {/* Preguntas */}
      <div className="space-y-6">
        {exam.questions.map((q, idx) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="card">
            <p className="font-bold text-lg mb-4">{idx + 1}. {q.text}</p>

            {q.type === "mc" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${ans[q.id] === i ? "bg-blue-100 border-blue-500" : "border-gray-200 hover:border-blue-300"}`}>
                    <input type="radio" name={`q-${q.id}`} checked={ans[q.id] === i} onChange={() => ch(q.id, i)} className="w-5 h-5" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "open" && (
              <textarea className="input w-full resize-none" rows="4" placeholder="Escribe tu respuesta..." value={ans[q.id] || ""} onChange={(e) => ch(q.id, e.target.value)} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Botones finales */}
      <div className="flex gap-3 mt-6 sticky bottom-0 bg-gray-100 dark:bg-gray-900 p-4 rounded-xl">
        <button onClick={openReview} className="btn btn-outline flex-1">📝 Revisar</button>
        <button onClick={() => finishExam(false)} disabled={submitting} className="btn btn-primary flex-1">
          {submitting ? "Enviando..." : "✅ Enviar"}
        </button>
      </div>
    </div>
  );
}