import { readFileSync } from "fs";

try {
  const data = readFileSync("./backend/serviceAccount.json", "utf8");
  const json = JSON.parse(data);
  
  console.log("✅ Archivo JSON válido");
  console.log("📧 Project ID:", json.project_id);
  console.log("📧 Client Email:", json.client_email);
  
  if (!json.private_key) {
    console.error("❌ Falta private_key");
  } else {
    console.log("✅ Private key presente");
  }
} catch (err) {
  console.error("❌ Error:", err.message);
}