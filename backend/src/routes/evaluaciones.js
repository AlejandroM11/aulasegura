import { Router } from "express";
import { db } from "../database.js";

const router = Router();

// Obtener todos los exámenes
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("exams").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear examen
router.post("/", async (req, res) => {
  try {
    const exam = req.body;
    const ref = await db.collection("exams").add(exam);
    res.json({ id: ref.id, ...exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
