import express from "express";
import cors from "cors";
import { db, auth } from "./database.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/test", async (req, res) => {
  try {
    const snap = await db.collection("exams").get();
    res.json({ ok: true, count: snap.size });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.use("/", authRoutes);

app.listen(4000, () => console.log("Backend running on http://localhost:4000"));
