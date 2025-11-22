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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: "Email y password son obligatorios" 
      });
    }

    // Buscar usuario por email
    const snapshot = await db.collection("users")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        ok: false, 
        error: "Usuario no encontrado" 
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Validar password (temporal, en producción usa Firebase Auth)
    if (userData.password !== password) {
      return res.status(401).json({
        ok: false,
        error: "Contraseña incorrecta"
      });
    }

    return res.status(200).json({
      ok: true,
      user: {
        uid: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        photo: userData.photo || null
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || "Error al iniciar sesión" 
    });
  }
}