import { Router } from "express";
import { db } from "../database.js";

const router = Router();

// Obtener todos los usuarios (CON password para desarrollo)
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const data = snapshot.docs.map(doc => {
      const userData = doc.data();
      return { 
        id: doc.id, 
        ...userData  // ⚠️ Incluye password - Solo para desarrollo
      };
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear usuario (ya no se usa porque usamos auth/register)
router.post("/", async (req, res) => {
  try {
    const newUser = req.body;
    const ref = await db.collection("users").add(newUser);
    res.json({ id: ref.id, ...newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;