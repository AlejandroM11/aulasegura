// 📌 Lista de dominios permitidos
const allowedDomains = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "estudiantesunibague.edu.co", // Dominio institucional
];

// 📌 Función para validar el dominio del correo
export function isValidEmailDomain(email) {
  if (!email.includes("@")) return false;

  const domain = email.split("@")[1].toLowerCase();

  // Permitir dominios conocidos
  if (allowedDomains.includes(domain)) return true;

  // Permitir cualquier dominio .edu
  if (domain.endsWith(".edu")) return true;

  return false;
}

// 📌 Mensaje personalizado cuando el correo no es válido
export function getEmailValidationError(email) {
  if (!email.includes("@")) {
    return "❌ Correo inválido. Debe contener '@'.";
  }

  const domain = email.split("@")[1];

  return `❌ El dominio "${domain}" no está permitido.
Solo se permiten: Gmail, Hotmail, Outlook, Yahoo, iCloud o correos .edu (incluyendo estudiantesunibague.edu.co).`;
}
