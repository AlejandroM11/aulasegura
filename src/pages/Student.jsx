import { useEffect, useState } from "react";
import { load, save } from "../lib/storage";
import useExamGuard from "../hooks/useExamGuard";
import { motion } from "framer-motion";

export default function Student() {
  const [code, setCode] = useState("");
  const [exam, setExam] = useState(null);
  const [ans, setAns] = useState({});
  const [t, setT] = useState(0);
  const [fin, setFin] = useState(false);
  const timeOutside = useExamGuard(() => !fin && finish(true));

  useEffect(() => {
    let iv;
    if (exam && !fin) {
      setT(exam.durationMinutes * 60);

      // 🔵 Pantalla completa al iniciar examen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }

      iv = setInterval(
        () =>
          setT((x) => {
            if (x <= 1) {
              clearInterval(iv);
              finish(false);
              return 0;
            }
            return x - 1;
          }),
        1000
      );
    }
    return () => clearInterval(iv);
  }, [exam]);

  const join = () => {
    const exs = load("exams", []);
    const e = exs.find(
      (x) => x.code.toUpperCase() === code.trim().toUpperCase()
    );
    if (e) {
      setExam(e);
      setAns({});
    } else {
      alert("Código inválido");
    }
  };

  const ch = (id, v) =>
    setAns((a) => ({
      ...a,
      [id]: v,
    }));

  const finish = (forced) => {
    if (!exam) return;

    const subs = load("submissions", []);
    subs.push({
      examId: exam.id,
      code: exam.code,
      title: exam.title,
      submittedAt: new Date().toISOString(),
      answers: ans,
      timeOutsideMs: timeOutside,
      forced,
    });

    save("submissions", subs);
    setFin(true);
    alert("Examen enviado al docente.");
  };

  // -----------------------------------------------------------
  // 🔵 SECCIÓN MEJORADA: Unirse a un examen (pantalla inicial)
  // -----------------------------------------------------------
  if (!exam) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
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
              onChange={(e) => setCode(e.target.value)}
            />

            <button
              className="btn btn-primary bg-blue-600 hover:bg-blue-700"
              onClick={join}
            >
              Ingresar
            </button>
          </div>

          <p className="mt-3 text-sm text-center text-gray-500 dark:text-gray-400">
            Ejemplo:{" "}
            <b className="text-blue-600 dark:text-blue-400">ABC123</b>
          </p>
        </div>
      </motion.div>
    );
  }

  // -----------------------------------------------------------
  // 🔵 Examen activo (no se tocó diseño ni lógica)
  // -----------------------------------------------------------
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{exam.title}</h2>
        <div>
          Tiempo:{" "}
          <b>
            {Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")}
          </b>
        </div>
      </div>

      <ul className="space-y-4">
        {exam.questions.map((q) => (
          <li
            key={q.id}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-3"
          >
            <p className="mb-2">{q.text}</p>

            {q.type === "mc" ? (
              <div className="space-y-2">
                {q.options.map((op, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={"q" + q.id}
                      checked={ans[q.id] === i}
                      onChange={() => ch(q.id, i)}
                    />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="input"
                rows="3"
                value={ans[q.id] || ""}
                onChange={(e) => ch(q.id, e.target.value)}
              />
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center gap-4">
        <button
          className="btn btn-primary"
          onClick={() => finish(false)}
          disabled={fin}
        >
          Finalizar
        </button>

        <span className="text-sm opacity-70">
          Tiempo fuera: {(timeOutside / 1000).toFixed(1)} s
        </span>
      </div>
    </div>
  );
}
