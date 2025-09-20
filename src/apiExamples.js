// Ejemplos de llamadas API usando las funciones helper definidas en src/api.js

import { authAPI, postsAPI, categoriesAPI, dashboardAPI } from './api';

// Ejemplo: Login de usuario
export const exampleLogin = async () => {
  try {
    const credentials = { email: 'admin@blog.com', password: 'admin123' };
    const response = await authAPI.login(credentials);
    console.log('Login exitoso:', response);
    localStorage.setItem('auth_token', response.token);
  } catch (error) {
    console.error('Error en login:', error);
  }
};

// Ejemplo: Obtener lista de posts
export const exampleGetPosts = async () => {
  try {
    const posts = await postsAPI.getAll({ page: 1, limit: 10 });
    console.log('Posts obtenidos:', posts);
  } catch (error) {
    console.error('Error al obtener posts:', error);
  }
};

// Ejemplo: Crear un nuevo post
export const exampleCreatePost = async () => {
  try {
    const newPost = {
      title: 'Nuevo artículo desde React',
      content: 'Contenido del artículo...',
      excerpt: 'Resumen breve...',
      category_id: 1,
      featured_image: '',
      tags: ['react', 'api'],
      status: 'draft'
    };
    const response = await postsAPI.create(newPost);
    console.log('Post creado:', response);
  } catch (error) {
    console.error('Error al crear post:', error);
  }
};

// Ejemplo: Actualizar un post existente
export const exampleUpdatePost = async (postId) => {
  try {
    const updatedPost = {
      id: postId,
      title: 'Artículo actualizado desde React',
      content: 'Contenido actualizado...',
      excerpt: 'Resumen actualizado...',
      category_id: 1,
      featured_image: '',
      tags: ['react', 'api', 'update'],
      status: 'published'
    };
    const response = await postsAPI.update(updatedPost);
    console.log('Post actualizado:', response);
  } catch (error) {
    console.error('Error al actualizar post:', error);
  }
};

// Ejemplo: Eliminar un post
export const exampleDeletePost = async (postId) => {
  try {
    const response = await postsAPI.delete(postId);
    console.log('Post eliminado:', response);
  } catch (error) {
    console.error('Error al eliminar post:', error);
  }
};

// Ejemplo: Obtener categorías
export const exampleGetCategories = async () => {
  try {
    const categories = await categoriesAPI.getAll();
    console.log('Categorías obtenidas:', categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
  }
};

// Ejemplo: Obtener estadísticas del dashboard
export const exampleGetDashboardStats = async () => {
  try {
    const stats = await dashboardAPI.getStats();
    console.log('Estadísticas del dashboard:', stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
};
