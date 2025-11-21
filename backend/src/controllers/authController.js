import { auth, db } from "../database.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const userRecord = await auth.createUser({ email, password });

    await db.collection("users").doc(userRecord.uid).set({
      email,
      role,
      createdAt: new Date(),
    });

    res.json({ ok: true, uid: userRecord.uid, email, role });

  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
};
