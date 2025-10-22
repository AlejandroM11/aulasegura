// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

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

export async function loginWithGoogle(role) {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let list = JSON.parse(localStorage.getItem("users") || "[]");
    const exists = list.find((u) => u.email === user.email);

    if (exists) {
      if (exists.role !== role) {
        alert(`Esta cuenta ya está registrada como ${exists.role}.`);
        throw new Error("Cuenta ya registrada con otro rol.");
      }
      return exists;
    } else {
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
  } catch (err) {
    console.error("Error en loginWithGoogle:", err);
    throw err;
  }
}
