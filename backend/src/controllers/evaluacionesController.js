import { db } from "../database.js";

// 📋 Obtener todos los exámenes
export const getAllExams = async (req, res) => {
  try {
    const snapshot = await db.collection("exams").get();
    const exams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(exams);
  } catch (error) {
    console.error("Error en getAllExams:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📝 Crear nuevo examen
export const createExam = async (req, res) => {
  try {
    const { title, code, durationMinutes, questions, teacherId } = req.body;

    // Validaciones
    if (!title || !code || !durationMinutes || !questions) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios"
      });
    }

    // Verificar que el código no esté duplicado
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

    console.log("📝 Creando examen:", examData);

    const docRef = await db.collection("exams").add(examData);

    console.log("✅ Examen creado con ID:", docRef.id);

    res.json({
      ok: true,
      id: docRef.id,
      ...examData
    });

  } catch (error) {
    console.error("❌ Error en createExam:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// ✏️ Actualizar examen existente
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code, durationMinutes, questions } = req.body;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "ID del examen requerido"
      });
    }

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

    console.log("✅ Examen actualizado:", id);

    res.json({
      ok: true,
      id,
      ...updatedData
    });

  } catch (error) {
    console.error("❌ Error en updateExam:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// 🗑️ Eliminar examen
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "ID del examen requerido"
      });
    }

    const examRef = db.collection("exams").doc(id);
    const doc = await examRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        error: "Examen no encontrado"
      });
    }

    await examRef.delete();

    console.log("🗑️ Examen eliminado:", id);

    res.json({
      ok: true,
      message: "Examen eliminado exitosamente",
      id
    });

  } catch (error) {
    console.error("❌ Error en deleteExam:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

// 🔍 Obtener examen por código
export const getExamByCode = async (req, res) => {
  try {
    const { code } = req.params;

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
    res.json({
      ok: true,
      exam: {
        id: doc.id,
        ...doc.data()
      }
    });

  } catch (error) {
    console.error("❌ Error en getExamByCode:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};