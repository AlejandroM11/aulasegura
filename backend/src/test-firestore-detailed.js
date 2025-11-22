import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, "..", "serviceAccount.json");

try {
  const fileContent = readFileSync(serviceAccountPath, "utf8");
  const serviceAccount = JSON.parse(fileContent);
  
  console.log("✅ Credenciales cargadas");
  console.log("📧 Project ID:", serviceAccount.project_id);
  console.log("📧 Client Email:", serviceAccount.client_email);
  

  if (!serviceAccount.private_key.includes("BEGIN PRIVATE KEY")) {
    console.error("❌ El private_key parece estar mal formateado");
    process.exit(1);
  }
  
  console.log("✅ Private key tiene formato correcto");
  

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log("✅ Firebase Admin inicializado");
  }
  

  console.log("\n🔍 Intentando acceder a Firestore...");
  const db = admin.firestore();
  

  const timeout = setTimeout(() => {
    console.error("❌ Timeout: La operación tardó demasiado");
    process.exit(1);
  }, 10000);
  

  console.log("📝 Intentando escribir un documento de prueba...");
  const testRef = db.collection("_test").doc("connection_test");
  await testRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    message: "Test de conexión desde Admin SDK"
  });
  
  console.log("✅ Escritura exitosa!");
  

  console.log("📖 Intentando leer el documento...");
  const doc = await testRef.get();
  
  if (doc.exists) {
    console.log("✅ Lectura exitosa!");
    console.log("📄 Datos:", doc.data());
  } else {
    console.log("⚠️ El documento no existe");
  }
  

  await testRef.delete();
  console.log("🧹 Documento de prueba eliminado");
  
  clearTimeout(timeout);
  
  console.log("\n✅✅✅ FIRESTORE FUNCIONA CORRECTAMENTE ✅✅✅");
  process.exit(0);
  
} catch (error) {
  console.error("\n❌ ERROR DETALLADO:");
  console.error("Mensaje:", error.message);
  console.error("Código:", error.code);
  console.error("Stack:", error.stack);
  
  if (error.message.includes("UNAUTHENTICATED")) {
    console.error("\n💡 POSIBLES CAUSAS:");
    console.error("1. Las credenciales de serviceAccount.json no son válidas");
    console.error("2. Las credenciales fueron revocadas en Firebase Console");
    console.error("3. El proyecto de Firebase tiene restricciones de API");
    console.error("\n🔧 SOLUCIÓN:");
    console.error("Ve a Firebase Console → Project Settings → Service Accounts");
    console.error("→ Generate New Private Key y reemplaza el archivo serviceAccount.json");
  }
  
  process.exit(1);
}