import React, { useState } from "react";
import { getAllResults, getUserData } from "../lib/storage";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Results() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const user = getUserData();

  if (!user || user.role !== "docente") {
    navigate("/");
    return null;
  }

  const results = getAllResults() || [];

  const formatTimeFromMs = (ms) => {
    if (ms === undefined || ms === null) return "--";
    const seconds = Math.round(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const safeFormatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso || "—";
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-900 to-blue-950 text-white">
      <div className="max-w-6xl mx-auto py-12 px-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <h1 className="text-4xl font-bold tracking-wide text-white drop-shadow-lg flex items-center gap-2">
            📊 Resultados de los estudiantes
          </h1>

          <button
            onClick={() => navigate("/docente")}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 transition rounded-xl shadow-lg text-white font-medium transform hover:-translate-y-0.5 hover:scale-105"
          >
            ← Volver
          </button>
        </div>

        {/* NO RESULTS */}
        {results.length === 0 ? (
          <div className="text-center py-20 text-blue-300 text-xl font-medium">
            Aún no hay resultados registrados.
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Título</th>
                    <th className="p-3">Tiempo fuera</th>
                    <th className="p-3">Forzado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/20 hover:bg-white/10 transition cursor-pointer"
                    >
                      <td className="p-3 align-top text-blue-50 font-medium">{safeFormatDate(r.submittedAt)}</td>
                      <td className="p-3 align-top text-blue-50 font-semibold">{r.code || r.examId || "—"}</td>
                      <td className="p-3 align-top text-blue-50 font-medium">{r.title || "—"}</td>
                      <td className="p-3 align-top text-blue-50">{formatTimeFromMs(r.timeOutsideMs)}</td>
                      <td className="p-3 align-top">
                        {r.forced ? (
                          <span className="px-2 py-1 bg-red-500 text-white rounded-full font-medium shadow-md">
                            Sí
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full font-medium shadow-md">
                            No
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center align-top">
                        <button
                          onClick={() => setSelected(r)}
                          className="px-4 py-1 bg-blue-500 hover:bg-blue-400 rounded-lg shadow text-white font-medium transition transform hover:-translate-y-0.5 hover:scale-105"
                        >
                          Ver respuestas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE RESPUESTAS */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white text-gray-900 max-w-lg w-full p-6 rounded-2xl shadow-2xl relative"
            >
              <h2 className="text-2xl font-bold mb-2 text-gray-800 flex items-center gap-2">
                📝 Respuestas
              </h2>

              <p className="text-gray-700 mb-2 font-medium">
                Código: <strong>{selected.code}</strong> — Título: <strong>{selected.title}</strong>
              </p>
              <p className="text-gray-600 mb-4">Enviado: {safeFormatDate(selected.submittedAt)}</p>

              <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
                {(selected.answers && Object.keys(selected.answers).length > 0)
                  ? Object.entries(selected.answers).map(([qid, ans]) => (
                      <div key={qid} className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 text-gray-900 shadow-md">
                        <strong>P{qid}:</strong> <span className="ml-2">{String(ans)}</span>
                      </div>
                    ))
                  : <div className="p-3 bg-gray-100 rounded-lg text-gray-600">Sin respuestas</div>
                }
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700 font-medium">
                  Tiempo fuera: <strong>{formatTimeFromMs(selected.timeOutsideMs)}</strong>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 transition rounded-md font-medium shadow-md transform hover:-translate-y-0.5 hover:scale-105"
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
