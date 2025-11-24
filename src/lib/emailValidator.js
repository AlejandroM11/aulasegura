// src/lib/emailValidator.js

/**
 * Lista de dominios de correo permitidos
 * Incluye proveedores populares y dominios educativos
 */
const ALLOWED_DOMAINS = [
  // Proveedores populares
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'aol.com',
  'protonmail.com',
  'zoho.com',
  
  // Educativos genéricos
  'estudiantes.unibague.edu.co',
  'unibague.edu.co',
  
  // Patrones educativos (estos se validarán con regex)
  // Cualquier dominio que termine en .edu.co
];

/**
 * Valida si un correo electrónico es de un dominio permitido
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} - true si es válido, false si no
 */
export function isValidEmailDomain(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Limpiar el email
  const cleanEmail = email.toLowerCase().trim();
  
  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return false;
  }

  // Extraer el dominio
  const domain = cleanEmail.split('@')[1];

  // Verificar si está en la lista de dominios permitidos
  if (ALLOWED_DOMAINS.includes(domain)) {
    return true;
  }

  // Verificar patrones educativos (.edu, .edu.co, .ac, etc.)
  const educationalPatterns = [
    /\.edu$/,           // .edu (universidades USA)
    /\.edu\.[a-z]{2}$/, // .edu.co, .edu.mx, etc.
    /\.ac\.[a-z]{2}$/,  // .ac.uk, .ac.jp (académicos)
    /\.edu\.[a-z]{2}\.[a-z]{2}$/, // .edu.co.uk, etc.
  ];

  return educationalPatterns.some(pattern => pattern.test(domain));
}

/**
 * Obtiene un mensaje de error descriptivo para correos no válidos
 * @param {string} email - Correo que falló la validación
 * @returns {string} - Mensaje de error
 */
export function getEmailValidationError(email) {
  if (!email) {
    return 'Por favor ingresa un correo electrónico';
  }

  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(cleanEmail)) {
    return 'Por favor ingresa un correo electrónico válido';
  }

  const domain = cleanEmail.split('@')[1];
  
  return `El correo @${domain} no está permitido. Por favor usa un correo de: Gmail, Hotmail, Outlook, Yahoo, iCloud o un correo institucional educativo (.edu, .edu.co)`;
}

/**
 * Agrega un dominio personalizado a la lista de permitidos
 * @param {string} domain - Dominio a agregar (ej: 'miempresa.com')
 */
export function addAllowedDomain(domain) {
  const cleanDomain = domain.toLowerCase().trim();
  if (!ALLOWED_DOMAINS.includes(cleanDomain)) {
    ALLOWED_DOMAINS.push(cleanDomain);
  }
}

/**
 * Obtiene la lista actual de dominios permitidos (para debugging)
 * @returns {string[]} - Array de dominios permitidos
 */
export function getAllowedDomains() {
  return [...ALLOWED_DOMAINS];
}