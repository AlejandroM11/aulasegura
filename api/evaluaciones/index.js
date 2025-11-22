import { db, setCorsHeaders } from "../_lib/firebase.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Obtener todos los exámenes
    if (req.method === 'GET') {
      const snapshot = await db.collection("exams").get();
      const exams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return res.status(200).json(exams);
    }

    // POST - Crear nuevo examen
    if (req.method === 'POST') {
      const { title, code, durationMinutes, questions, teacherId } = req.body;

      if (!title || !code || !durationMinutes || !questions) {
        return res.status(400).json({
          ok: false,
          error: "Faltan campos obligatorios"
        });
      }

      const existingExam = await db.collection("exams")
        .where("code", "==", code.toUpperCase())
        .get();

      if (!existingExam.empty) {
        return res.status(400).json({
          ok: false,
          error: "El código ya está en uso"
        });
      }

      const examData = {
        title,
        code: code.toUpperCase(),
        durationMinutes: Number(durationMinutes),
        questions,
        teacherId: teacherId || null,
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection("exams").add(examData);

      return res.status(200).json({
        ok: true,
        id: docRef.id,
        ...examData
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error("Error en /api/evaluaciones:", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}