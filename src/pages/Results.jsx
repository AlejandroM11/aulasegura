import React, { useState } from "react";
import { getAllResults, getUserData } from "../lib/storage";
import { useNavigate } from "react-router-dom";

export default function Results() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const user = getUserData();

  // Rol correcto: "docente"
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

  const formatAnswersBlock = (answers) => {
    if (!answers || Object.keys(answers).length === 0) return <span className="text-gray-400">Sin respuestas</span>;
    // answers in your app is an object with questionId -> value
    return (
      <div className="bg-gray-50 dark:bg-gray-900/40 p-2 rounded text-sm">
        {Object.entries(answers).map(([qid, ans]) => (
          <div key={qid} className="py-1">
            <strong className="mr-2">P{qid}:</strong>
            <span>{String(ans)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-900 to-blue-950 text-white">
      <div className="max-w-6xl mx-auto py-12 px-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-bold tracking-wide">
            📊 Resultados de los estudiantes
          </h1>

          <button
            onClick={() => navigate("/docente")}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 transition rounded-xl shadow-lg"
          >
            ← Volver
          </button>
        </div>

        {/* NO RESULTS */}
        {results.length === 0 ? (
          <div className="text-center py-20 text-blue-300 text-xl">
            Aún no hay resultados registrados.
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/10 text-blue-200">
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
                      className="border-b border-white/10 hover:bg-white/10 transition text-sm"
                    >
                      <td className="p-3 align-top">{safeFormatDate(r.submittedAt)}</td>
                      <td className="p-3 align-top">{r.code || r.examId || "—"}</td>
                      <td className="p-3 align-top">{r.title || "—"}</td>

                      <td className="p-3 align-top">
                        {formatTimeFromMs(r.timeOutsideMs)}
                      </td>

                      <td className="p-3 align-top">
                        {r.forced ? (
                          <span className="px-2 py-1 bg-red-200 text-red-700 rounded">Sí</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-200 text-green-700 rounded">No</span>
                        )}
                      </td>

                      <td className="p-3 text-center align-top">
                        <button
                          onClick={() => setSelected(r)}
                          className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg shadow"
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
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white text-black max-w-lg w-full p-6 rounded-2xl shadow-2xl relative">

            <h2 className="text-2xl font-bold mb-2">
              Respuestas
            </h2>
            <p className="text-gray-700 mb-2">
              Código: <strong>{selected.code}</strong> — Título: <strong>{selected.title}</strong>
            </p>
            <p className="text-gray-600 mb-4">Enviado: {safeFormatDate(selected.submittedAt)}</p>

            <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
              {(selected.answers && Object.keys(selected.answers).length > 0)
                ? Object.entries(selected.answers).map(([qid, ans]) => (
                    <div key={qid} className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                      <strong>P{qid}:</strong> <span className="ml-2">{String(ans)}</span>
                    </div>
                  ))
                : <div className="p-3 bg-gray-100 rounded-lg text-gray-600">Sin respuestas</div>
              }
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Tiempo fuera: <strong>{formatTimeFromMs(selected.timeOutsideMs)}</strong>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
