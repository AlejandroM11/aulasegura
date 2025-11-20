// ===============================
// STORAGE PRINCIPAL DE AULASEGURA
// ===============================

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

// ===============================
// SEED (solo la primera vez)
// ===============================
export function seed() {
  if (load("_seeded", false)) return;

  const exams = [
    {
      id: crypto.randomUUID(),
      code: "ABC123",
      title: "Examen de Fundamentos",
      durationMinutes: 3,
      questions: [
        {
          id: 1,
          type: "mc",
          text: "¿Qué es un componente en React?",
          options: [
            "Una ruta",
            "Una función o clase de UI",
            "Una base de datos",
            "Un hook"
          ]
        },
        {
          id: 2,
          type: "mc",
          text: "¿Comando para iniciar Vite?",
          options: ["npm build", "npm run dev", "npm start", "vite build"]
        },
        {
          id: 3,
          type: "open",
          text: "Define “estado” (state)."
        }
      ]
    }
  ];

  save("exams", exams);
  save("users", []);
  save("submissions", []); // ← AQUÍ SE GUARDAN LOS RESULTADOS
  save("_seeded", true);
}

// ===============================
// GETTERS Y SETTERS OFICIALES
// ===============================

export function getAllExams() {
  return load("exams", []);
}

export function getAllResults() {
  return load("submissions", []);
}

export function saveResult(result) {
  const all = load("submissions", []);
  all.push(result);
  save("submissions", all);
}

// Obtener info de usuario
export function getUserData() {
  return load("user", null);
}
