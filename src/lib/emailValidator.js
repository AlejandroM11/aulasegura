// 📌 Lista de dominios permitidos
const allowedDomains = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "estudiantesunibague.edu.co" // Dominio institucional principal
];

// 📌 Extra: permitir cualquier dominio .edu
function isEduDomain(domain) {
  return domain.endsWith(".edu") || domain.endsWith(".edu.co");
}

// ----------------------------------------------------------------

// 📌 Valida si el dominio del email es permitido
export function isValidEmailDomain(email) {
  if (!email.includes("@")) return false;

  const domain = email.split("@")[1].toLowerCase();

  if (allowedDomains.includes(domain)) return true;

  if (isEduDomain(domain)) return true;

  return false;
}

// ----------------------------------------------------------------

// 📌 Mensaje amigable cuando un dominio NO es válido
export function getEmailValidationError(email) {
  if (!email.includes("@")) {
    return "❌ Correo inválido: falta el símbolo '@'.";
  }

  const domain = email.split("@")[1].toLowerCase();

  return (
    `❌ El dominio "${domain}" no está permitido.\n\n` +
    `Solo se permiten:\n` +
    `• Gmail\n` +
    `• Hotmail\n` +
    `• Outlook\n` +
    `• Yahoo\n` +
    `• iCloud\n` +
    `• Cualquier correo .edu\n` +
    `• estudiantesunibague.edu.co\n`
  );
}
