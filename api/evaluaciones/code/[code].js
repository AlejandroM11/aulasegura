import { db, setCorsHeaders } from "../../_lib/firebase.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        ok: false,
        error: "Código requerido"
      });
    }

    const snapshot = await db.collection("exams")
      .where("code", "==", code.toUpperCase())
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        ok: false,
        error: "Examen no encontrado"
      });
    }

    const doc = snapshot.docs[0];
    
    return res.status(200).json({
      ok: true,
      exam: {
        id: doc.id,
        ...doc.data()
      }
    });

  } catch (error) {
    console.error("Error en /api/evaluaciones/code:", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}