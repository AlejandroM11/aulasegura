import { db, auth, setCorsHeaders } from "../_lib/firebase.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, role, name } = req.body;

    // Validaciones
    if (!email || !password || !role) {
      return res.status(400).json({ 
        ok: false, 
        error: "Email, password y role son obligatorios" 
      });
    }

    if (!["estudiante", "docente"].includes(role)) {
      return res.status(400).json({ 
        ok: false, 
        error: "El rol debe ser 'estudiante' o 'docente'" 
      });
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({ 
      email, 
      password,
      displayName: name || email.split("@")[0]
    });

    // Guardar datos adicionales en Firestore
    await db.collection("users").doc(userRecord.uid).set({
      email,
      name: name || email.split("@")[0],
      role,
      password, // ⚠️ Solo para desarrollo
      createdAt: new Date().toISOString(),
      fromGoogle: false
    });

    return res.status(200).json({ 
      ok: true, 
      uid: userRecord.uid, 
      email, 
      role,
      name: name || email.split("@")[0]
    });

  } catch (error) {
    console.error("Error en register:", error);
    return res.status(400).json({ 
      ok: false, 
      error: error.message || "Error al registrar usuario" 
    });
  }
}