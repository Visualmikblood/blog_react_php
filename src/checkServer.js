import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost/api';

export const checkServer = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/auth.php`, {
      method: 'OPTIONS',
    });
    if (response.ok) {
      console.log('Servidor PHP está corriendo y accesible.');
    } else {
      console.log(`Servidor respondió con estado: ${response.status}`);
    }
  } catch (error) {
    console.error('Error al conectar con el servidor PHP:', error.message);
  }
};

// Ejecutar la función si es el módulo principal
if (process.argv[1].endsWith('checkServer.js')) {
  checkServer();
}
