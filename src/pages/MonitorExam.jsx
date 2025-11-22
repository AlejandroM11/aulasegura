import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetExams } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function MonitorExam() {
  const navigate = useNavigate();
  
  const [selectedExam, setSelectedExam] = useState(null);
  const [exams, setExams] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [blockedStudents, setBlockedStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  // TODO: Implementar conexión en tiempo real con Firebase Realtime Database o Firestore
  useEffect(() => {
    if (!selectedExam) return;

    // Simulación de datos en tiempo real
    const interval = setInterval(() => {
      // Aquí irá la lógica de Firebase Realtime Database
      console.log("Actualizando estado en tiempo real...");
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedExam]);

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

  const unblockStudent = (studentId) => {
    // TODO: Implementar desbloqueo en tiempo real
    console.log("Desbloqueando estudiante:", studentId);
    alert("✅ Estudiante desbloqueado");
  };

  const respondMessage = (messageId, response) => {
    // TODO: Implementar respuesta en tiempo real
    console.log("Respondiendo mensaje:", messageId, response);
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p>Cargando exámenes...</p>
      </div>
    );
  }

  if (!selectedExam) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">📡 Monitoreo en Tiempo Real</h1>
          <button
            onClick={() => navigate("/docente")}
            className="btn btn-outline"
          >
            ← Volver
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            Selecciona un examen para monitorear
          </h2>

          <div className="space-y-3">
            {exams.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay exámenes disponibles
              </p>
            ) : (
              exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedExam(exam)}
                  className="p-4 border rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{exam.title}</h3>
                      <p className="text-sm text-gray-600">
                        Código: <b className="text-blue-600">{exam.code}</b>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{exam.durationMinutes} min</p>
                      <p className="text-xs text-gray-500">{exam.questions?.length} preguntas</p>
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

  // Panel de monitoreo activo
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📡 {selectedExam.title}</h1>
          <p className="text-sm text-gray-600">Código: {selectedExam.code}</p>
        </div>
        <button
          onClick={() => setSelectedExam(null)}
          className="btn btn-outline"
        >
          ← Volver a lista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estudiantes activos */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              👥 Estudiantes activos
              <span className="text-sm font-normal text-gray-600">
                ({activeStudents.length} en línea)
              </span>
            </h2>

            {activeStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No hay estudiantes realizando el examen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 border rounded-xl bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p>Tiempo restante: {student.timeLeft}</p>
                        <p className="text-xs text-gray-500">
                          Fuera: {student.timeOutside}s
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Estudiantes bloqueados */}
          <div className="card mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🚫 Estudiantes bloqueados
              <span className="text-sm font-normal text-red-600">
                ({blockedStudents.length})
              </span>
            </h2>

            {blockedStudents.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                No hay estudiantes bloqueados
              </p>
            ) : (
              <div className="space-y-3">
                {blockedStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 border border-red-300 rounded-xl bg-red-50 dark:bg-red-900/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Bloqueado hace {student.blockedTime}
                        </p>
                      </div>
                      <button
                        onClick={() => unblockStudent(student.id)}
                        className="btn btn-primary bg-green-600 hover:bg-green-700 text-sm"
                      >
                        ✅ Desbloquear
                      </button>
                    </div>
                    {student.message && (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mt-2">
                        <p className="text-sm text-gray-600 mb-1">Mensaje del estudiante:</p>
                        <p className="text-sm italic">"{student.message}"</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de mensajes */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="text-xl font-semibold mb-4">💬 Mensajes</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">
                  No hay mensajes
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{msg.studentName}</p>
                      <p className="text-xs text-gray-500">{msg.time}</p>
                    </div>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}