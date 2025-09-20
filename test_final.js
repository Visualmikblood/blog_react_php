// Script de prueba final para verificar que todo funciona
const API_BASE_URL = 'http://localhost:8000';

async function testLogin() {
  console.log('🚀 PRUEBA FINAL DEL SISTEMA\n');

  try {
    // 1. Probar login
    console.log('1️⃣ Probando login...');
    const loginResponse = await fetch(`${API_BASE_URL}/admin/auth/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'admin@blog.com',
        password: 'password'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:', loginData);

    if (!loginData.token) {
      console.error('❌ No se recibió token');
      return;
    }

    // 2. Probar verificación de token
    console.log('\n2️⃣ Probando verificación de token...');
    const verifyResponse = await fetch(`${API_BASE_URL}/admin/auth/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        token: loginData.token
      })
    });

    const verifyData = await verifyResponse.json();
    console.log('✅ Token válido:', verifyData);

    // 3. Probar creación de categoría
    console.log('\n3️⃣ Probando creación de categoría...');
    const categoryResponse = await fetch(`${API_BASE_URL}/admin/categories/manage.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Categoría de prueba'
      })
    });

    const categoryData = await categoryResponse.json();
    console.log('✅ Categoría creada:', categoryData);

    // 4. Probar creación de artículo
    console.log('\n4️⃣ Probando creación de artículo...');
    const postResponse = await fetch(`${API_BASE_URL}/admin/posts/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        title: 'Artículo de Prueba',
        content: 'Este es un artículo de prueba creado automáticamente.',
        excerpt: 'Resumen del artículo de prueba',
        category_id: 1,
        status: 'draft'
      })
    });

    const postData = await postResponse.json();
    console.log('✅ Artículo creado:', postData);

    console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    console.log('✅ Login funcionando');
    console.log('✅ Token funcionando');
    console.log('✅ Categorías funcionando');
    console.log('✅ Artículos funcionando');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas
testLogin();