import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  Plus, Edit3, Save, X, Eye, Image, Bold, Italic, Link, List,
  Hash, Quote, Code, Upload, Calendar, User, Tag, Folder,
  Settings, Trash2, Search, Filter, MoreVertical, Check,
  AlertCircle, FileText, BarChart3, Users, MessageSquare, LogIn, LogOut,
  Home, BookOpen, Clock, ArrowLeft, Moon, Sun
} from 'lucide-react';
import { authAPI, postsAPI, categoriesAPI, dashboardAPI, uploadAPI, commentsAPI, usersAPI, settingsAPI, publicAPI } from './api';

// Contexto del tema
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Cargar preferencia del localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));

    // Aplicar clase al elemento raíz
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const AdminPanel = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState('welcome');
  const [isPublicView, setIsPublicView] = useState(false);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Estados para el editor
  const [editorPost, setEditorPost] = useState({
    id: null,
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    featured_image: '',
    tags: [],
    status: 'draft'
  });

  // Estados del editor de texto
  const [editorMode, setEditorMode] = useState('visual'); // visual, markdown, preview
  const [selectedText, setSelectedText] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'

  // Estados de login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Estados del formulario del editor
  const [editorForm, setEditorForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category_id: '',
    status: 'draft',
    featured_image: '',
    tags: []
  });

  // Estados de filtros y búsqueda
  const [postsFilters, setPostsFilters] = useState({
    search: '',
    category: '',
    status: '',
    page: 1,
    limit: 10
  });

  const [filteredPosts, setFilteredPosts] = useState([]);

  // Estados para comentarios, usuarios y configuración
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    // Verificar si ya hay un token guardado
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Inicializar filteredPosts con todos los posts
    setFilteredPosts(posts);
  }, [posts]);

  // Funciones de autenticación
  const verifyToken = async (token) => {
    try {
      const response = await authAPI.verifyToken(token);
      if (response.valid) {
        setIsAuthenticated(true);
        setUser(response.user);
        setCurrentView('dashboard');
      } else {
        localStorage.removeItem('auth_token');
        setCurrentView('login');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      localStorage.removeItem('auth_token');
      setCurrentView('login');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Intentando login con:', loginData);
      const response = await authAPI.login(loginData);
      console.log('Respuesta del login:', response);

      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        setIsAuthenticated(true);
        setUser(response.user);
        setCurrentView('dashboard');
        showNotification('Inicio de sesión exitoso');
      } else {
        showNotification(response.message || 'Error en el inicio de sesión', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Error al iniciar sesión: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('login');
    showNotification('Sesión cerrada exitosamente');
  };

  // Funciones de carga de datos
  const loadInitialData = async () => {
    try {
      // Cargar posts
      const postsResponse = await postsAPI.getAll();
      if (postsResponse.posts) {
        // Formatear posts para el frontend
        const formattedPosts = postsResponse.posts.map(post => ({
          ...post,
          date: new Date(post.created_at).toISOString().split('T')[0],
          category: post.category_name || 'Sin categoría'
        }));
        setPosts(formattedPosts);
      }

      // Cargar categorías
      const categoriesResponse = await categoriesAPI.getAll();
      if (categoriesResponse.categories) {
        setCategories(categoriesResponse.categories);
      } else {
        // Cargar categorías de ejemplo si falla la API
        setCategories([
          { id: 1, name: 'Tecnología', slug: 'tecnologia', post_count: 2 },
          { id: 2, name: 'Diseño', slug: 'diseno', post_count: 0 },
          { id: 3, name: 'Marketing', slug: 'marketing', post_count: 0 },
          { id: 4, name: 'Tutoriales', slug: 'tutoriales', post_count: 0 }
        ]);
      }

      // Cargar estadísticas del dashboard
      const statsResponse = await dashboardAPI.getStats();
      if (statsResponse.stats) {
        setDashboardStats(statsResponse.stats);
      } else {
        // Estadísticas de ejemplo
        setDashboardStats({
          total_posts: posts.length,
          total_views: 2140,
          total_likes: 38,
          total_comments: 38,
          total_categories: 4,
          total_authors: 2
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showNotification('Error al cargar los datos - usando datos de ejemplo', 'error');
      // Cargar datos de ejemplo si falla la API
      loadSampleData();
    }
  };

  const loadSampleData = () => {
    const samplePosts = [
      {
        id: 1,
        title: 'Bienvenido a ModernBlog',
        excerpt: 'Primer artículo de bienvenida al blog ModernBlog',
        content: '# Bienvenido a ModernBlog\n\n¡Hola! Este es el primer artículo de nuestro blog moderno.',
        category: 'Tecnología',
        author: 'Administrador',
        date: '2024-01-15',
        status: 'published',
        views: 120,
        likes: 15,
        comments: 4,
        featured_image: '',
        tags: ['React', 'PHP', 'Blog']
      },
      {
        id: 2,
        title: 'Guía completa de React Hooks',
        excerpt: 'Guía completa sobre React Hooks y su uso práctico',
        content: '# Guía completa de React Hooks\n\nLos React Hooks revolucionaron la forma en que escribimos componentes.',
        category: 'Tecnología',
        author: 'Autor Demo',
        date: '2024-01-10',
        status: 'published',
        views: 200,
        likes: 25,
        comments: 8,
        featured_image: '',
        tags: ['React', 'JavaScript', 'Desarrollo Web']
      }
    ];

    const sampleCategories = [
      { id: 1, name: 'Tecnología', slug: 'tecnologia', post_count: 2 },
      { id: 2, name: 'Diseño', slug: 'diseno', post_count: 0 },
      { id: 3, name: 'Marketing', slug: 'marketing', post_count: 0 },
      { id: 4, name: 'Tutoriales', slug: 'tutoriales', post_count: 0 }
    ];

    setPosts(samplePosts);
    setCategories(sampleCategories);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSavePost = async () => {
    setIsLoading(true);
    try {
      if (editorPost.id) {
        // Actualizar post existente
        await postsAPI.update(editorPost);
        showNotification('Artículo actualizado exitosamente');
      } else {
        // Crear nuevo post
        const postData = {
          title: editorPost.title,
          content: editorPost.content,
          excerpt: editorPost.excerpt,
          category_id: editorPost.category_id,
          status: editorPost.status,
          featured_image: editorPost.featured_image,
          tags: editorPost.tags
        };

        await postsAPI.create(postData);
        showNotification('Artículo creado exitosamente');
      }

      // Recargar posts después de guardar
      await loadInitialData();
      setCurrentView('posts');
    } catch (error) {
      console.error('Error saving post:', error);
      showNotification('Error al guardar el artículo: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPost = () => {
    const newPost = {
      id: null,
      title: '',
      content: '',
      excerpt: '',
      category_id: '',
      featured_image: '',
      tags: [],
      status: 'draft'
    };
    setEditorPost(newPost);
    setEditorForm({
      title: '',
      excerpt: '',
      content: '',
      category_id: '',
      status: 'draft',
      featured_image: '',
      tags: []
    });
    setCurrentView('editor');
  };

  const handleEditPost = (post) => {
    const editPost = {
      id: post.id,
      title: post.title,
      content: post.content || `# ${post.title}\n\n${post.excerpt}\n\nEste es el contenido del artículo...`,
      excerpt: post.excerpt,
      category_id: categories.find(c => c.name === post.category)?.id || '',
      featured_image: post.featured_image || '',
      tags: post.tags || [],
      status: post.status
    };
    setEditorPost(editPost);
    setEditorForm({
      title: editPost.title,
      excerpt: editPost.excerpt,
      content: editPost.content,
      category_id: editPost.category_id,
      status: editPost.status,
      featured_image: editPost.featured_image,
      tags: editPost.tags
    });
    setCurrentView('editor');
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.')) return;

    setIsLoading(true);
    try {
      await postsAPI.delete(postId);
      showNotification('Artículo eliminado exitosamente');
      await loadInitialData();
    } catch (error) {
      console.error('Error deleting post:', error);
      showNotification('Error al eliminar el artículo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await postsAPI.getAll(postsFilters);
      if (response.posts) {
        const formattedPosts = response.posts.map(post => ({
          ...post,
          date: new Date(post.created_at).toISOString().split('T')[0],
          category: post.category_name || 'Sin categoría'
        }));
        setFilteredPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error searching posts:', error);
      showNotification('Error al buscar artículos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setPostsFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setPostsFilters({
      search: '',
      category: '',
      status: '',
      page: 1,
      limit: 10
    });
    setFilteredPosts([]);
  };

  const insertMarkdown = (before, after = '') => {
    const textarea = document.getElementById('content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const newText = before + selectedText + after;
    const newContent =
      textarea.value.substring(0, start) +
      newText +
      textarea.value.substring(end);

    setEditorForm(prev => ({ ...prev, content: newContent }));

    // Restaurar posición del cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const formatText = (type) => {
    switch (type) {
      case 'bold':
        insertMarkdown('**', '**');
        break;
      case 'italic':
        insertMarkdown('*', '*');
        break;
      case 'heading':
        insertMarkdown('## ');
        break;
      case 'link':
        insertMarkdown('[', '](url)');
        break;
      case 'list':
        insertMarkdown('- ');
        break;
      case 'quote':
        insertMarkdown('> ');
        break;
      case 'code':
        insertMarkdown('`', '`');
        break;
    }
  };

  const generatePreview = () => {
    if (!editorForm.content) return '<p class="text-gray-500 italic">La vista previa aparecerá aquí...</p>';

    // Convertir Markdown básico a HTML con mejor formato
    let html = editorForm.content
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800 border-b border-gray-200 pb-1">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-10 mb-6 text-gray-900 border-b-2 border-blue-500 pb-2">$1</h1>')

      // Texto formateado
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">$1</code>')
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono text-red-600">$1</code></pre>')

      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 my-4 text-gray-700 italic bg-blue-50 py-2">$1</blockquote>')

      // Listas
      .replace(/^- (.*$)/gm, '<li class="ml-6 mb-1">• $1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-6 mb-1">$1. $2</li>')

      // Enlaces e imágenes
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md my-4" />')

      // Párrafos
      .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
      .replace(/\n/g, '<br>');

    // Envolver en contenedor con estilos
    return `
      <div class="prose prose-lg max-w-none">
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p class="mb-4 leading-relaxed text-gray-800">${html}</p>
        </div>
      </div>
    `;
  };

  // Componente de Notificación
  const Notification = () => (
    notification && (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
      } text-white`}>
        <div className="flex items-center gap-2">
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          {notification.message}
        </div>
      </div>
    )
  );

  // Vista Dashboard
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">{posts.length}</h3>
              <p className="text-gray-600">Total Artículos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">2,140</h3>
              <p className="text-gray-600">Vistas Totales</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">38</h3>
              <p className="text-gray-600">Comentarios</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Folder className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">{categories.length}</h3>
              <p className="text-gray-600">Categorías</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Artículos Recientes</h3>
        <div className="space-y-4">
          {posts.slice(0, 5).map(post => (
            <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800">{post.title}</h4>
                <p className="text-sm text-gray-600">{post.category} • {post.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {post.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
                <button onClick={() => handleEditPost(post)} className="text-blue-600 hover:text-blue-800">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Vista Lista de Posts
  const PostsList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Artículos</h2>
        <button
          onClick={handleNewPost}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Artículo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={postsFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={postsFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <select
              value={postsFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Título</th>
                  <th className="text-left py-3 px-4">Categoría</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-left py-3 px-4">Fecha</th>
                  <th className="text-left py-3 px-4">Estadísticas</th>
                  <th className="text-left py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(filteredPosts.length > 0 ? filteredPosts : posts).map(post => (
                  <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <h4 className="font-medium text-gray-800">{post.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{post.excerpt.substring(0, 60)}...</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {post.date}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>{post.views} vistas</span>
                        <span>{post.likes} likes</span>
                        <span>{post.comments} comentarios</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar artículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Editor de Artículos
  const ArticleEditor = () => {
    const titleRef = useRef(null);
    const excerptRef = useRef(null);
    const contentRef = useRef(null);
    const categoryRef = useRef(null);
    const statusRef = useRef(null);
    const featuredImageRef = useRef(null);
    const tagsRef = useRef(null);
    const imageUploadRef = useRef(null);

    const handleImageButtonClick = useCallback(() => {
      imageUploadRef.current?.click();
    }, []);

    const handleImageUpload = useCallback(async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen es demasiado grande. Máximo 5MB', 'error');
        return;
      }

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await uploadAPI.uploadImage(formData);
        setEditorForm(prev => ({ ...prev, featured_image: response.image_url }));
        setEditorPost(prev => ({ ...prev, featured_image: response.image_url }));
        showNotification('Imagen subida exitosamente');
      } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Error al subir la imagen: ' + error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }, []);

    const handleSavePost = async () => {
      setSaveStatus('saving');
      setIsLoading(true);

      try {
        const postData = {
          id: editorPost.id,
          title: editorForm.title,
          excerpt: editorForm.excerpt,
          content: editorForm.content,
          category_id: editorForm.category_id || null,
          status: editorForm.status,
          featured_image: editorForm.featured_image,
          tags: editorForm.tags
        };


        if (postData.id) {
          // Actualizar post existente
          console.log('Actualizando post existente con ID:', postData.id);
          await postsAPI.update(postData);
          setSaveStatus('saved');
          showNotification('Artículo actualizado exitosamente');
        } else {
          // Crear nuevo post
          console.log('Creando nuevo post');
          await postsAPI.create(postData);
          setSaveStatus('saved');
          showNotification('Artículo creado exitosamente');
        }

        // Recargar posts
        await loadInitialData();
        setCurrentView('posts');

        // Limpiar estado después de 2 segundos
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (error) {
        console.error('Error saving post:', error);
        setSaveStatus('error');
        showNotification('Error al guardar el artículo: ' + error.message, 'error');
        setTimeout(() => setSaveStatus(''), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {editorPost.id ? 'Editar Artículo' : 'Crear Nuevo Artículo'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('posts')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancelar
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSavePost}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>

              {saveStatus && (
                <div className={`flex items-center gap-2 text-sm ${
                  saveStatus === 'saving' ? 'text-blue-600' :
                  saveStatus === 'saved' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>}
                  {saveStatus === 'saved' && <Check className="w-4 h-4" />}
                  {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                  <span>
                    {saveStatus === 'saving' && 'Guardando...'}
                    {saveStatus === 'saved' && 'Guardado'}
                    {saveStatus === 'error' && 'Error al guardar'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Artículo
                  </label>
                  <input
                    type="text"
                    value={editorForm.title}
                    onChange={(e) => setEditorForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ingresa el título de tu artículo..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resumen/Excerpt
                  </label>
                  <textarea
                    value={editorForm.excerpt}
                    onChange={(e) => setEditorForm(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Breve descripción del artículo..."
                    rows="3"
                    maxLength="160"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {editorForm.excerpt?.length || 0}/160 caracteres
                  </div>
                </div>

                {/* Editor Toolbar */}
                <div className="border-b border-gray-200">
                  <div className="flex items-center gap-1 mb-4">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setEditorMode('visual')}
                        className={`px-3 py-1 rounded text-sm ${
                          editorMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        Visual
                      </button>
                      <button
                        onClick={() => setEditorMode('markdown')}
                        className={`px-3 py-1 rounded text-sm ${
                          editorMode === 'markdown' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        Markdown
                      </button>
                      <button
                        onClick={() => setEditorMode('preview')}
                        className={`px-3 py-1 rounded text-sm ${
                          editorMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        Vista Previa
                      </button>
                    </div>
                    
                    {editorMode === 'visual' && (
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => formatText('bold')}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Negrita"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('italic')}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Cursiva"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('heading')}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Título"
                        >
                          <Hash className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('link')}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Enlace"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('list')}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Lista"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('quote')}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Cita"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('code')}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Código"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Área de Contenido */}
                <div>
                  {editorMode === 'preview' ? (
                    <div
                      className="min-h-96 p-4 border border-gray-300 rounded-lg bg-gray-50"
                      dangerouslySetInnerHTML={{ __html: generatePreview() }}
                    />
                  ) : (
                    <textarea
                      id="content-editor"
                      value={editorForm.content}
                      onChange={(e) => setEditorForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={editorMode === 'markdown' ?
                        "# Tu artículo aquí...\n\nEscribe en **Markdown** para dar formato a tu contenido.\n\n## Subtítulo\n\nPuedes usar:\n- Listas\n- **Negrita**\n- *Cursiva*\n- `Código`\n- [Enlaces](http://ejemplo.com)" :
                        "Escribe el contenido de tu artículo aquí..."
                      }
                      rows="20"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                    />
                  )}
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {editorForm.content?.split(/\s+/).filter(word => word.length > 0).length || 0} palabras
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Configuración de Publicación */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Publicación</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={editorForm.status}
                    onChange={(e) => setEditorForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={editorForm.category_id}
                    onChange={(e) => setEditorForm(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Imagen Destacada */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Imagen Destacada</h3>
              {editorPost.featured_image ? (
                <div className="space-y-3">
                  <img
                    src={editorPost.featured_image.startsWith('http') ? editorPost.featured_image : `/uploads/${editorPost.featured_image.split('/').pop()}`}
                    alt="Imagen destacada"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="flex gap-2 relative">
                    <button
                      onClick={() => setEditorPost(prev => ({ ...prev, featured_image: '' }))}
                      className="text-red-600 hover:text-red-800 text-sm relative z-10"
                    >
                      Eliminar imagen
                    </button>
                    <button
                      onClick={handleImageButtonClick}
                      className="text-blue-600 hover:text-blue-800 text-sm relative z-10"
                    >
                      Cambiar imagen
                    </button>
                    <input
                      ref={imageUploadRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Seleccionar imagen</p>
                    <div className="flex gap-2 justify-center">
                      <input
                        type="url"
                        placeholder="URL de la imagen"
                        value={editorForm.featured_image}
                        onChange={(e) => setEditorForm(prev => ({ ...prev, featured_image: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-gray-400">o</span>
                      <button
                        onClick={handleImageButtonClick}
                        className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 relative z-10"
                      >
                        Subir archivo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Tags</h3>
              <input
                type="text"
                placeholder="Agregar tags separados por comas"
                value={editorForm.tags.join(', ')}
                onChange={(e) => setEditorForm(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">SEO</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value="url-generada-automaticamente"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Descripción
                  </label>
                  <textarea
                    value="Descripción generada automáticamente"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0/160 caracteres
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista de Categorías
  const CategoriesView = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({
      name: '',
      description: '',
      icon: ''
    });

    const handleCreateCategory = async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await categoriesAPI.create(categoryForm);
        showNotification('Categoría creada exitosamente');
        setShowCreateModal(false);
        setCategoryForm({ name: '', description: '', icon: '' });
        await loadInitialData();
      } catch (error) {
        console.error('Error creating category:', error);
        showNotification('Error al crear la categoría', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleUpdateCategory = async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await categoriesAPI.update({ ...categoryForm, id: editingCategory.id });
        showNotification('Categoría actualizada exitosamente');
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '', icon: '' });
        await loadInitialData();
      } catch (error) {
        console.error('Error updating category:', error);
        showNotification('Error al actualizar la categoría', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteCategory = async (categoryId) => {
      if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return;

      setIsLoading(true);
      try {
        await categoriesAPI.delete(categoryId);
        showNotification('Categoría eliminada exitosamente');
        await loadInitialData();
      } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Error al eliminar la categoría', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const openEditModal = (category) => {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || ''
      });
    };

    const closeModal = () => {
      setShowCreateModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: '' });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Categorías</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {cat.icon && <span className="text-lg">{cat.icon}</span>}
                    <h3 className="font-semibold">{cat.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {cat.description && (
                  <p className="text-sm text-gray-600 mb-2">{cat.description}</p>
                )}
                <p className="text-sm text-gray-500">{cat.post_count || 0} artículos</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal para crear/editar categoría */}
        {(showCreateModal || editingCategory) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre de la categoría"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción de la categoría"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icono (emoji)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📁"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Vista de Comentarios
  const CommentsView = () => {
    const [commentsFilters, setCommentsFilters] = useState({
      status: 'all',
      page: 1,
      limit: 10
    });
    const [commentsData, setCommentsData] = useState([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    const loadComments = useCallback(async () => {
      if (hasLoaded || isLoadingComments) return; // Evitar carga duplicada

      setIsLoadingComments(true);
      try {
        const response = await commentsAPI.getAll(commentsFilters);
        if (response.comments) {
          setCommentsData(response.comments);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        showNotification('Error al cargar comentarios', 'error');
        // Cargar datos de ejemplo si falla la API
        setCommentsData([
          {
            id: 1,
            author_name: 'Juan Pérez',
            author_email: 'juan@email.com',
            content: '¡Excelente artículo! Me encantó la introducción.',
            status: 'approved',
            post_title: 'Bienvenido a ModernBlog',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            author_name: 'María García',
            author_email: 'maria@email.com',
            content: '¿Cuándo publicarán más tutoriales?',
            status: 'pending',
            post_title: 'Guía completa de React Hooks',
            created_at: '2024-01-10T14:20:00Z'
          }
        ]);
        setHasLoaded(true);
      } finally {
        setIsLoadingComments(false);
      }
    }, [commentsFilters, hasLoaded, isLoadingComments]);

    useEffect(() => {
      if (!hasLoaded && !isLoadingComments) {
        loadComments();
      }
    }, [loadComments, hasLoaded, isLoadingComments]);

    const handleUpdateCommentStatus = async (commentId, newStatus) => {
      setIsLoading(true);
      try {
        await commentsAPI.update({ id: commentId, status: newStatus });
        showNotification('Comentario actualizado exitosamente');
        await loadComments();
      } catch (error) {
        console.error('Error updating comment:', error);
        showNotification('Error al actualizar comentario', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteComment = async (commentId) => {
      if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

      setIsLoading(true);
      try {
        await commentsAPI.delete(commentId);
        showNotification('Comentario eliminado exitosamente');
        await loadComments();
      } catch (error) {
        console.error('Error deleting comment:', error);
        showNotification('Error al eliminar comentario', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'approved': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Comentarios</h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <select
                value={commentsFilters.status}
                onChange={(e) => setCommentsFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>

            <div className="space-y-4">
              {commentsData.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay comentarios para mostrar</p>
                </div>
              ) : (
                commentsData.map(comment => (
                  <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-800">{comment.author_name}</span>
                          <span className="text-sm text-gray-500">en</span>
                          <span className="font-medium text-blue-600">{comment.post_title}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{comment.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                          <span>{comment.author_email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={comment.status}
                          onChange={(e) => handleUpdateCommentStatus(comment.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="approved">Aprobar</option>
                          <option value="rejected">Rechazar</option>
                        </select>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar comentario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista de Usuarios
  const UsersView = () => {
    const [usersFilters, setUsersFilters] = useState({
      role: 'all',
      page: 1,
      limit: 10
    });
    const [usersData, setUsersData] = useState([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
      name: '',
      email: '',
      password: '',
      role: 'user',
      bio: ''
    });

    const loadUsers = useCallback(async () => {
      if (hasLoaded) return; // Evitar carga duplicada

      try {
        const response = await usersAPI.getAll(usersFilters);
        if (response.users) {
          setUsersData(response.users);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error al cargar usuarios', 'error');
        // Cargar datos de ejemplo si falla la API
        setUsersData([
          {
            id: 1,
            name: 'Administrador',
            email: 'admin@blog.com',
            role: 'admin',
            bio: 'Administrador del blog ModernBlog',
            posts_count: 2,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Autor Demo',
            email: 'autor@blog.com',
            role: 'author',
            bio: 'Autor de contenido para el blog',
            posts_count: 1,
            created_at: '2024-01-05T00:00:00Z'
          }
        ]);
        setHasLoaded(true);
      }
    }, [usersFilters, hasLoaded]);

    useEffect(() => {
      if (!hasLoaded) {
        loadUsers();
      }
    }, [loadUsers, hasLoaded, isLoading]);

    const handleCreateUser = async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await usersAPI.create(userForm);
        showNotification('Usuario creado exitosamente');
        setShowCreateModal(false);
        setUserForm({ name: '', email: '', password: '', role: 'user', bio: '' });
        await loadUsers();
      } catch (error) {
        console.error('Error creating user:', error);
        showNotification('Error al crear usuario', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleUpdateUser = async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await usersAPI.update({ ...userForm, id: editingUser.id });
        showNotification('Usuario actualizado exitosamente');
        setEditingUser(null);
        setUserForm({ name: '', email: '', password: '', role: 'user', bio: '' });
        await loadUsers();
      } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error al actualizar usuario', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteUser = async (userId) => {
      if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

      setIsLoading(true);
      try {
        await usersAPI.delete(userId);
        showNotification('Usuario eliminado exitosamente');
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error al eliminar usuario', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const openEditModal = (user) => {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        password: '', // No mostrar contraseña existente
        role: user.role,
        bio: user.bio || ''
      });
    };

    const closeModal = () => {
      setShowCreateModal(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'user', bio: '' });
    };

    const getRoleColor = (role) => {
      switch (role) {
        case 'admin': return 'bg-red-100 text-red-800';
        case 'author': return 'bg-blue-100 text-blue-800';
        case 'user': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Usuarios</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <select
                value={usersFilters.role}
                onChange={(e) => setUsersFilters(prev => ({ ...prev, role: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="author">Autores</option>
                <option value="user">Usuarios</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Usuario</th>
                    <th className="text-left py-3 px-4">Rol</th>
                    <th className="text-left py-3 px-4">Artículos</th>
                    <th className="text-left py-3 px-4">Registro</th>
                    <th className="text-left py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <h4 className="font-medium text-gray-800">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.bio && <p className="text-xs text-gray-500 mt-1">{user.bio}</p>}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'author' ? 'Autor' : 'Usuario'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {user.posts_count || 0}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal para crear/editar usuario */}
        {(showCreateModal || editingUser) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Contraseña"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!editingUser}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Usuario</option>
                    <option value="author">Autor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={userForm.bio}
                    onChange={(e) => setUserForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Breve descripción del usuario"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Vista de Configuración
  const SettingsView = () => {
    const [settingsForm, setSettingsForm] = useState({});
    const [settingsData, setSettingsData] = useState({});
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);

    const loadSettings = useCallback(async () => {
      if (hasLoaded || isLoadingSettings) return; // Evitar carga duplicada

      setIsLoadingSettings(true);
      try {
        const response = await settingsAPI.getAll();
        if (response.settings) {
          setSettingsData(response.settings);
          // Convertir el objeto de settings a formato de formulario
          const formData = {};
          Object.keys(response.settings).forEach(key => {
            formData[key] = { ...response.settings[key] };
          });
          setSettingsForm(formData);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Error al cargar configuración', 'error');
      } finally {
        setIsLoadingSettings(false);
      }
    }, [hasLoaded, isLoadingSettings]);

    useEffect(() => {
      if (!hasLoaded && !isLoadingSettings) {
        loadSettings();
      }
    }, []); // Solo ejecutar una vez al montar el componente

    const handleSettingChange = (key, value) => {
      setSettingsForm(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          value: value
        }
      }));
    };

    const handleSaveSettings = async () => {
      setIsLoading(true);
      try {
        await settingsAPI.update({ settings: settingsForm });
        showNotification('Configuración guardada exitosamente');
        await loadSettings();
      } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error al guardar configuración', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const renderSettingInput = (key, setting) => {
      const { value, type, description } = setting;

      switch (type) {
        case 'boolean':
          return (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settingsForm[key]?.value === 'true' || settingsForm[key]?.value === true}
                onChange={(e) => handleSettingChange(key, e.target.checked.toString())}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          );
        case 'integer':
          return (
            <input
              type="number"
              value={settingsForm[key]?.value || ''}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          );
        default:
          return (
            <input
              type="text"
              value={settingsForm[key]?.value || ''}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          );
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Configuración</h2>
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="space-y-6">
            {Object.keys(settingsForm).length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Cargando configuración...</p>
              </div>
            ) : (
              Object.entries(settingsForm).map(([key, setting]) => (
                <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      {setting.description && (
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      )}
                    </div>
                    <div className="ml-4 w-64">
                      {renderSettingInput(key, setting)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Información</h4>
              <p className="text-sm text-blue-700">
                Los cambios en la configuración se aplicarán inmediatamente después de guardar.
                Algunos cambios pueden requerir recargar la página para verse reflejados.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista de Login
  const LoginView = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Panel Admin
            </h1>
            <p className="text-gray-600">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@blog.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Credenciales por defecto: admin@blog.com / password
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Navegación Sidebar
  const Sidebar = () => {
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'posts', label: 'Artículos', icon: FileText },
      { id: 'categories', label: 'Categorías', icon: Folder },
      { id: 'comments', label: 'Comentarios', icon: MessageSquare },
      { id: 'users', label: 'Usuarios', icon: Users },
      { id: 'settings', label: 'Configuración', icon: Settings },
    ];

    return (
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg h-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Panel Admin
          </h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                currentView === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}

          {/* Enlace al blog público */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsPublicView(true)}
              className="w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            >
              <BookOpen className="w-5 h-5 mr-3" />
              Ver Blog Público
            </button>
          </div>
        </nav>
      </div>
    );
  };

  // Vista Pública del Blog
  const PublicBlogView = () => {
    const [publicPosts, setPublicPosts] = useState([]);
    const [publicCategories, setPublicCategories] = useState([]);
    const [currentPost, setCurrentPost] = useState(null);
    const [publicFilters, setPublicFilters] = useState({
      page: 1,
      limit: 10,
      category: '',
      search: ''
    });
    const [isLoadingPublic, setIsLoadingPublic] = useState(false);

    const loadPublicPosts = useCallback(async () => {
      setIsLoadingPublic(true);
      try {
        const response = await publicAPI.getPosts(publicFilters);
        if (response.posts) {
          setPublicPosts(response.posts);
        }
      } catch (error) {
        console.error('Error loading public posts:', error);
      } finally {
        setIsLoadingPublic(false);
      }
    }, [publicFilters]);

    const loadPublicCategories = useCallback(async () => {
      try {
        const response = await publicAPI.getCategories();
        if (response.categories) {
          setPublicCategories(response.categories);
        }
      } catch (error) {
        console.error('Error loading public categories:', error);
      }
    }, []);

    const loadPostById = useCallback(async (postId) => {
      setIsLoadingPublic(true);
      try {
        const response = await publicAPI.getPostById(postId);
        if (response.post) {
          setCurrentPost(response.post);
        }
      } catch (error) {
        console.error('Error loading post:', error);
        showNotification('Error al cargar el artículo', 'error');
      } finally {
        setIsLoadingPublic(false);
      }
    }, []);

    useEffect(() => {
      if (isPublicView) {
        if (currentPost) {
          // Si estamos viendo un post individual, no recargamos la lista
          return;
        }
        loadPublicPosts();
        loadPublicCategories();
      }
    }, [isPublicView, loadPublicPosts, loadPublicCategories, currentPost]);

    const handlePublicFilterChange = (filterType, value) => {
      setPublicFilters(prev => ({ ...prev, [filterType]: value, page: 1 }));
    };

    const viewPost = (postId) => {
      loadPostById(postId);
    };

    const backToBlog = () => {
      setCurrentPost(null);
      setPublicFilters(prev => ({ ...prev, page: 1 }));
    };

    // Componente para el formulario de comentarios
    const CommentForm = ({ postId, onCommentAdded }) => {
      const [commentData, setCommentData] = useState({
        author_name: '',
        author_email: '',
        content: ''
      });
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
          await publicAPI.createComment(postId, commentData);
          showNotification('Comentario enviado exitosamente. Está pendiente de aprobación.');
          setCommentData({ author_name: '', author_email: '', content: '' });
          if (onCommentAdded) {
            onCommentAdded();
          }
        } catch (error) {
          console.error('Error creating comment:', error);
          showNotification('Error al enviar el comentario: ' + error.message, 'error');
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={commentData.author_name}
                onChange={(e) => setCommentData(prev => ({ ...prev, author_name: e.target.value }))}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={commentData.author_email}
                onChange={(e) => setCommentData(prev => ({ ...prev, author_email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario *
            </label>
            <textarea
              value={commentData.content}
              onChange={(e) => setCommentData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Escribe tu comentario aquí..."
              rows="4"
              maxLength="1000"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {commentData.content.length}/1000 caracteres
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 dark:from-blue-600 dark:to-purple-700"
            >
              <MessageSquare className="w-4 h-4" />
              {isSubmitting ? 'Enviando...' : 'Enviar Comentario'}
            </button>
          </div>
        </form>
      );
    };

    if (currentPost) {
      // Vista de artículo individual
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <button
                onClick={backToBlog}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al blog
              </button>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {currentPost.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentPost.read_time}
                </span>
                <span>{currentPost.date}</span>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-6 py-8">
            <article className="bg-white rounded-xl shadow-lg overflow-hidden">
              {currentPost.featured_image && (
                <img
                  src={currentPost.featured_image.startsWith('http') ? currentPost.featured_image : `/uploads/${currentPost.featured_image.split('/').pop()}`}
                  alt={currentPost.title}
                  className="w-full h-64 object-cover"
                />
              )}

              <div className="p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {currentPost.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-8">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {currentPost.author}
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {currentPost.comments_count} comentarios
                  </span>
                </div>

                <div className="prose prose-lg max-w-none">
                  {currentPost.content.split('\n').map((paragraph, index) => {
                    if (paragraph.trim() === '') return null;

                    // Convertir Markdown básico a HTML
                    let html = paragraph
                      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-8 mb-4">$1</h3>')
                      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-10 mb-6">$1</h2>')
                      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-12 mb-8">$1</h1>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded">$1</code>')
                      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md my-4" />')
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
                      .replace(/^- (.*$)/gm, '<li class="ml-6 mb-1">• $1</li>')
                      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-6 mb-1">$1. $2</li>');

                    return <p key={index} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
                  })}
                </div>
              </div>
            </article>

            {/* Comentarios */}
            {currentPost.comments && currentPost.comments.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Comentarios ({currentPost.comments_count})</h3>
                <div className="space-y-6">
                  {currentPost.comments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{comment.author_name}</span>
                            <span className="text-sm text-gray-500">{comment.date}</span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario para agregar comentario */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Deja tu comentario</h3>
              <CommentForm postId={currentPost.id} onCommentAdded={() => loadPostById(currentPost.id)} />
            </div>
          </main>
        </div>
      );
    }

    // Vista de lista de artículos
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ModernBlog
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Descubre artículos interesantes sobre tecnología y desarrollo</p>
              </div>
              <button
                onClick={() => {
                  setIsPublicView(false);
                  setCurrentView('login');
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 dark:from-blue-600 dark:to-purple-700"
              >
                Panel Admin
              </button>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={publicFilters.search}
                  onChange={(e) => handlePublicFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={publicFilters.category}
                onChange={(e) => handlePublicFilterChange('category', e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las categorías</option>
                {publicCategories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {isLoadingPublic ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando artículos...</p>
            </div>
          ) : publicPosts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No hay artículos publicados</h3>
              <p className="text-gray-600">Los artículos publicados aparecerán aquí próximamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicPosts.map(post => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
                  onClick={() => viewPost(post.id)}
                >
                  {post.featured_image && (
                    <img
                      src={post.featured_image.startsWith('http') ? post.featured_image : `/uploads/${post.featured_image.split('/').pop()}`}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {post.read_time}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author}
                      </span>
                      <span>{post.date}</span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        {post.comments_count}
                      </span>
                      <span
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer"
                        onClick={() => viewPost(post.id)}
                      >
                        Leer más →
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  };

  // Render principal condicional
  if (!isAuthenticated && !isPublicView && currentView !== 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            ModernBlog
          </h1>
          <p className="text-gray-600 mb-8">Sistema de gestión de contenido moderno</p>

          <div className="space-y-4">
            <button
              onClick={() => setIsPublicView(true)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Ver Blog Público
            </button>

            <button
              onClick={() => setCurrentView('login')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Panel de Administración
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar vista de login cuando se solicita
  if (!isAuthenticated && currentView === 'login') {
    return <LoginView />;
  }

  if (isPublicView) {
    return <PublicBlogView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />

      <div className="flex-1 overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {currentView === 'dashboard' && 'Dashboard'}
                {currentView === 'posts' && 'Artículos'}
                {currentView === 'editor' && (editorPost.id ? 'Editar Artículo' : 'Nuevo Artículo')}
                {currentView === 'categories' && 'Categorías'}
                {currentView === 'comments' && 'Comentarios'}
                {currentView === 'users' && 'Usuarios'}
                {currentView === 'settings' && 'Configuración'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-64"
                />
              </div>
              {/* Botón del tema */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@blog.com'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'posts' && <PostsList />}
          {currentView === 'editor' && <ArticleEditor />}

          {/* Vista de Categorías */}
          {currentView === 'categories' && <CategoriesView />}

          {currentView === 'comments' && <CommentsView />}

          {currentView === 'users' && <UsersView />}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      <Notification />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AdminPanel />
    </ThemeProvider>
  );
};

export default App;
