import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construir la ruta absoluta al serviceAccount.json
const serviceAccountPath = join(__dirname, "..", "serviceAccount.json");

let serviceAccount;

try {
  // Leer el archivo de credenciales
  const fileContent = readFileSync(serviceAccountPath, "utf8");
  serviceAccount = JSON.parse(fileContent);
  console.log("✅ Credenciales cargadas correctamente desde:", serviceAccountPath);
} catch (error) {
  console.error("❌ Error al cargar serviceAccount.json:", error.message);
  console.error("📁 Ruta buscada:", serviceAccountPath);
  process.exit(1);
}

// Inicializar Firebase Admin solo si no está inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin inicializado correctamente");
  } catch (error) {
    console.error("❌ Error al inicializar Firebase Admin:", error.message);
    process.exit(1);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();

console.log("✅ Firestore y Auth exportados correctamente");