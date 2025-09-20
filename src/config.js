// Configuración de la aplicación
const isDevelopment = process.env.NODE_ENV !== 'production';

export const config = {
  // URLs de API
  API_BASE_URL: isDevelopment 
    ? 'http://localhost:8000'  // Servidor de desarrollo PHP
    : 'http://localhost/blog_react_php/api', // Servidor de producción
  
  // Credenciales por defecto para desarrollo
  DEFAULT_CREDENTIALS: {
    admin: {
      email: 'admin@blog.com',
      password: 'password'
    },
    author: {
      email: 'autor@blog.com', 
      password: 'password'
    }
  },
  
  // Configuración de autenticación
  AUTH: {
    TOKEN_KEY: 'auth_token',
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
  }
};

export default config;