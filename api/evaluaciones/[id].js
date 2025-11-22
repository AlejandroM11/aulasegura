import { db, setCorsHeaders } from "../_lib/firebase.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      ok: false,
      error: "ID del examen requerido"
    });
  }

  try {
    // PUT - Actualizar examen
    if (req.method === 'PUT') {
      const { title, code, durationMinutes, questions } = req.body;

      const examRef = db.collection("exams").doc(id);
      const doc = await examRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          ok: false,
          error: "Examen no encontrado"
        });
      }

      const updatedData = {
        title,
        code: code.toUpperCase(),
        durationMinutes: Number(durationMinutes),
        questions,
        updatedAt: new Date().toISOString()
      };

      await examRef.update(updatedData);

      return res.status(200).json({
        ok: true,
        id,
        ...updatedData
      });
    }

    // DELETE - Eliminar examen
    if (req.method === 'DELETE') {
      const examRef = db.collection("exams").doc(id);
      const doc = await examRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          ok: false,
          error: "Examen no encontrado"
        });
      }

      await examRef.delete();

      return res.status(200).json({
        ok: true,
        message: "Examen eliminado exitosamente",
        id
      });
    }

    // GET - Obtener un examen por ID
    if (req.method === 'GET') {
      const examRef = db.collection("exams").doc(id);
      const doc = await examRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          ok: false,
          error: "Examen no encontrado"
        });
      }

      return res.status(200).json({
        ok: true,
        exam: {
          id: doc.id,
          ...doc.data()
        }
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error("Error en /api/evaluaciones/[id]:", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}