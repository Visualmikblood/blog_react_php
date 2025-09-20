# ModernBlog - Blog React + PHP

Un blog moderno construido con React en el frontend y PHP/MySQL en el backend, con un panel de administración completo.

## 🚀 Características

### ✅ Funcionalidades Implementadas
- ✅ **Autenticación JWT** - Login seguro con tokens
- ✅ **Panel de Administración** - Interfaz moderna y responsiva
- ✅ **Blog Público** - Vista pública para lectores con artículos publicados
- ✅ **Gestión de Artículos** - Crear, editar, eliminar y publicar
- ✅ **Gestión de Categorías** - CRUD completo de categorías
- ✅ **Subida de Imágenes** - Upload de archivos con validación
- ✅ **Editor de Markdown** - Editor visual con vista previa
- ✅ **Búsqueda y Filtros** - Buscar artículos por título, categoría y estado
- ✅ **Dashboard** - Estadísticas y métricas del blog
- ✅ **Sistema de Comentarios** - Comentarios en artículos publicados
- ✅ **API RESTful** - Endpoints completos para todas las operaciones
- ✅ **Base de Datos MySQL** - Estructura completa y optimizada

### 🎨 Interfaz de Usuario
- **Diseño Moderno** - UI/UX con Tailwind CSS
- **Completamente Responsivo** - Funciona en desktop y móvil
- **Modo Oscuro/Claro** - Temas personalizables
- **Animaciones Suaves** - Transiciones y efectos visuales
- **Notificaciones** - Feedback en tiempo real

## 📋 Requisitos del Sistema

- **PHP 7.4+** con extensiones PDO y MySQL
- **MySQL 5.7+** o **MariaDB 10.0+**
- **Node.js 16+** y npm
- **Servidor web** (Apache/Nginx) o PHP built-in server

## 🛠️ Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/modern-blog.git
cd modern-blog
```

### 2. Instalar dependencias del frontend
```bash
npm install
```

### 3. Configurar la base de datos
Abre tu navegador y ve a: `http://localhost/modern-blog/install.php`

O ejecuta manualmente el script SQL:
```bash
mysql -u root -p < api/database/modern_blog.sql
```

### 4. Iniciar los servidores

**Terminal 1 - Backend PHP:**
```bash
php -S localhost:8000 -t api
```

**Terminal 2 - Frontend React:**
```bash
npm run dev
```

### 5. Acceder al blog
- **Blog Público:** `http://localhost:5173` (Vista pública con artículos publicados)
- **Panel Admin:** `http://localhost:5173` (Selecciona "Panel de Administración")
- **API Backend:** `http://localhost:8000`

## 👤 Credenciales de Acceso

### Usuario Administrador
- **Email:** `admin@blog.com`
- **Contraseña:** `password`
- **Rol:** Administrador

### Usuario Autor
- **Email:** `autor@blog.com`
- **Contraseña:** `password`
- **Rol:** Autor

## 🌐 Blog Público

### Acceso al Blog
- **URL:** `http://localhost:5173`
- **Descripción:** Vista pública del blog para lectores
- **Artículos de ejemplo:** 5 artículos publicados incluidos

### Funcionalidades del Blog Público
- ✅ **Ver artículos publicados** - Lista completa de artículos activos
- ✅ **Leer artículos completos** - Vista detallada con contenido formateado
- ✅ **Navegación por categorías** - Filtrar artículos por tema
- ✅ **Búsqueda de artículos** - Buscar por título y contenido
- ✅ **Sistema de comentarios** - Ver comentarios en artículos
- ✅ **Interfaz responsiva** - Funciona en desktop y móvil
- ✅ **Diseño moderno** - UI/UX atractiva con Tailwind CSS

### Cómo Crear Más Artículos
1. Ve al **Panel de Administración**
2. Inicia sesión con las credenciales de admin
3. Ve a **"Artículos"** → **"Nuevo Artículo"**
4. Escribe tu contenido usando el editor Markdown
5. Selecciona una categoría
6. Cambia el estado a **"Publicado"**
7. Guarda el artículo

Los artículos publicados aparecerán automáticamente en el blog público.

## 📁 Estructura del Proyecto

