import { Router } from "express";
import { db } from "../database.js";

const router = Router();

// Obtener todas las notas
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("grades").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar una nueva nota (respuestas del estudiante)
router.post("/", async (req, res) => {
  try {
    const grade = req.body;
    const ref = await db.collection("grades").add(grade);
    res.json({ id: ref.id, ...grade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
