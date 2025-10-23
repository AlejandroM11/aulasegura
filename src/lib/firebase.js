// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCgbKJO_Wd2IgRxfH-NtVmgul4bdreWqtk",
  authDomain: "aulasegura-d535e.firebaseapp.com",
  projectId: "aulasegura-d535e",
  storageBucket: "aulasegura-d535e.firebasestorage.app",
  messagingSenderId: "918650073829",
  appId: "1:918650073829:web:8884dd5e11c571c60a9a0c"
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
