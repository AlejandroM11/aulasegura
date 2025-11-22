import { useEffect, useState, useRef } from "react";
import { apiGetExamByCode, apiCreateSubmission } from "../lib/api";
import { getUser } from "../lib/auth";
import { motion } from "framer-motion";
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
  
  const user = getUser();
  const hasSubmittedRef = useRef(false);
  const intervalRef = useRef(null);
  const isExamActiveRef = useRef(false);
  const unsubscribeBlockRef = useRef(null);

  // 🆕 Registrar estudiante en tiempo real al iniciar examen
  useEffect(() => {
    if (exam && user && !fin && !showReview) {
      // Registrar como estudiante activo
      registerActiveStudent(exam.code, {
        uid: user.uid || user.email,
        email: user.email,
        name: user.name,
        timeLeft: exam.durationMinutes * 60
      }).catch(console.error);

      // Escuchar si el profesor lo desbloquea
      const unsubscribe = listenToBlockStatus(
        exam.code,
        user.uid || user.email,
        (blocked, reason) => {
          if (blocked && !isBlocked) {
            setIsBlocked(true);
            setBlockReason(reason || "Bloqueado por el profesor");
          } else if (!blocked && isBlocked) {
            // El profesor lo desbloqueó
            setIsBlocked(false);
            setBlockReason("");
            alert("✅ Has sido desbloqueado por el profesor. Puedes continuar.");
          }
        }
      );

      unsubscribeBlockRef.current = unsubscribe;

      // Actualizar estado cada 5 segundos
      const statusInterval = setInterval(() => {
        const answeredCount = Object.keys(ans).filter(
          k => ans[k] !== undefined && ans[k] !== ""
        ).length;

        updateStudentStatus(exam.code, user.uid || user.email, {
          timeLeft: t,
          answeredCount,
          violations: violations.length
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

  // 🆕 Sistema antifraude con notificación en tiempo real
  useEffect(() => {
    if (!exam || fin || showReview || isBlocked) {
      isExamActiveRef.current = false;
      return;
    }

    isExamActiveRef.current = true;

    const handleKeyDown = (e) => {
      if (!isExamActiveRef.current) return;

      // Detectar tecla Windows
      if (e.key === 'Meta' || e.metaKey) {
        e.preventDefault();
        blockExamRealtime('Presionaste la tecla Windows', 'Tecla Windows detectada');
        return;
      }

      // Detectar Alt+Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        blockExamRealtime('Intentaste cambiar de ventana (Alt+Tab)', 'Alt+Tab detectado');
        return;
      }

      // Detectar Ctrl+Shift+Esc
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        blockExamRealtime('Intentaste abrir el Administrador de Tareas', 'Ctrl+Shift+Esc detectado');
        return;
      }

      // Detectar F11
      if (e.key === 'F11') {
        e.preventDefault();
        blockExamRealtime('Intentaste salir de pantalla completa (F11)', 'F11 detectado');
        return;
      }

      // Detectar F12
      if (e.key === 'F12') {
        e.preventDefault();
        blockExamRealtime('Intentaste abrir las herramientas de desarrollador (F12)', 'F12 detectado');
        return;
      }

      // Detectar Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        blockExamRealtime('Intentaste tomar una captura de pantalla', 'Print Screen detectado');
        return;
      }

      // Detectar Ctrl+P
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        blockExamRealtime('Intentaste imprimir la página (Ctrl+P)', 'Intento de impresión');
        return;
      }

      // Detectar Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        blockExamRealtime('Intentaste guardar la página (Ctrl+S)', 'Intento de guardado');
        return;
      }
    };

    const handleBlur = () => {
      if (!isExamActiveRef.current) return;
      blockExamRealtime('Saliste de la ventana del examen', 'Pérdida de foco detectada');
    };

    const handleVisibilityChange = () => {
      if (!isExamActiveRef.current) return;
      if (document.hidden) {
        blockExamRealtime('Cambiaste de pestaña o minimizaste el navegador', 'Cambio de visibilidad detectado');
      }
    };

    const handleFullscreenChange = () => {
      if (!isExamActiveRef.current) return;
      if (!document.fullscreenElement) {
        blockExamRealtime('Saliste del modo pantalla completa', 'Pantalla completa desactivada');
      }
    };

    const handleContextMenu = (e) => {
      if (!isExamActiveRef.current) return;
      e.preventDefault();
      addViolationRealtime('Intentaste abrir el menú contextual (clic derecho)');
      return false;
    };

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);

    const fullscreenCheck = setInterval(() => {
      if (isExamActiveRef.current && !document.fullscreenElement && !showReview) {
        blockExamRealtime('Saliste del modo pantalla completa', 'Verificación periódica');
      }
    }, 1000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(fullscreenCheck);
    };
  }, [exam, fin, showReview, isBlocked]);

  // 🆕 Bloquear con notificación en tiempo real al profesor
  const blockExamRealtime = async (reason, technicalReason) => {
    if (isBlocked || fin || hasSubmittedRef.current) return;
    
    console.warn('🚫 EXAMEN BLOQUEADO:', technicalReason);
    
    setIsBlocked(true);
    setBlockReason(reason);
    
    addViolationRealtime(reason);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 🔥 Notificar al profesor en tiempo real
    try {
      await blockStudent(exam.code, user.uid || user.email, reason);
      console.log('✅ Profesor notificado en tiempo real');
    } catch (error) {
      console.error('Error al notificar al profesor:', error);
    }
  };

  // 🆕 Agregar violación con actualización en tiempo real
  const addViolationRealtime = async (reason) => {
    const newViolations = [...violations, {
      reason,
      timestamp: new Date().toISOString()
    }];
    
    setViolations(newViolations);

    // Actualizar en tiempo real
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
          alert("⚠️ IMPORTANTE: Debes activar pantalla completa para continuar");
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

  const openReview = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    isExamActiveRef.current = false;
    setShowReview(true);
  };

  const closeReview = () => {
    setShowReview(false);
    isExamActiveRef.current = true;
    
    if (exam && !fin) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
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
  };

  const finishExam = async (forced) => {
    if (!exam || hasSubmittedRef.current || submitting) {
      return;
    }

    hasSubmittedRef.current = true;
    setSubmitting(true);
    isExamActiveRef.current = false;

    // 🆕 Remover de estudiantes activos
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

  // 🆕 Enviar mensaje al profesor en tiempo real
  const sendMessageToTeacherRealtime = async () => {
    if (!blockMessage.trim()) {
      alert("Escribe un mensaje");
      return;
    }

    try {
      await sendMessageToTeacher(exam.code, user.uid || user.email, blockMessage);
      alert("✅ Mensaje enviado al profesor en tiempo real. Espera respuesta...");
      setBlockMessage("");
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert("❌ Error al enviar el mensaje");
    }
  };

  // Resto del código visual (no cambió)...
  // [CONTINÚA EN EL SIGUIENTE MENSAJE]
  
  // ============ PANTALLA: UNIRSE AL EXAMEN ============
  if (!exam) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
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
            <button className="btn btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50" onClick={join} disabled={loading}>
              {loading ? "Buscando..." : "Ingresar"}
            </button>
          </div>
          <p className="mt-3 text-sm text-center text-gray-500 dark:text-gray-400">
            Ejemplo: <b className="text-blue-600 dark:text-blue-400">ABC123</b>
          </p>
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-2">
              ⚠️ Advertencias importantes
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• El profesor te monitoreará en tiempo real</li>
              <li>• Cualquier intento de trampa será detectado instantáneamente</li>
              <li>• No podrás salir de la ventana ni tomar capturas</li>
            </ul>
          </div>
        </div>
      </motion.div>
    );
  }

  // [CONTINÚA CON EL RESTO DEL CÓDIGO VISUAL...]
  return <div>...</div>;
}