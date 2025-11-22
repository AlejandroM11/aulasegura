import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  apiGetExams, 
  apiCreateExam, 
  apiUpdateExam, 
  apiDeleteExam 
} from "../lib/api";
import { getUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Teacher() {
  const navigate = useNavigate();
  const user = getUser();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("crear");

  const [showRegistry, setShowRegistry] = useState(true);
  const [filter, setFilter] = useState("");

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [dur, setDur] = useState(30);

  const [questions, setQuestions] = useState([]);
  const [qtext, setQtext] = useState("");
  const [qtype, setQtype] = useState("mc");
  const [optionsRaw, setOptionsRaw] = useState("Opción A;Opción B");
  const [correctIndex, setCorrectIndex] = useState(0);

  const [selectedExam, setSelectedExam] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await apiGetExams();
      setExams(data);
    } catch (error) {
      console.error("Error al cargar exámenes:", error);
      alert("Error al cargar los exámenes");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    if (!qtext.trim()) return alert("La pregunta está vacía");

    let q = { id: crypto.randomUUID(), text: qtext.trim(), type: qtype };
    
    if (qtype === "mc") {
      const opts = optionsRaw.split(";").map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return alert("Mínimo 2 opciones");
      q.options = opts;
      q.correctIndex = Number(correctIndex);
    }
    
    setQuestions(p => [...p, q]);
    setQtext("");
    setOptionsRaw("Opción A;Opción B");
    setCorrectIndex(0);
  };

  // 🔵 CORREGIDO: Guardar examen (crear o actualizar)
  const saveExam = async () => {
    if (!title.trim() || !code.trim() || questions.length === 0) {
      return alert("Completa todos los campos y agrega al menos una pregunta");
    }

    setSaving(true);

    try {
      const examData = {
        title: title.trim(),
        code: code.trim().toUpperCase(),
        durationMinutes: Number(dur),
        questions,
        teacherId: user?.uid || user?.email
      };

      if (selectedExam) {
        // 🔵 ACTUALIZAR EXAMEN EXISTENTE
        console.log("📝 Actualizando examen:", selectedExam.id, examData);
        await apiUpdateExam(selectedExam.id, examData);
        alert("✅ Examen actualizado exitosamente");
      } else {
        // 🔵 CREAR NUEVO EXAMEN
        console.log("📝 Creando nuevo examen:", examData);
        
        // Verificar que el código no exista
        const existingExam = exams.find(
          e => e.code.toUpperCase() === code.trim().toUpperCase()
        );
        
        if (existingExam) {
          alert("❌ Ya existe un examen con ese código");
          setSaving(false);
          return;
        }
        
        await apiCreateExam(examData);
        alert("✅ Examen creado exitosamente");
      }

      // Recargar lista de exámenes
      await loadExams();

      // Resetear formulario
      resetForm();
      setActive("lista"); // Ir a la lista para ver el resultado
    } catch (error) {
      console.error("Error al guardar examen:", error);
      const errorMsg = error.response?.data?.error || error.message || "Error al guardar el examen";
      alert("❌ " + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const deleteExam = async (exam) => {
    if (!window.confirm(`¿Eliminar el examen "${exam.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await apiDeleteExam(exam.id);
      alert("✅ Examen eliminado");
      await loadExams();
      
      // Si estábamos editando este examen, resetear
      if (selectedExam && selectedExam.id === exam.id) {
        resetForm();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("❌ Error al eliminar el examen");
    }
  };

  const openExam = (exam) => {
    console.log("📂 Abriendo examen para editar:", exam);
    setSelectedExam(exam);
    setTitle(exam.title);
    setCode(exam.code);
    setDur(exam.durationMinutes);
    setQuestions(exam.questions || []);
    setActive("crear");
  };

  const resetForm = () => {
    setTitle("");
    setCode("");
    setDur(30);
    setQuestions([]);
    setSelectedExam(null);
    setQtext("");
    setOptionsRaw("Opción A;Opción B");
    setCorrectIndex(0);
  };

  const filtered = useMemo(
    () => exams.filter(e => 
      (e.code + e.title).toLowerCase().includes(filter.toLowerCase())
    ),
    [exams, filter]
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button 
          className={`tab ${active === "crear" ? "tab-active" : ""}`} 
          onClick={() => { 
            setActive("crear"); 
            if (!selectedExam) {
              resetForm(); // Solo resetear si no hay examen seleccionado
            }
          }}
        >
          {selectedExam ? "✏️ Editando examen" : "➕ Crear examen"}
        </button>
        <button 
          className={`tab ${active === "lista" ? "tab-active" : ""}`} 
          onClick={() => setActive("lista")}
        >
          📋 Registro ({exams.length})
        </button>
        <button 
          className={`tab ${active === "resultados" ? "tab-active" : ""}`} 
          onClick={() => navigate("/resultados")}
        >
          📊 Resultados
        </button>
      </div>

      {/* Crear/Editar examen */}
      {active === "crear" && (
        <motion.section 
          className="card p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">
              {selectedExam ? (
                <span className="flex items-center gap-2">
                  ✏️ Editando: <span className="text-blue-600">{selectedExam.title}</span>
                </span>
              ) : (
                "➕ Nuevo examen"
              )}
            </h2>
            {selectedExam && (
              <button 
                className="btn btn-outline text-sm" 
                onClick={resetForm}
              >
                ❌ Cancelar edición
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <input 
              className="input" 
              placeholder="Título del examen" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
            <input 
              className="input" 
              placeholder="Código (ej: ABC123)" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())}
              disabled={!!selectedExam} // 🔵 No permitir cambiar código al editar
            />
            <input 
              className="input" 
              type="number" 
              placeholder="Duración (min)" 
              value={dur} 
              onChange={e => setDur(e.target.value)} 
              min="1"
            />
          </div>

          {selectedExam && (
            <p className="text-xs text-gray-500 mt-1">
              💡 No puedes cambiar el código de un examen existente
            </p>
          )}

          {/* Agregar preguntas */}
          <div className="mt-4 p-4 border rounded-xl bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold mb-3">➕ Agregar pregunta</h3>
            
            <input 
              className="input w-full" 
              placeholder="Texto de la pregunta" 
              value={qtext} 
              onChange={e => setQtext(e.target.value)} 
            />
            
            <select 
              className="input mt-2" 
              value={qtype} 
              onChange={e => setQtype(e.target.value)}
            >
              <option value="mc">Opción múltiple</option>
              <option value="open">Pregunta abierta</option>
            </select>

            {qtype === "mc" && (
              <div className="mt-2 p-3 border rounded bg-white dark:bg-gray-900">
                <label className="text-sm font-medium mb-1 block">
                  Opciones (separadas por punto y coma)
                </label>
                <input 
                  className="input w-full" 
                  value={optionsRaw} 
                  onChange={e => setOptionsRaw(e.target.value)} 
                  placeholder="Opción A;Opción B;Opción C" 
                />
                
                <p className="text-sm mt-2 mb-1 font-medium">Respuesta correcta:</p>
                <div className="space-y-1">
                  {optionsRaw.split(";").map(o => o.trim()).filter(Boolean).map((opt, i) => (
                    <label key={i} className="flex gap-2 items-center">
                      <input 
                        type="radio" 
                        checked={correctIndex === i} 
                        onChange={() => setCorrectIndex(i)} 
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="btn btn-outline mt-3" 
              onClick={addQuestion}
            >
              ➕ Agregar pregunta
            </button>
          </div>

          {/* Lista de preguntas agregadas */}
          {questions.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">📝 Preguntas ({questions.length})</h3>
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <motion.div 
                    key={q.id} 
                    className="p-3 border rounded-lg bg-blue-50 dark:bg-gray-800 flex justify-between items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {idx + 1}. {q.text}
                      </p>
                      {q.type === "mc" && (
                        <ul className="text-sm mt-1 ml-4 space-y-0.5">
                          {q.options.map((o, i) => (
                            <li 
                              key={i} 
                              className={i === q.correctIndex ? "text-green-600 font-bold" : ""}
                            >
                              {i === q.correctIndex && "✅ "}{o}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.type === "open" && (
                        <p className="text-sm text-gray-500 mt-1">Pregunta abierta</p>
                      )}
                    </div>
                    <button 
                      className="text-red-500 text-sm font-medium hover:text-red-700" 
                      onClick={() => setQuestions(prev => prev.filter(p => p.id !== q.id))}
                    >
                      🗑️
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary mt-4 w-full disabled:opacity-50" 
            onClick={saveExam}
            disabled={saving || questions.length === 0}
          >
            {saving ? "⏳ Guardando..." : (selectedExam ? "💾 Guardar cambios" : "✅ Crear examen")}
          </button>
        </motion.section>
      )}

      {/* Registro de exámenes */}
      {active === "lista" && (
        <motion.section 
          className="card p-4" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
        >
          <div className="flex justify-between mb-3">
            <h2 className="text-xl font-semibold">📋 Registro de exámenes</h2>
            <div className="flex gap-2">
              <input 
                className="input" 
                placeholder="Buscar..." 
                value={filter} 
                onChange={e => setFilter(e.target.value)} 
              />
              <button 
                className="btn btn-outline" 
                onClick={() => setShowRegistry(s => !s)}
              >
                {showRegistry ? "👁️ Ocultar" : "👁️ Mostrar"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
              <p>Cargando exámenes...</p>
            </div>
          ) : showRegistry ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Código</th>
                    <th className="p-3 text-left">Título</th>
                    <th className="p-3 text-left">Duración</th>
                    <th className="p-3 text-left">Preguntas</th>
                    <th className="p-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">
                        {filter ? "No se encontraron exámenes" : "No hay exámenes registrados"}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(e => (
                      <tr 
                        key={e.id} 
                        className="border-b hover:bg-blue-50 dark:hover:bg-gray-800 transition"
                      >
                        <td className="p-3 font-mono font-bold text-blue-600">{e.code}</td>
                        <td className="p-3">{e.title}</td>
                        <td className="p-3">{e.durationMinutes} min</td>
                        <td className="p-3">{e.questions?.length || 0}</td>
                        <td className="p-3 flex gap-2">
                          <button 
                            className="btn btn-outline text-xs" 
                            onClick={() => openExam(e)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="btn bg-red-500 text-white hover:bg-red-600 text-xs" 
                            onClick={() => deleteExam(e)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </motion.section>
      )}
    </div>
  );
}