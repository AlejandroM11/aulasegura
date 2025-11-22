import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("📁 Directorio actual:", __dirname);

const serviceAccountPath = join(__dirname, "..", "serviceAccount.json");
console.log("📁 Ruta completa:", serviceAccountPath);

try {
  const fileContent = readFileSync(serviceAccountPath, "utf8");
  const serviceAccount = JSON.parse(fileContent);
  
  console.log("✅ Archivo leído correctamente");
  console.log("📧 Project ID:", serviceAccount.project_id);
  
  // Inicializar Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log("✅ Firebase Admin inicializado");
  
  // Probar Firestore
  const db = admin.firestore();
  const snapshot = await db.collection("exams").get();
  
  console.log("✅ Firestore funciona! Documentos encontrados:", snapshot.size);
  process.exit(0);
  
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}