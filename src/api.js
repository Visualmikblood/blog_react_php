// Configuración de la API
const API_BASE_URL = 'http://localhost:8000';
const USE_PROXY = false; // Cambiar a false para usar URLs directas

// Función helper para hacer peticiones HTTP
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
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Asegurar que el body sea JSON válido
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log('Enviando petición a:', url);
    console.log('Configuración:', config);
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

// Funciones de autenticación
export const authAPI = {
  login: (credentials) => {
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);

    return fetch(`${API_BASE_URL}/admin/auth/auth.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  verifyToken: (token) => {
    const formData = new FormData();
    formData.append('action', 'verify');
    formData.append('token', token);

    return fetch(`${API_BASE_URL}/admin/auth/auth.php`, {
      method: 'POST',
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones de posts
export const postsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/admin/posts/list.php?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  create: (postData) => {
    const formData = new FormData();
    formData.append('action', 'create');
    Object.keys(postData).forEach(key => {
      if (postData[key] !== null && postData[key] !== undefined) {
        formData.append(key, postData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/admin/posts/create.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  update: (postData) => {
    return fetch(`${API_BASE_URL}/admin/posts/update.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: JSON.stringify(postData)
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  delete: (postId) => {
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', postId);

    return fetch(`${API_BASE_URL}/admin/posts/delete.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones de categorías
export const categoriesAPI = {
  getAll: () => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/admin/categories/manage.php`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  create: (categoryData) => {
    const formData = new FormData();
    formData.append('action', 'create');
    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== null && categoryData[key] !== undefined) {
        formData.append(key, categoryData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/admin/categories/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  update: (categoryData) => {
    const formData = new FormData();
    formData.append('action', 'update');
    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== null && categoryData[key] !== undefined) {
        formData.append(key, categoryData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/admin/categories/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  delete: (categoryId) => {
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', categoryId);

    return fetch(`${API_BASE_URL}/admin/categories/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones de dashboard
export const dashboardAPI = {
  getStats: () => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/admin/dashboard/stats.php`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones de subida de archivos
export const uploadAPI = {
  uploadImage: (formData) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/admin/upload.php`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones de comentarios
export const commentsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/admin/comments/manage.php?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  update: (commentData) => {
    return fetch(`${API_BASE_URL}/admin/comments/manage.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: JSON.stringify(commentData)
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  delete: (commentId) => {
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', commentId);

    return fetch(`${API_BASE_URL}/admin/comments/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones de usuarios
export const usersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/admin/users/manage.php?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  create: (userData) => {
    const formData = new FormData();
    formData.append('action', 'create');
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/admin/users/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  update: (userData) => {
    const formData = new FormData();
    formData.append('action', 'update');
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/admin/users/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  delete: (userId) => {
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', userId);

    return fetch(`${API_BASE_URL}/admin/users/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones de configuración
export const settingsAPI = {
  getAll: () => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}/admin/settings/manage.php`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  update: (settingsData) => {
    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('settings', JSON.stringify(settingsData));

    return fetch(`${API_BASE_URL}/admin/settings/manage.php`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : undefined
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

// Funciones públicas (sin autenticación requerida)
export const publicAPI = {
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetch(`${API_BASE_URL}/public.php/public/posts?${queryString}`, {
      method: 'GET'
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  },

  getPostById: (postId) => fetch(`${API_BASE_URL}/public.php/public/posts/${postId}`, {
    method: 'GET'
  }).then(response => {
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      });
    }
    return response.json();
  }),

  getCategories: () => fetch(`${API_BASE_URL}/public.php/public/categories`, {
    method: 'GET'
  }).then(response => {
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      });
    }
    return response.json();
  }),

  createComment: (postId, commentData) => {
    return fetch(`${API_BASE_URL}/public.php/public/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentData)
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

export default {
  auth: authAPI,
  posts: postsAPI,
  categories: categoriesAPI,
  dashboard: dashboardAPI,
  comments: commentsAPI,
  users: usersAPI,
  settings: settingsAPI,
  public: publicAPI
};
