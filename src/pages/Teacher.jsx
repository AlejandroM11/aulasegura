import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { load, save } from "../lib/storage";
import { useNavigate } from "react-router-dom";

export default function Teacher() {
  const navigate = useNavigate();

  const [exams, setExams] = useState(load("exams", []));
  const [subs, setSubs] = useState(load("submissions", []));
  const [active, setActive] = useState("crear");

  const [showRegistry, setShowRegistry] = useState(true);
  const [filter, setFilter] = useState("");

  // Crear examen
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [dur, setDur] = useState(30);

  // Preguntas
  const [questions, setQuestions] = useState([]);
  const [qtext, setQtext] = useState("");
  const [qtype, setQtype] = useState("mc");
  const [optionsRaw, setOptionsRaw] = useState("Opción A;Opción B");
  const [correctIndex, setCorrectIndex] = useState(0);

  // Modal edición/ver examen
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setExams(load("exams", []));
      setSubs(load("submissions", []));
    }, 800);
    return () => clearInterval(iv);
  }, []);

  // ➕ Agregar pregunta
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

  // ➕ Crear o guardar examen editado
  const saveExam = () => {
    if (!title.trim() || !code.trim() || questions.length === 0)
      return alert("Completa todos los campos");

    // Evitar duplicados si se crea uno nuevo
    if (!selectedExam && exams.some(e => e.code.toUpperCase() === code.toUpperCase()))
      return alert("El código ya está usado");

    const ex = selectedExam
      ? { ...selectedExam, title, code, durationMinutes: Number(dur), questions }
      : { id: crypto.randomUUID(), title, code, durationMinutes: Number(dur), questions };

    let list = selectedExam
      ? exams.map(e => (e.id === selectedExam.id ? ex : e))
      : [...exams, ex];

    save("exams", list);
    setExams(list);
    setTitle("");
    setCode("");
    setDur(30);
    setQuestions([]);
    setSelectedExam(null);

    alert(selectedExam ? "Examen actualizado" : "Examen creado exitosamente");
  };

  const filtered = useMemo(
    () => exams.filter(e => (e.code + e.title).toLowerCase().includes(filter.toLowerCase())),
    [exams, filter]
  );

  const openExam = (exam) => {
    setSelectedExam(exam);
    setTitle(exam.title);
    setCode(exam.code);
    setDur(exam.durationMinutes);
    setQuestions(exam.questions || []);
    setActive("crear");
  };

  const deleteExam = (exam) => {
    if (window.confirm(`¿Eliminar el examen "${exam.title}"? Esta acción no se puede deshacer.`)) {
      const newExams = exams.filter(e => e.id !== exam.id);
      save("exams", newExams);
      setExams(newExams);
    }
  };

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={`tab ${active === "crear" ? "tab-active" : ""}`} onClick={() => { setActive("crear"); setSelectedExam(null); }}>
          Crear examen
        </button>
        <button className={`tab ${active === "lista" ? "tab-active" : ""}`} onClick={() => setActive("lista")}>
          Registro
        </button>
        <button className={`tab ${active === "resultados" ? "tab-active" : ""}`} onClick={() => navigate("/resultados")}>
          Resultados
        </button>
      </div>

      {/* Crear examen / Editar */}
      {active === "crear" && (
        <motion.section className="card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-semibold mb-3">{selectedExam ? "Editar examen" : "Crear examen"}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="input" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
            <input className="input" placeholder="Código" value={code} onChange={e => setCode(e.target.value)} />
            <input className="input" type="number" placeholder="Duración (min)" value={dur} onChange={e => setDur(e.target.value)} />
          </div>

          {/* Preguntas */}
          <div className="mt-4">
            <input className="input w-full" placeholder="Texto de la pregunta" value={qtext} onChange={e => setQtext(e.target.value)} />
            <select className="input mt-2" value={qtype} onChange={e => setQtype(e.target.value)}>
              <option value="mc">Opción múltiple</option>
              <option value="open">Pregunta abierta</option>
            </select>

            {qtype === "mc" && (
              <div className="mt-2 p-2 border rounded">
                <input className="input w-full" value={optionsRaw} onChange={e => setOptionsRaw(e.target.value)} placeholder="Opciones separadas por ;" />
                <div className="mt-1">
                  {optionsRaw.split(";").map((o, i) => o.trim()).filter(Boolean).map((opt, i) => (
                    <label key={i} className="flex gap-2 items-center mt-1">
                      <input type="radio" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-outline mt-3" onClick={addQuestion}>Agregar pregunta</button>

            {/* Lista de preguntas */}
            <div className="mt-4 space-y-2">
              {questions.map(q => (
                <motion.div key={q.id} className="p-2 border rounded bg-gray-100 flex justify-between items-start">
                  <div>
                    <p className="font-medium">{q.text}</p>
                    {q.type === "mc" && (
                      <ul className="text-sm mt-1">
                        {q.options.map((o, i) => (
                          <li key={i} className={i === q.correctIndex ? "text-blue-600 font-bold" : ""}>{i + 1}. {o}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button className="text-red-500 text-sm" onClick={() => setQuestions(prev => prev.filter(p => p.id !== q.id))}>Eliminar</button>
                </motion.div>
              ))}
            </div>

            <button className="btn btn-primary mt-4" onClick={saveExam}>{selectedExam ? "Guardar cambios" : "Crear examen"}</button>
          </div>
        </motion.section>
      )}

      {/* Registro */}
      {active === "lista" && (
        <motion.section className="card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between mb-3">
            <h2 className="text-xl font-semibold">Registro de exámenes</h2>
            <div className="flex gap-2">
              <input className="input" placeholder="Buscar..." value={filter} onChange={e => setFilter(e.target.value)} />
              <button className="btn btn-outline" onClick={() => setShowRegistry(s => !s)}>{showRegistry ? "Ocultar" : "Mostrar"}</button>
            </div>
          </div>

          {showRegistry && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-200">
                  <tr>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Título</th>
                    <th className="p-2 text-left">Duración</th>
                    <th className="p-2 text-left">Preguntas</th>
                    <th className="p-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-3">No hay exámenes registrados</td></tr>
                  ) : (
                    filtered.map(e => (
                      <tr key={e.id} className="border-b hover:bg-blue-50 transition">
                        <td className="p-2">{e.code}</td>
                        <td className="p-2">{e.title}</td>
                        <td className="p-2">{e.durationMinutes} min</td>
                        <td className="p-2">{e.questions.length}</td>
                        <td className="p-2 flex gap-2">
                          <button className="btn btn-sm btn-outline" onClick={() => openExam(e)}>Ver / Editar</button>
                          <button className="btn btn-sm btn-red" onClick={() => deleteExam(e)}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
