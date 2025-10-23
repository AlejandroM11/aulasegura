// Manejo de sesión persistente con soporte multirol y pestañas
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

export function setUser(u) {
  // Guarda tanto en localStorage (persistente) como en sessionStorage (solo pestaña)
  localStorage.setItem('user', JSON.stringify(u));
  sessionStorage.setItem('user', JSON.stringify(u));
  window.dispatchEvent(new Event('auth-changed'));
}

export function logout() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-changed'));
}

// Al cargar la página, sincroniza la sesión si existe en localStorage
if (!sessionStorage.getItem('user') && localStorage.getItem('user')) {
  sessionStorage.setItem('user', localStorage.getItem('user'));
}
