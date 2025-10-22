// src/lib/auth.js

// Guarda usuario por rol (para permitir sesiones separadas)
export function setUser(u) {
  const key = `user_${u.role}`; // ejemplo: user_docente o user_estudiante
  localStorage.setItem(key, JSON.stringify(u));
  localStorage.setItem("currentRole", u.role);
  window.dispatchEvent(new Event("auth-changed"));
}

// Obtiene el usuario activo (según rol)
export function getUser() {
  try {
    const role = localStorage.getItem("currentRole");
    if (!role) return null;
    return JSON.parse(localStorage.getItem(`user_${role}`));
  } catch {
    return null;
  }
}

// Cierra sesión del rol actual
export function logout() {
  const role = localStorage.getItem("currentRole");
  if (role) {
    localStorage.removeItem(`user_${role}`);
    localStorage.removeItem("currentRole");
  }
  window.dispatchEvent(new Event("auth-changed"));
}
