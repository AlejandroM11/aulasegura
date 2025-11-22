import { auth, db } from "../database.js";


export const registerUser = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;


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


    const userRecord = await auth.createUser({ 
      email, 
      password,
      displayName: name || email.split("@")[0]
    });


    await db.collection("users").doc(userRecord.uid).set({
  email,
  name: name || email.split("@")[0],
  role,
  password, 
  createdAt: new Date().toISOString(),
  fromGoogle: false
});

    res.json({ 
      ok: true, 
      uid: userRecord.uid, 
      email, 
      role,
      name: name || email.split("@")[0]
    });

  } catch (error) {
    console.error("Error en registerUser:", error);
    res.status(400).json({ 
      ok: false, 
      error: error.message || "Error al registrar usuario" 
    });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: "Email y password son obligatorios" 
      });
    }


    const snapshot = await db.collection("users").where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        ok: false, 
        error: "Usuario no encontrado" 
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    res.json({
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
    console.error("Error en loginUser:", error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || "Error al iniciar sesión" 
    });
  }
};