// Service
export const DEFAULT_PORT = 3000;
/** Limite body delle rotte mock pubbliche `/service/*` (protezione contro
 *  abusi esterni). 1 MB. */
export const DEFAULT_BODY_SIZE_LIMIT = 1024 * 1024;
/** Limite body delle rotte applicative (`/api/*` ecc.). Generoso perché gli
 *  admin possono salvare service di grandi dimensioni senza per-field cap. 50 MB. */
export const DEFAULT_API_BODY_SIZE_LIMIT = 50 * 1024 * 1024;

// MongoDB
export const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/virtualservice';

// Google OAuth 2.0
// NB: deve corrispondere a quanto registrato sul Google Cloud Console per il client OAuth.
// /auth/google e /auth/google/callback sono ESCLUSI dal global prefix /api proprio per
// preservare questa URL contractuale (vedi `setGlobalPrefix` in main.ts).
export const DEFAULT_GOOGLE_CALLBACK_URL = 'https://virtualservice.herokuapp.com/auth/google/callback';
export const DEFAULT_GOOGLE_CLIENT_ID = 'xxxxx';
export const DEFAULT_GOOGLE_CLIENT_SECRET = 'xxx';

// SMTP (Nodemailer)
export const DEFAULT_SMTP_FROM = 'VirtualService <virtual.service.leo@gmail.com>';
export const DEFAULT_SMTP_HOST= 'smtp.gmail.com';
export const DEFAULT_SMTP_PORT = 587;
export const DEFAULT_SMTP_USER = 'virtual.service.leo@gmail.com';
export const DEFAULT_SMTP_PASS = 'xxx';
export const DEFAULT_BASE_URL = 'https://virtualservice.herokuapp.com';

// URL del frontend
export const DEFAULT_FRONTEND_URL = 'http://localhost:4200';

// JWT
export const DEFAULT_JWT_SECRET = 'xxx';
export const DEFAULT_JWT_EXPIRES_IN = '7d';
