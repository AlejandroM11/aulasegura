import axios from "axios";

const API = "http://localhost:3000/api";

// Crear usuario
export async function apiCreateUser(user) {
  const res = await axios.post(`${API}/usuarios`, user);
  return res.data;
}

// Obtener todos los usuarios
export async function apiGetUsers() {
  const res = await axios.get(`${API}/usuarios`);
  return res.data;
}
