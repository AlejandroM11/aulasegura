// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Inicia sesión o crea usuario con Google y guarda rol
export async function loginWithGoogle(role) {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  let list = JSON.parse(localStorage.getItem("users") || "[]");
  const exists = list.find((u) => u.email === user.email);

  if (exists) {
    // Si ya existe, validamos el rol
    if (exists.role !== role) {
      alert(`Esta cuenta ya está registrada como ${exists.role}.`);
      throw new Error("Cuenta ya registrada con otro rol.");
    }
    return exists; // Usuario existente
  } else {
    // Nuevo registro con Google
    const newUser = {
      email: user.email,
      name: user.displayName,
      photo: user.photoURL,
      role,
      fromGoogle: true
    };
    list.push(newUser);
    localStorage.setItem("users", JSON.stringify(list));
    return newUser;
  }
}
