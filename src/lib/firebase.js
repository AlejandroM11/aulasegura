// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { setUser } from "./auth";

const firebaseConfig = {
  apiKey: "AIzaSyCgbKJO_Wd2IgRxfH-NtVmgul4bdreWqtk",
  authDomain: "aulasegura-d535e.firebaseapp.com",
  projectId: "aulasegura-d535e",
  storageBucket: "aulasegura-d535e.firebasestorage.app",
  messagingSenderId: "918650073829",
  appId: "1:918650073829:web:8884dd5e11c571c60a9a0c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

/**
 * Inicia sesión con Google y asocia el rol seleccionado (docente/estudiante).
 * Si el usuario ya existe, lo autentica; si no, lo registra.
 */
export async function loginWithGoogle(role) {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let list = JSON.parse(localStorage.getItem("users") || "[]");
    let existing = list.find((u) => u.email === user.email);

    if (existing) {
      // ⚠️ Si ya existe con otro rol, mostrar advertencia
      if (existing.role !== role) {
        alert(`Esta cuenta ya está registrada como ${existing.role}.`);
        return null;
      }

      // ✅ Si coincide el rol, iniciar sesión normalmente
      setUser(existing);
      return existing;
    } else {
      // 🆕 Nuevo registro
      const newUser = {
        email: user.email,
        name: user.displayName,
        photo: user.photoURL,
        role,
        fromGoogle: true,
      };
      list.push(newUser);
      localStorage.setItem("users", JSON.stringify(list));
      setUser(newUser);
      return newUser;
    }
  } catch (err) {
    console.error("Error en loginWithGoogle:", err);
    alert("Error al iniciar sesión con Google");
    return null;
  }
}
