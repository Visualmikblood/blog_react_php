// Script para probar el login del sistema
const API_BASE_URL = 'http://localhost:8000';

const testLogin = async () => {
  console.log('🔍 Probando login con diferentes credenciales...\n');
  
  // Credenciales a probar
  const credentialsToTest = [
    { email: 'admin@blog.com', password: 'password', description: 'Admin con password (hash en BD)' },
    { email: 'admin@blog.com', password: 'admin123', description: 'Admin con admin123 (usado en tests)' },
    { email: 'autor@blog.com', password: 'password', description: 'Autor con password' },
    { email: 'autor@blog.com', password: 'admin123', description: 'Autor con admin123' }
  ];

  for (const creds of credentialsToTest) {
    console.log(`📧 Probando: ${creds.description}`);
    console.log(`   Email: ${creds.email}`);
    console.log(`   Password: ${creds.password}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email: creds.email,
          password: creds.password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ LOGIN EXITOSO!`);
        console.log(`   👤 Usuario: ${data.user.name}`);
        console.log(`   🔑 Rol: ${data.user.role}`);
        console.log(`   🎫 Token generado: ${data.token.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ Error: ${data.message}`);
        console.log(`   📊 Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   💥 Error de conexión: ${error.message}`);
    }
    
    console.log(''); // Línea en blanco
  }
};

// Función para probar la conexión a la base de datos
const testDatabaseConnection = async () => {
  console.log('🗄️  Probando conexión a la base de datos...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/posts/list.php`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Conexión a BD exitosa');
      console.log(`📝 Posts encontrados: ${data.posts ? data.posts.length : 0}`);
    } else {
      console.log('❌ Error en conexión a BD:', data.message);
    }
  } catch (error) {
    console.log('💥 Error de conexión a BD:', error.message);
  }
  
  console.log('');
};

// Ejecutar pruebas
const runTests = async () => {
  console.log('🚀 INICIANDO PRUEBAS DE LOGIN\n');
  console.log('='.repeat(50));
  
  await testDatabaseConnection();
  await testLogin();
  
  console.log('='.repeat(50));
  console.log('✨ PRUEBAS COMPLETADAS');
};

runTests();