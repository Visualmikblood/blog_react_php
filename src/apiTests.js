// Scripts básicos para pruebas automatizadas de las APIs usando fetch y consola para validar respuestas

const API_BASE_URL = 'http://localhost:8000';

// Helper para hacer peticiones HTTP
import fetch from 'node-fetch';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Agregar token de autenticación si existe
  // En entorno Node.js no existe localStorage, usar variable global simulada
  const token = global.auth_token || null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Prueba login
export const testLogin = async () => {
  try {
    const credentials = { email: 'admin@blog.com', password: 'password' };
    const response = await apiRequest('/admin/auth/auth.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', ...credentials }),
    });
    console.log('Login test passed:', response);
    global.auth_token = response.token;
  } catch (error) {
    console.error('Login test failed:', error);
  }
};

// Prueba obtener posts
export const testGetPosts = async () => {
  try {
    const posts = await apiRequest('/admin/posts/list.php');
    console.log('Get posts test passed:', posts);
  } catch (error) {
    console.error('Get posts test failed:', error);
  }
};

// Prueba crear post
export const testCreatePost = async () => {
  try {
    const newPost = {
      title: 'Test post',
      content: 'Contenido de prueba',
      excerpt: 'Resumen de prueba',
      category_id: 1,
      featured_image: '',
      tags: ['test'],
      status: 'draft',
    };
    const response = await apiRequest('/admin/posts/create.php', {
      method: 'POST',
      body: JSON.stringify(newPost),
    });
    console.log('Create post test passed:', response);
  } catch (error) {
    console.error('Create post test failed:', error);
  }
};

// Prueba actualizar post
export const testUpdatePost = async (postId) => {
  try {
    const updatedPost = {
      id: postId,
      title: 'Test post updated',
      content: 'Contenido actualizado',
      excerpt: 'Resumen actualizado',
      category_id: 1,
      featured_image: '',
      tags: ['test', 'update'],
      status: 'published',
    };
    const response = await apiRequest('/admin/posts/update.php', {
      method: 'PUT',
      body: JSON.stringify(updatedPost),
    });
    console.log('Update post test passed:', response);
  } catch (error) {
    console.error('Update post test failed:', error);
  }
};

// Prueba eliminar post
export const testDeletePost = async (postId) => {
  try {
    const response = await apiRequest(`/admin/posts/delete.php?id=${postId}`, {
      method: 'DELETE',
    });
    console.log('Delete post test passed:', response);
  } catch (error) {
    console.error('Delete post test failed:', error);
  }
};

// Prueba obtener categorías
export const testGetCategories = async () => {
  try {
    const categories = await apiRequest('/admin/categories/manage.php');
    console.log('Get categories test passed:', categories);
  } catch (error) {
    console.error('Get categories test failed:', error);
  }
};

// Prueba obtener estadísticas del dashboard
export const testGetDashboardStats = async () => {
  try {
    const stats = await apiRequest('/admin/dashboard/stats.php');
    console.log('Get dashboard stats test passed:', stats);
  } catch (error) {
    console.error('Get dashboard stats test failed:', error);
  }
};

// Función para ejecutar todas las pruebas en secuencia
export const runAllTests = async () => {
  await testLogin();
  await testGetPosts();
  await testCreatePost();
  // Para update y delete, se necesita un postId válido, usar uno de los posts obtenidos
  // Aquí solo se muestra la estructura, se puede mejorar para obtener un postId dinámico
  const testPostId = 1;
  await testUpdatePost(testPostId);
  await testDeletePost(testPostId);
  await testGetCategories();
  await testGetDashboardStats();
  console.log('Todas las pruebas han finalizado.');
};
