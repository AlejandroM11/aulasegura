import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getDatabase, ref, set, onValue, push, remove, update, get } from "firebase/database";
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

console.log("🔥 Firebase inicializado correctamente");
console.log("🔥 Database URL:", firebaseConfig.databaseURL);

// ==================== FUNCIONES DE REALTIME DATABASE ====================

// 🎓 Registrar estudiante activo en un examen
export function registerActiveStudent(examCode, studentData) {
  console.log("📝 Registrando estudiante:", examCode, studentData.email);
  
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
  }).then(() => {
    console.log("✅ Estudiante registrado exitosamente");
  }).catch((error) => {
    console.error("❌ Error al registrar estudiante:", error);
    throw error;
  });
}

// 🔄 Actualizar estado del estudiante
export function updateStudentStatus(examCode, studentUid, updates) {
  console.log("🔄 Actualizando estado:", examCode, studentUid, updates);
  
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  
  return update(studentRef, {
    ...updates,
    lastActivity: Date.now()
  }).then(() => {
    console.log("✅ Estado actualizado");
  }).catch((error) => {
    console.error("❌ Error al actualizar estado:", error);
  });
}

// 🚫 Bloquear estudiante
export function blockStudent(examCode, studentUid, reason) {
  console.log("🚫 Bloqueando estudiante:", examCode, studentUid, reason);
  
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  
  return update(studentRef, {
    isBlocked: true,
    blockReason: reason,
    blockedAt: Date.now(),
    status: 'blocked'
  }).then(() => {
    console.log("✅ Estudiante bloqueado");
  }).catch((error) => {
    console.error("❌ Error al bloquear:", error);
    throw error;
  });
}

// ✅ Desbloquear estudiante
export function unblockStudent(examCode, studentUid) {
  console.log("✅ Desbloqueando estudiante:", examCode, studentUid);
  
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  
  return update(studentRef, {
    isBlocked: false,
    blockReason: null,
    unblockedAt: Date.now(),
    status: 'active'
  }).then(() => {
    console.log("✅ Estudiante desbloqueado");
  }).catch((error) => {
    console.error("❌ Error al desbloquear:", error);
    throw error;
  });
}

// 💬 Enviar mensaje al profesor
export function sendMessageToTeacher(examCode, studentUid, message) {
  console.log("💬 Enviando mensaje:", examCode, studentUid);
  
  const messagesRef = ref(database, `active_exams/${examCode}/messages`);
  const newMessageRef = push(messagesRef);
  
  return set(newMessageRef, {
    studentUid,
    message,
    timestamp: Date.now(),
    read: false
  }).then(() => {
    console.log("✅ Mensaje enviado");
  }).catch((error) => {
    console.error("❌ Error al enviar mensaje:", error);
    throw error;
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
  console.log("🗑️ Removiendo estudiante:", examCode, studentUid);
  
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  
  return remove(studentRef).then(() => {
    console.log("✅ Estudiante removido");
  }).catch((error) => {
    console.error("❌ Error al remover:", error);
  });
}

// 👀 Escuchar estudiantes activos (para el profesor)
export function listenToActiveStudents(examCode, callback) {
  console.log("👀 Escuchando estudiantes en:", examCode);
  
  const studentsRef = ref(database, `active_exams/${examCode}/students`);
  
  return onValue(studentsRef, (snapshot) => {
    console.log("📡 Snapshot recibido:", snapshot.exists(), snapshot.val());
    
    const students = [];
    snapshot.forEach((childSnapshot) => {
      students.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    console.log(`✅ Estudiantes detectados: ${students.length}`);
    callback(students);
  }, (error) => {
    console.error("❌ Error en listener:", error);
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

// 👀 Escuchar estado de bloqueo (para el estudiante)
export function listenToBlockStatus(examCode, studentUid, callback) {
  console.log("👂 Escuchando estado de bloqueo:", examCode, studentUid);
  
  const studentRef = ref(database, `active_exams/${examCode}/students/${studentUid}`);
  
  return onValue(studentRef, (snapshot) => {
    const data = snapshot.val();
    console.log("📡 Estado de bloqueo actualizado:", data);
    
    if (data) {
      callback(data.isBlocked, data.blockReason);
    }
  });
}

// 🔥 Leer estado de bloqueo UNA SOLA VEZ (polling manual)
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