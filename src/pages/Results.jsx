import React, { useState, useEffect } from "react";
import { apiGetSubmissions, apiGetExams } from "../lib/api";
import { getUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Results() {
  const navigate = useNavigate();
  const user = getUser();

  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [submissionsData, examsData] = await Promise.all([
        apiGetSubmissions(),
        apiGetExams()
      ]);

      const sorted = submissionsData.sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      
      setResults(sorted);
      setExams(examsData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Error al cargar los resultados");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "docente") {
    navigate("/");
    return null;
  }

  // 🔵 CORREGIDO: Formatear tiempo con límite
  const formatTimeFromMs = (ms) => {
    if (ms === undefined || ms === null) return "0s";
    
    // Limitar a máximo 30 segundos para evitar números absurdos
    const limitedMs = Math.min(ms, 30000);
    const seconds = Math.round(limitedMs / 1000);
    
    if (seconds === 0) return "0s";
    if (seconds < 60) return `${seconds}s`;
    
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const safeFormatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso || "—";
    }
  };

  const getExamForSubmission = (submission) => {
    return exams.find(e => e.id === submission.examId || e.code === submission.code);
  };

  const renderAnswer = (questionId, answer, exam) => {
    if (!exam || !exam.questions) return String(answer);

    const question = exam.questions.find(q => q.id == questionId);
    if (!question) return String(answer);

    if (question.type === "mc") {
      const selectedIndex = Number(answer);
      const selectedOption = question.options?.[selectedIndex];
      const isCorrect = selectedIndex === question.correctIndex;

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="text-green-600 font-bold text-lg">✅</span>
            ) : (
              <span className="text-red-600 font-bold text-lg">❌</span>
            )}
            <span className={isCorrect ? "text-green-700 font-semibold" : "text-red-700"}>
              {selectedOption || `Opción ${selectedIndex + 1}`}
            </span>
          </div>
          {!isCorrect && question.options && (
            <div className="text-xs text-gray-600 ml-7">
              Correcta: <span className="text-green-600 font-semibold">
                {question.options[question.correctIndex]}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-gray-800">
        {String(answer)}
      </div>
    );
  };

  const calculateGrade = (submission, exam) => {
    if (!exam || !exam.questions) return null;

    const mcQuestions = exam.questions.filter(q => q.type === "mc");
    if (mcQuestions.length === 0) return null;

    let correct = 0;
    mcQuestions.forEach(q => {
      const answer = submission.answers[q.id];
      if (answer !== undefined && Number(answer) === q.correctIndex) {
        correct++;
      }
    });

    const percentage = (correct / mcQuestions.length) * 100;
    return {
      correct,
      total: mcQuestions.length,
      percentage: percentage.toFixed(1)
    };
  };

  const filtered = results.filter(r => {
    const searchTerm = filter.toLowerCase();
    return (
      r.code?.toLowerCase().includes(searchTerm) ||
      r.title?.toLowerCase().includes(searchTerm) ||
      r.studentEmail?.toLowerCase().includes(searchTerm) ||
      r.studentName?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-900 to-blue-950 text-white">
      <div className="max-w-6xl mx-auto py-12 px-6">

        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-wide text-white drop-shadow-lg flex items-center gap-2">
              📊 Resultados de los estudiantes
            </h1>
            <p className="text-blue-200 mt-2">
              Total de entregas: <b className="text-white">{results.length}</b>
            </p>
          </div>

          <button
            onClick={() => navigate("/docente")}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 transition rounded-xl shadow-lg text-white font-medium transform hover:-translate-y-0.5 hover:scale-105"
          >
            ← Volver
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por código, título o estudiante..."
            className="w-full md:w-96 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-blue-300 text-xl font-medium">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            Cargando resultados...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-blue-300 text-xl font-medium">
            📭 Aún no hay resultados registrados.
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Título</th>
                    <th className="p-3">Calificación</th>
                    <th className="p-3">Tiempo fuera</th>
                    <th className="p-3">Forzado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-blue-200">
                        No se encontraron resultados
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, i) => {
                      const exam = getExamForSubmission(r);
                      const grade = calculateGrade(r, exam);
                      // 🔵 CORREGIDO: Limitar tiempo antes de mostrarlo
                      const limitedTime = Math.min(r.timeOutsideMs || 0, 30000);

                      return (
                        <tr
                          key={r.id || i}
                          className="border-b border-white/20 hover:bg-white/10 transition cursor-pointer"
                        >
                          <td className="p-3 align-top text-blue-50 font-medium">
                            {safeFormatDate(r.submittedAt)}
                          </td>
                          <td className="p-3 align-top text-blue-50">
                            <div className="font-semibold">{r.studentName || "—"}</div>
                            <div className="text-xs text-blue-200">{r.studentEmail || "—"}</div>
                          </td>
                          <td className="p-3 align-top text-blue-50 font-mono font-bold">
                            {r.code || r.examId || "—"}
                          </td>
                          <td className="p-3 align-top text-blue-50 font-medium">
                            {r.title || "—"}
                          </td>
                          <td className="p-3 align-top">
                            {grade ? (
                              <div className="flex flex-col">
                                <span className={`font-bold text-lg ${
                                  grade.percentage >= 70 ? 'text-green-400' : 
                                  grade.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {grade.percentage}%
                                </span>
                                <span className="text-xs text-blue-200">
                                  {grade.correct}/{grade.total}
                                </span>
                              </div>
                            ) : (
                              <span className="text-blue-200 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="p-3 align-top text-blue-50">
                            <span className={limitedTime > 10000 ? "text-red-300 font-bold" : ""}>
                              {formatTimeFromMs(limitedTime)}
                              {r.timeOutsideMs >= 30000 && <span className="text-xs ml-1">(máx)</span>}
                            </span>
                          </td>
                          <td className="p-3 align-top">
                            {r.forced ? (
                              <span className="px-2 py-1 bg-red-500 text-white rounded-full font-medium shadow-md text-xs">
                                Sí ⚠️
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-500 text-white rounded-full font-medium shadow-md text-xs">
                                No ✅
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center align-top">
                            <button
                              onClick={() => setSelected({ ...r, exam })}
                              className="px-4 py-1 bg-blue-500 hover:bg-blue-400 rounded-lg shadow text-white font-medium transition transform hover:-translate-y-0.5 hover:scale-105"
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLE */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center p-4 z-50"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white text-gray-900 max-w-3xl w-full p-6 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-3 text-gray-800 flex items-center gap-2">
                📝 Detalle del examen
              </h2>

              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Estudiante:</strong> {selected.studentName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selected.studentEmail}
                  </div>
                  <div>
                    <strong>Código:</strong> <span className="font-mono text-blue-600">{selected.code}</span>
                  </div>
                  <div>
                    <strong>Título:</strong> {selected.title}
                  </div>
                  <div>
                    <strong>Enviado:</strong> {safeFormatDate(selected.submittedAt)}
                  </div>
                  <div>
                    <strong>Tiempo fuera:</strong> {formatTimeFromMs(Math.min(selected.timeOutsideMs || 0, 30000))}
                    {selected.timeOutsideMs >= 30000 && <span className="text-xs text-red-600 ml-1">(máximo alcanzado)</span>}
                  </div>
                  {(() => {
                    const grade = calculateGrade(selected, selected.exam);
                    return grade ? (
                      <div className="col-span-2">
                        <strong>Calificación:</strong>{" "}
                        <span className={`text-2xl font-bold ${
                          grade.percentage >= 70 ? 'text-green-600' : 
                          grade.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {grade.percentage}%
                        </span>
                        <span className="text-gray-600 ml-2">
                          ({grade.correct} correctas de {grade.total})
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <h3 className="font-semibold text-gray-700 text-lg">Respuestas:</h3>
                {selected.exam && selected.exam.questions ? (
                  selected.exam.questions.map((q, idx) => {
                    const answer = selected.answers[q.id];
                    return (
                      <div 
                        key={q.id} 
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="font-semibold text-gray-800 mb-2">
                          {idx + 1}. {q.text}
                        </div>
                        <div className="ml-4">
                          {answer !== undefined ? (
                            renderAnswer(q.id, answer, selected.exam)
                          ) : (
                            <span className="text-gray-400 italic">Sin respuesta</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  Object.entries(selected.answers || {}).map(([qid, ans]) => (
                    <div 
                      key={qid} 
                      className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 text-gray-900 shadow-md"
                    >
                      <strong className="text-blue-700">Pregunta {qid}:</strong> 
                      <div className="mt-1 ml-2">{String(ans)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelected(null)}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-500 transition rounded-lg font-medium shadow-md transform hover:-translate-y-0.5 hover:scale-105"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}