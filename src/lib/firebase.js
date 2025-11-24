import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getDatabase, ref, set, onValue, push, remove, update, get } from "firebase/database"; // 🔥 Agregado 'get'
import { setUser } from "./auth";

const firebaseConfig = {
  apiKey: "AIzaSyCgbKJO_Wd2IgRxfH-NtVmgul4bdreWqtk",
  authDomain: "aulasegura-d535e.firebaseapp.com",
  projectId: "aulasegura-d535e",
  storageBucket: "aulasegura-d535e.firebasestorage.app",
  messagingSenderId: "918650073829",
  appId: "1:918650073829:web:8884dd5e11c571c60a9a0c",
  databaseURL: "https://aulasegura-d535e-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const database = getDatabase(app);

// ==================== FUNCIONES DE REALTIME DATABASE ====================

// 🎓 Registrar estudiante activo en un examen
export function registerActiveStudent(examCode, studentData) {
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentData.uid}`);
  return set(studentRef, {
    uid: studentData.uid,
    email: studentData.email,
    name: studentData.name,
    joinedAt: Date.now(),
    status: 'active',
    timeLeft: studentData.timeLeft,
    answeredCount: 0,
    violations: 0,
    isBlocked: false,
    lastActivity: Date.now()
  });
}

// 🔄 Actualizar estado del estudiante
export function updateStudentStatus(examCode, studentUid, updates) {
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  return update(studentRef, {
    ...updates,
    lastActivity: Date.now()
  });
}

// 🚫 Bloquear estudiante
export function blockStudent(examCode, studentUid, reason) {
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  return update(studentRef, {
    isBlocked: true,
    blockReason: reason,
    blockedAt: Date.now(),
    status: 'blocked'
  });
}

// ✅ Desbloquear estudiante
export function unblockStudent(examCode, studentUid) {
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  return update(studentRef, {
    isBlocked: false,
    blockReason: null,
    unblockedAt: Date.now(),
    status: 'active'
  });
}

// 💬 Enviar mensaje al profesor
export function sendMessageToTeacher(examCode, studentUid, message) {
  const messagesRef = ref(database, `active_exams/${examCode}/messages`);
  const newMessageRef = push(messagesRef);
  return set(newMessageRef, {
    studentUid,
    message,
    timestamp: Date.now(),
    read: false
  });
}

// 💬 Responder mensaje del estudiante
export function respondToStudent(examCode, messageId, response) {
  const messageRef = ref(database, `active_exams/${examCode}/messages/${messageId}`);
  return update(messageRef, {
    response,
    respondedAt: Date.now(),
    read: true
  });
}

// 🗑️ Remover estudiante al finalizar
export function removeActiveStudent(examCode, studentUid) {
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  return remove(studentRef);
}

// 👀 Escuchar estudiantes activos (para el profesor)
export function listenToActiveStudents(examCode, callback) {
  const studentsRef = ref(database, `active_exams/${examCode}/students`);
  return onValue(studentsRef, (snapshot) => {
    const students = [];
    snapshot.forEach((childSnapshot) => {
      students.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(students);
  });
}

// 👀 Escuchar mensajes (para el profesor)
export function listenToMessages(examCode, callback) {
  const messagesRef = ref(database, `active_exams/${examCode}/messages`);
  return onValue(messagesRef, (snapshot) => {
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(messages);
  });
}

// 👀 Escuchar estado de bloqueo (para el estudiante) - DEPRECADO, usar checkBlockStatus
export function listenToBlockStatus(examCode, studentUid, callback) {
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  return onValue(studentRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data.isBlocked, data.blockReason);
    }
  });
}

// 🔥 NUEVA FUNCIÓN: Leer estado de bloqueo UNA SOLA VEZ (polling manual)
export async function checkBlockStatus(examCode, studentUid) {
  try {
    const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
    const snapshot = await get(studentRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        isBlocked: data.isBlocked || false,
        blockReason: data.blockReason || null
      };
    }
    
    return { isBlocked: false, blockReason: null };
  } catch (error) {
    console.error('Error al verificar estado de bloqueo:', error);
    return { isBlocked: false, blockReason: null };
  }
}

// ==================== LOGIN CON GOOGLE ====================
export async function loginWithGoogle(role) {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let list = JSON.parse(localStorage.getItem("users") || "[]");
    let existing = list.find((u) => u.email === user.email);

    if (existing) {
      if (existing.role !== role) {
        alert(`Esta cuenta ya está registrada como ${existing.role}.`);
        return null;
      }
      setUser(existing);
      return existing;
    } else {
      const newUser = {
        uid: user.uid,
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