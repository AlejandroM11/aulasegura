import axios from "axios";

// Detectar automáticamente el entorno
const isDevelopment = window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1";

const API = isDevelopment 
  ? "http://localhost:3000/api"
  : "/api";

console.log("🌐 API URL:", API);

// ==================== AUTENTICACIÓN ====================
export async function apiRegister(userData) {
  const res = await axios.post(`${API}/auth/register`, userData);
  return res.data;
}

export async function apiLogin(credentials) {
  const res = await axios.post(`${API}/auth/login`, credentials);
  return res.data;
}

// ==================== USUARIOS ====================
export async function apiGetUsers() {
  const res = await axios.get(`${API}/usuarios`);
  return res.data;
}

export async function apiCreateUser(user) {
  const res = await axios.post(`${API}/usuarios`, user);
  return res.data;
}

// ==================== EXÁMENES ====================
export async function apiGetExams() {
  const res = await axios.get(`${API}/evaluaciones`);
  return res.data;
}

export async function apiCreateExam(exam) {
  const res = await axios.post(`${API}/evaluaciones`, exam);
  return res.data;
}

export async function apiUpdateExam(id, exam) {
  const res = await axios.put(`${API}/evaluaciones/${id}`, exam);
  return res.data;
}

export async function apiDeleteExam(id) {
  const res = await axios.delete(`${API}/evaluaciones/${id}`);
  return res.data;
}

export async function apiGetExamByCode(code) {
  const res = await axios.get(`${API}/evaluaciones/code/${code}`);
  return res.data;
}

// ==================== SUBMISSIONS (RESULTADOS) ====================
export async function apiGetSubmissions() {
  const res = await axios.get(`${API}/notas`);
  return res.data;
}

export async function apiCreateSubmission(submission) {
  const res = await axios.post(`${API}/notas`, submission);
  return res.data;
}