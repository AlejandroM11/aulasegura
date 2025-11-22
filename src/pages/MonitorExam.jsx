import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetExams } from "../lib/api";
import { useNavigate } from "react-router-dom";
import {
  listenToActiveStudents,
  listenToMessages,
  unblockStudent as unblockStudentDB,
  respondToStudent,
  removeActiveStudent
} from "../lib/firebase";

export default function MonitorExam() {
  const navigate = useNavigate();
  
  const [selectedExam, setSelectedExam] = useState(null);
  const [exams, setExams] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [responseText, setResponseText] = useState("");

  // Cargar exámenes disponibles
  useEffect(() => {
    loadExams();
  }, []);

  // Escuchar estudiantes y mensajes en tiempo real
  useEffect(() => {
    if (!selectedExam) return;

    console.log("🔥 Conectando con Firebase para:", selectedExam.code);

    const unsubscribeStudents = listenToActiveStudents(
      selectedExam.code,
      (students) => {
        const now = Date.now();
        const activeStudents = students.filter(student => {
          const lastActivity = student.lastActivity || student.joinedAt;
          const timeSinceActivity = now - lastActivity;
          return timeSinceActivity < 30000; // Activo si tuvo actividad en últimos 30s
        });
        
        console.log(`✅ ${activeStudents.length} estudiantes activos de ${students.length}`);
        setAllStudents(activeStudents);
      }
    );

    const unsubscribeMessages = listenToMessages(
      selectedExam.code,
      (msgs) => {
        console.log("💬 Mensajes actualizados:", msgs);
        const sorted = msgs.sort((a, b) => b.timestamp - a.timestamp);
        setMessages(sorted);
      }
    );

    // Limpiador automático cada 10 segundos
    const cleanupInterval = setInterval(async () => {
      const now = Date.now();
      allStudents.forEach(async (student) => {
        const lastActivity = student.lastActivity || student.joinedAt;
        const timeSinceActivity = now - lastActivity;
        
        if (timeSinceActivity > 60000) {
          console.log(`🧹 Removiendo estudiante inactivo: ${student.name}`);
          try {
            await removeActiveStudent(selectedExam.code, student.id);
          } catch (error) {
            console.error('Error al remover estudiante:', error);
          }
        }
      });
    }, 10000);

    return () => {
      console.log("🔌 Desconectando listeners");
      clearInterval(cleanupInterval);
      unsubscribeStudents();
      unsubscribeMessages();
    };
  }, [selectedExam, allStudents]);

  const loadExams = async () => {
    try {
      const data = await apiGetExams();
      setExams(data);
    } catch (error) {
      console.error("Error al cargar exámenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockStudent = async (student) => {
    if (!window.confirm(`¿Desbloquear a ${student.name}?`)) return;

    try {
      await unblockStudentDB(selectedExam.code, student.id);
      console.log("✅ Estudiante desbloqueado:", student.name);
      alert(`✅ ${student.name} ha sido desbloqueado y puede continuar`);
    } catch (error) {
      console.error("Error al desbloquear:", error);
      alert("❌ Error al desbloquear al estudiante");
    }
  };

  const handleRespondMessage = async (messageId) => {
    if (!responseText.trim()) {
      alert("Escribe una respuesta");
      return;
    }

    try {
      await respondToStudent(selectedExam.code, messageId, responseText);
      alert("✅ Respuesta enviada al estudiante");
      setResponseText("");
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error al responder:", error);
      alert("❌ Error al enviar la respuesta");
    }
  };

  // Calcular estadísticas
  const activeStudents = allStudents.filter(s => s.status === 'active' && !s.isBlocked);
  const blockedStudents = allStudents.filter(s => s.isBlocked);
  const totalStudents = allStudents.length;

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Hace un momento";
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p>Cargando exámenes...</p>
      </div>
    );
  }

  // SELECCIÓN DE EXAMEN
  if (!selectedExam) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">📡 Monitoreo en Tiempo Real</h1>
            <p className="text-gray-600 mt-1">Selecciona un examen para comenzar a monitorear</p>
          </div>
          <button onClick={() => navigate("/docente")} className="btn btn-outline">
            ← Volver
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Exámenes disponibles</h2>

          <div className="space-y-3">
            {exams.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-4xl mb-2">📭</p>
                <p>No hay exámenes disponibles</p>
                <button onClick={() => navigate("/docente")} className="btn btn-primary mt-4">
                  Crear primer examen
                </button>
              </div>
            ) : (
              exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedExam(exam)}
                  className="p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{exam.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Código: <span className="font-mono font-bold text-blue-600">{exam.code}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">⏱️ {exam.durationMinutes} min</p>
                      <p className="text-xs text-gray-500">📝 {exam.questions?.length} preguntas</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // PANEL DE MONITOREO ACTIVO
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📡 {selectedExam.title}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Código: <span className="font-mono font-bold">{selectedExam.code}</span> • 
            Monitoreo en tiempo real activo
          </p>
        </div>
        <button
          onClick={() => setSelectedExam(null)}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
        >
          ← Volver a lista
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-3xl font-bold text-green-600">{activeStudents.length}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bloqueados</p>
              <p className="text-3xl font-bold text-red-600">{blockedStudents.length}</p>
            </div>
            <div className="text-4xl">🚫</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estudiantes activos y bloqueados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estudiantes activos */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Estudiantes activos
              <span className="text-sm font-normal text-gray-600">
                ({activeStudents.length})
              </span>
            </h2>

            {activeStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No hay estudiantes realizando el examen</p>
                <p className="text-sm mt-2 text-gray-400">
                  Los estudiantes aparecerán aquí cuando ingresen al examen
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {activeStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 border-2 rounded-xl bg-green-50 dark:bg-green-900/20 border-green-200 hover:border-green-400 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">⏱️ {formatTime(student.timeLeft)}</p>
                          <p className="text-xs text-gray-500">
                            Conectado {formatTimestamp(student.joinedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-green-200">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Respondidas</p>
                          <p className="text-lg font-bold text-blue-600">
                            {student.answeredCount || 0}/{selectedExam.questions?.length || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Violaciones</p>
                          <p className={`text-lg font-bold ${
                            (student.violations || 0) > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {student.violations || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Estado</p>
                          <p className="text-lg">✅</p>
                        </div>
                      </div>

                      {student.lastViolation && (
                        <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-800 dark:text-orange-300">
                          <b>⚠️ Última violación:</b> {student.lastViolation}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Estudiantes bloqueados */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🚫 Estudiantes bloqueados
              <span className="text-sm font-normal text-red-600">
                ({blockedStudents.length})
              </span>
            </h2>

            {blockedStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-2xl mb-2">✅</p>
                <p>No hay estudiantes bloqueados</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {blockedStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 border-2 border-red-300 rounded-xl bg-red-50 dark:bg-red-900/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                            🚫
                          </div>
                          <div>
                            <p className="font-bold">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-xs text-red-600 mt-1">
                              🕒 Bloqueado {formatTimestamp(student.blockedAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockStudent(student)}
                          className="btn btn-primary bg-green-600 hover:bg-green-700 text-sm px-4 py-2 shadow-lg"
                        >
                          ✅ Desbloquear
                        </button>
                      </div>

                      {student.blockReason && (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-l-4 border-red-500">
                          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                            Razón del bloqueo:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {student.blockReason}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                          <p className="text-gray-600">Respondidas:</p>
                          <p className="font-bold">{student.answeredCount || 0}/{selectedExam.questions?.length || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                          <p className="text-gray-600">Violaciones:</p>
                          <p className="font-bold text-red-600">{student.violations || 0}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Panel de mensajes */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              💬 Mensajes
              {messages.filter(m => !m.read).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {messages.filter(m => !m.read).length}
                </span>
              )}
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">No hay mensajes</p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => {
                    const student = allStudents.find(s => s.uid === msg.studentUid || s.id === msg.studentUid);
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`p-3 rounded-lg border-2 ${
                          msg.read 
                            ? 'bg-gray-50 dark:bg-gray-800 border-gray-200' 
                            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">
                            {student?.name || 'Estudiante'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                        
                        <p className="text-sm mb-2">{msg.message}</p>

                        {msg.response && (
                          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded mt-2 text-xs">
                            <p className="font-semibold text-green-800 dark:text-green-400">
                              Tu respuesta:
                            </p>
                            <p className="text-green-700 dark:text-green-300">{msg.response}</p>
                          </div>
                        )}

                        {!msg.response && (
                          <button
                            onClick={() => setSelectedStudent(msg)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold mt-2"
                          >
                            💬 Responder
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para responder mensajes */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Responder mensaje</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mensaje del estudiante:</p>
                <p className="text-sm font-medium">{selectedStudent.message}</p>
              </div>

              <textarea
                className="input w-full resize-none"
                rows="4"
                placeholder="Escribe tu respuesta..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="btn btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRespondMessage(selectedStudent.id)}
                  disabled={!responseText.trim()}
                  className="btn btn-primary flex-1"
                >
                  ✅ Enviar respuesta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}