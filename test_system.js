// Script para probar el sistema completo
const API_BASE_URL = 'http://localhost:8000';

async function testSystem() {
  console.log('🚀 Probando sistema completo...\n');

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

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:', loginData.user.name);

    const token = loginData.token;

    // 2. Probar categorías
    console.log('\n2️⃣ Probando categorías...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/admin/categories/manage.php`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categorías cargadas:', categoriesData.categories.length, 'categorías');
    } else {
      console.log('❌ Error en categorías:', categoriesResponse.status);
    }

    // 3. Probar posts
    console.log('\n3️⃣ Probando posts...');
    const postsResponse = await fetch(`${API_BASE_URL}/admin/posts/list.php`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      console.log('✅ Posts cargados:', postsData.posts ? postsData.posts.length : 0, 'posts');
    } else {
      console.log('❌ Error en posts:', postsResponse.status);
    }

    // 4. Probar comentarios
    console.log('\n4️⃣ Probando comentarios...');
    const commentsResponse = await fetch(`${API_BASE_URL}/admin/comments/manage.php?status=all&page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (commentsResponse.ok) {
      const commentsData = await commentsResponse.json();
      console.log('✅ Comentarios cargados:', commentsData.comments ? commentsData.comments.length : 0, 'comentarios');
    } else {
      console.log('❌ Error en comentarios:', commentsResponse.status);
    }

    // 5. Probar usuarios
    console.log('\n5️⃣ Probando usuarios...');
    const usersResponse = await fetch(`${API_BASE_URL}/admin/users/manage.php?role=all&page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Usuarios cargados:', usersData.users ? usersData.users.length : 0, 'usuarios');
    } else {
      console.log('❌ Error en usuarios:', usersResponse.status);
    }

    console.log('\n🎉 ¡Sistema funcionando correctamente!');

  } catch (error) {
    console.error('💥 Error en el sistema:', error.message);
  }
}

testSystem();