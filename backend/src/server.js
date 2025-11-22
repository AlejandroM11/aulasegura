import express from "express";
import cors from "cors";
import { db } from "./database.js";
import authRoutes from "./routes/authRoutes.js";
import usuariosRoutes from "./routes/usuarios.js";
import evaluacionesRoutes from "./routes/evaluaciones.js";
import notasRoutes from "./routes/notas.js";

const app = express();
const PORT = 3000; // 🔵 Cambiado a 3000 para coincidir con api.js

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/test", async (req, res) => {
  try {
    const snap = await db.collection("exams").get();
    res.json({ ok: true, count: snap.size, message: "Backend funcionando correctamente" });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/evaluaciones", evaluacionesRoutes);
app.use("/api/notas", notasRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Prueba con: http://localhost:${PORT}/test`);
});