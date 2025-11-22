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
  const blockingInProgressRef = useRef(false); // 🔥 NUEVO: Evitar desbloqueos accidentales

  // Cleanup al desmontar o cerrar pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (exam && user && !fin) {
        removeActiveStudent(exam.code, user.uid || user.email).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (exam && user && !fin) {
        removeActiveStudent(exam.code, user.uid || user.email)
          .then(() => console.log('✅ Cleanup: Estudiante removido'))
          .catch(err => console.error('Error en cleanup:', err));
      }
    };
  }, [exam, user, fin]);

  // Registrar estudiante en tiempo real
  useEffect(() => {
    if (exam && user && !fin && !showReview) {
      console.log("🔥 Registrando estudiante activo:", user.email);
      
      registerActiveStudent(exam.code, {
        uid: user.uid || user.email,
        email: user.email,
        name: user.name,
        timeLeft: exam.durationMinutes * 60
      }).catch(console.error);

      // 🔥 Escuchar cambios de bloqueo desde Firebase
      const unsubscribe = listenToBlockStatus(
        exam.code,
        user.uid || user.email,
        (blocked, reason) => {
          console.log("📡 Firebase dice:", { blocked, reason, currentlyBlocked: isBlocked });
          
          // 🔥 CRÍTICO: Solo desbloquear si NO estamos en proceso de bloqueo
          if (blocked && !blockingInProgressRef.current) {
            console.log("🚫 BLOQUEADO por Firebase");
            setIsBlocked(true);
            setBlockReason(reason || "Bloqueado por el sistema");
            blockingInProgressRef.current = false;
          } else if (!blocked && isBlocked && !blockingInProgressRef.current) {
            // ✅ Profesor lo desbloqueó REALMENTE
            console.log("✅ DESBLOQUEADO por el profesor");
            setIsBlocked(false);
            setBlockReason("");
            alert("✅ Has sido desbloqueado por el profesor. Ten más cuidado.");
            
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
            
            isExamActiveRef.current = true;
            
            if (!intervalRef.current && t > 0) {
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
          }
        }
      );

      unsubscribeBlockRef.current = unsubscribe;

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

  // Sistema antifraude
  useEffect(() => {
    if (!exam || fin || showReview) {
      isExamActiveRef.current = false;
      return;
    }

    if (isBlocked) {
      isExamActiveRef.current = false;
      return;
    }

    isExamActiveRef.current = true;
    console.log("🛡️ Sistema antifraude ACTIVADO");

    const handleKeyDown = (e) => {
      if (!isExamActiveRef.current) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        blockExamRealtime('Presionaste Escape para salir de pantalla completa');
        return;
      }

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
        blockExamRealtime('Intentaste cambiar pantalla completa con F11');
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

  const blockExamRealtime = async (reason) => {
    if (isBlocked || fin || hasSubmittedRef.current || blockingInProgressRef.current) return;
    
    console.warn('🚫 BLOQUEANDO EXAMEN:', reason);
    
    // 🔥 Marcar que estamos bloqueando
    blockingInProgressRef.current = true;
    isExamActiveRef.current = false;
    
    // 🔥 Bloquear UI INMEDIATAMENTE
    setIsBlocked(true);
    setBlockReason(reason);
    addViolationRealtime(reason);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 🔥 Notificar a Firebase
    try {
      await blockStudent(exam.code, user.uid || user.email, reason);
      console.log('✅ Profesor notificado en Firebase');
    } catch (error) {
      console.error('Error al notificar bloqueo:', error);
    } finally {
      // 🔥 Esperar un momento antes de permitir cambios
      setTimeout(() => {
        blockingInProgressRef.current = false;
      }, 2000);
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
        setIsBlocked(false);
        blockingInProgressRef.current = false;
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

    try {
      await removeActiveStudent(exam.code, user.uid || user.email);
      console.log('✅ Estudiante removido de Firebase');
    } catch (error) {
      console.error('Error al remover estudiante:', error);
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
    if (exam && user) {
      removeActiveStudent(exam.code, user.uid || user.email)
        .then(() => console.log('✅ Estudiante removido al resetear'))
        .catch(err => console.error('Error al remover:', err));
    }
    
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
    blockingInProgressRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (unsubscribeBlockRef.current) unsubscribeBlockRef.current();
  };

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

  // PANTALLA: UNIRSE
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
              <li>• No presiones Escape ni salgas de pantalla completa</li>
            </ul>
          </div>
        </div>
      </motion.div>
    );
  }

  // PANTALLA: BLOQUEADO - PANTALLA COMPLETA BLOQUEANTE
  if (isBlocked) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          isolation: 'isolate'
        }}
      >
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center text-white"
          >
            <motion.div 
              className="text-9xl mb-6"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🚫
            </motion.div>
            
            <h1 className="text-5xl font-black mb-4 drop-shadow-lg">
              EXAMEN BLOQUEADO
            </h1>
            
            <div className="bg-white/20 backdrop-blur-xl p-6 rounded-2xl mb-6 border-4 border-white/30">
              <p className="text-2xl font-bold mb-3">Razón del bloqueo:</p>
              <p className="text-xl">{blockReason}</p>
            </div>

            {violations.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl mb-6 text-left max-w-md mx-auto">
                <p className="font-bold mb-3 text-lg">📋 Historial de violaciones ({violations.length}):</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {violations.map((v, idx) => (
                    <div key={idx} className="text-sm bg-white/10 p-3 rounded-lg">
                      <span className="font-bold">{idx + 1}.</span> {v.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowMessageModal(true)}
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition transform hover:scale-105 mb-6"
            >
              💬 Enviar mensaje al profesor
            </button>

            <div className="bg-white/10 backdrop-blur-xl p-4 rounded-xl max-w-md mx-auto">
              <p className="text-sm font-bold mb-2">
                ⚠️ INFORMACIÓN IMPORTANTE
              </p>
              <ul className="text-xs space-y-1 text-left">
                <li>• El profesor ha sido notificado automáticamente</li>
                <li>• Tu examen está pausado y guardado</li>
                <li>• Espera a que el profesor revise tu caso</li>
                <li>• Si cierras esta página, seguirás bloqueado</li>
                <li>• El sistema antifraude seguirá activo después del desbloqueo</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Modal mensaje */}
        <AnimatePresence>
          {showMessageModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
              onClick={() => setShowMessageModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Enviar mensaje al profesor
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Explica tu situación. El profesor recibirá tu mensaje en tiempo real.
                </p>

                <textarea
                  className="input w-full resize-none text-base"
                  rows="5"
                  placeholder="Escribe tu mensaje aquí..."
                  value={blockMessage}
                  onChange={(e) => setBlockMessage(e.target.value)}
                  autoFocus
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="btn btn-outline flex-1 text-base py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={sendMessageToTeacherRealtime}
                    disabled={!blockMessage.trim()}
                    className="btn btn-primary flex-1 text-base py-3 disabled:opacity-50"
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

  // PANTALLA: ÉXITO
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

  // PANTALLA: REVISAR
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

  // PANTALLA: EXAMEN
  const answered = Object.keys(ans).filter(k => ans[k] !== undefined && ans[k] !== "").length;
  const total = exam.questions.length;

  return (
    <div className="max-w-4xl mx-auto">
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

      <div className="flex gap-3 mt-6 sticky bottom-0 bg-gray-100 dark:bg-gray-900 p-4 rounded-xl">
        <button onClick={openReview} className="btn btn-outline flex-1">📝 Revisar</button>
        <button onClick={() => finishExam(false)} disabled={submitting} className="btn btn-primary flex-1">
          {submitting ? "Enviando..." : "✅ Enviar"}
        </button>
      </div>
    </div>
  );
}