import { db, setCorsHeaders } from "../_lib/firebase.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Obtener todas las notas/submissions
    if (req.method === 'GET') {
      const snapshot = await db.collection("grades").get();
      const grades = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return res.status(200).json(grades);
    }

    // POST - Guardar una nueva nota/submission
    if (req.method === 'POST') {
      const submission = req.body;

      if (!submission.examId || !submission.answers) {
        return res.status(400).json({
          ok: false,
          error: "Faltan datos obligatorios"
        });
      }

      const docRef = await db.collection("grades").add({
        ...submission,
        createdAt: new Date().toISOString()
      });

      return res.status(200).json({
        ok: true,
        id: docRef.id,
        ...submission
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error("Error en /api/notas:", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}