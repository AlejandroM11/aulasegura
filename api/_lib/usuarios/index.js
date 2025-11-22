import { db, setCorsHeaders } from "../_lib/firebase.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Obtener todos los usuarios
    if (req.method === 'GET') {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return res.status(200).json(users);
    }

    // POST - Crear usuario (legacy, ya se usa /auth/register)
    if (req.method === 'POST') {
      const newUser = req.body;
      const ref = await db.collection("users").add({
        ...newUser,
        createdAt: new Date().toISOString()
      });
      
      return res.status(200).json({ 
        ok: true,
        id: ref.id, 
        ...newUser 
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error("Error en /api/usuarios:", error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
}