```
modern-blog/
├── api/                    # Backend PHP
│   ├── admin/             # Endpoints de administración
│   │   ├── auth/          # Autenticación
│   │   ├── posts/         # Gestión de artículos
│   │   ├── categories/    # Gestión de categorías
│   │   ├── dashboard/     # Estadísticas
│   │   └── upload.php     # Subida de archivos
│   ├── config/            # Configuración de BD
│   ├── database/          # Scripts SQL
│   ├── models/            # Modelos de datos
│   └── utils/             # Utilidades
├── src/                   # Frontend React
│   ├── api.js             # Cliente API
│   ├── App.jsx            # Componente principal
│   ├── config.js          # Configuración
│   └── index.css          # Estilos globales
├── uploads/               # Archivos subidos
├── install.php            # Script de instalación
├── package.json           # Dependencias Node.js
├── vite.config.js         # Configuración Vite
└── README.md              # Esta documentación
```

## 🔧 Configuración Avanzada

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DB_HOST=localhost
DB_NAME=modern_blog
DB_USER=root
DB_PASS=

# API
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRY=86400

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp
```

### Configuración de Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    root /var/www/modern-blog;
    index index.html;

    # Frontend React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API PHP
    location /api {
        alias /var/www/modern-blog/api;
        try_files $uri $uri/ @php;
    }

    location @php {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
    }

    # Archivos estáticos
    location /uploads {
        alias /var/www/modern-blog/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📚 Uso de la API

### Autenticación
```javascript
// Login
const response = await fetch('/api/admin/auth/auth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'login',
        email: 'admin@blog.com',
        password: 'password'
    })
});

// Usar token en otras peticiones
const response = await fetch('/api/admin/posts/list.php', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

### Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/auth/auth.php` | POST | Login y verificación de token |
| `/api/admin/posts/list.php` | GET | Listar artículos con filtros |
| `/api/admin/posts/create.php` | POST | Crear nuevo artículo |
| `/api/admin/posts/update.php` | PUT | Actualizar artículo |
| `/api/admin/posts/delete.php` | DELETE | Eliminar artículo |
| `/api/admin/categories/manage.php` | GET/POST/PUT/DELETE | CRUD categorías |
| `/api/admin/dashboard/stats.php` | GET | Estadísticas del dashboard |
| `/api/admin/upload.php` | POST | Subir imágenes |

## 🎨 Personalización

### Colores y Tema
Edita `src/index.css` para cambiar colores:

```css
:root {
    --primary-color: #4f46e5;
    --secondary-color: #7c3aed;
    --success-color: #10b981;
    --error-color: #ef4444;
}
```

### Logo y Branding
Reemplaza los archivos en `src/assets/` con tus propios logos e imágenes.

## 🔒 Seguridad

### Medidas Implementadas
- ✅ **Hash de contraseñas** con bcrypt
- ✅ **Tokens JWT** con expiración
- ✅ **Validación de entrada** en todos los endpoints
- ✅ **Protección CSRF** en formularios
- ✅ **Límite de tamaño** en uploads
- ✅ **Validación de tipos** de archivo

### Mejores Prácticas Recomendadas
- Cambia las credenciales por defecto
- Usa HTTPS en producción
- Configura un firewall
- Realiza backups regulares
- Monitorea los logs de acceso

## 🐛 Solución de Problemas

### Error de conexión a BD
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en api/config/database.php
```

### Error 404 en API
```bash
# Verificar que el servidor PHP esté corriendo
ps aux | grep php

# Verificar rutas en los archivos PHP
```

### Error de permisos en uploads
```bash
# Dar permisos de escritura
chmod 755 uploads/
chown www-data:www-data uploads/
```

## 📈 Rendimiento

### Optimizaciones Implementadas
- ✅ **Compresión GZIP** en respuestas
- ✅ **Cache de navegador** para assets estáticos
- ✅ **Lazy loading** de imágenes
- ✅ **Minificación** de CSS/JS
- ✅ **Índices de BD** optimizados

### Monitoreo
- Logs de acceso en `api/logs/`
- Métricas de rendimiento en el dashboard
- Alertas de errores por email

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email:** soporte@modernblog.com
- **Issues:** [GitHub Issues](https://github.com/tu-usuario/modern-blog/issues)
- **Documentación:** [Wiki del proyecto](https://github.com/tu-usuario/modern-blog/wiki)

---

**¡Gracias por usar ModernBlog!** 🎉

Construido con ❤️ usando React, PHP y MySQL.