-- Script SQL para crear la base de datos del blog ModernBlog
-- Ejecutar este script en MySQL para configurar todas las tablas necesarias

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS modern_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE modern_blog;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'author', 'user') DEFAULT 'user',
    avatar VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de posts/artículos
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT DEFAULT NULL,
    category_id INT DEFAULT NULL,
    author_id INT NOT NULL,
    featured_image VARCHAR(255) DEFAULT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    read_time VARCHAR(20) DEFAULT NULL,
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de tags/etiquetas
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación posts-tags (muchos a muchos)
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    author_name VARCHAR(100) DEFAULT NULL,
    author_email VARCHAR(150) DEFAULT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Tabla de configuraciones del sitio
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT DEFAULT NULL,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo

-- Usuario administrador
INSERT INTO users (name, email, password, role, bio) VALUES
('Administrador', 'admin@blog.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrador del blog ModernBlog');

-- Usuario autor
INSERT INTO users (name, email, password, role, bio) VALUES
('Autor Demo', 'autor@blog.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'author', 'Autor de contenido para el blog');

-- Categorías de ejemplo
INSERT INTO categories (name, slug, description, icon) VALUES
('Tecnología', 'tecnologia', 'Artículos sobre tecnología, programación y desarrollo', 'cpu'),
('Diseño', 'diseno', 'Contenido relacionado con diseño gráfico y UX/UI', 'palette'),
('Marketing', 'marketing', 'Estrategias de marketing digital y crecimiento', 'trending-up'),
('Tutoriales', 'tutoriales', 'Guías paso a paso y tutoriales prácticos', 'book-open');

-- Tags de ejemplo
INSERT INTO tags (name, slug) VALUES
('React', 'react'),
('JavaScript', 'javascript'),
('PHP', 'php'),
('MySQL', 'mysql'),
('CSS', 'css'),
('HTML', 'html'),
('SEO', 'seo'),
('UX', 'ux'),
('UI', 'ui'),
('Desarrollo Web', 'desarrollo-web');

-- Configuraciones del sitio
INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES
('site_name', 'ModernBlog', 'string'),
('site_description', 'Un blog moderno construido con React y PHP', 'string'),
('site_url', 'http://localhost/blog_react_php', 'string'),
('posts_per_page', '10', 'integer'),
('comments_enabled', 'true', 'boolean'),
('registration_enabled', 'false', 'boolean'),
('maintenance_mode', 'false', 'boolean');

-- Posts de ejemplo
INSERT INTO posts (title, content, excerpt, category_id, author_id, status, read_time, likes, views) VALUES
('Bienvenido a ModernBlog', '# Bienvenido a ModernBlog

¡Hola! Este es el primer artículo de nuestro blog moderno construido con React y PHP.

## ¿Qué encontrarás aquí?

- Tutoriales de desarrollo web
- Artículos sobre tecnología
- Consejos de diseño y UX
- Estrategias de marketing digital

## Tecnologías utilizadas

Este blog está construido con:

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: PHP + MySQL
- **API**: RESTful API con autenticación JWT

¡Esperamos que disfrutes del contenido!', 'Primer artículo de bienvenida al blog ModernBlog', 1, 1, 'published', '2 min read', 15, 120),

('Guía completa de React Hooks', '# Guía completa de React Hooks

Los React Hooks revolucionaron la forma en que escribimos componentes en React. En este artículo exploraremos todos los hooks disponibles.

## useState

El hook más básico para manejar estado local:

```jsx
const [count, setCount] = useState(0);
```

## useEffect

Para efectos secundarios:

```jsx
useEffect(() => {
  document.title = `Contador: ${count}`;
}, [count]);
```

## useContext

Para acceder al contexto:

```jsx
const theme = useContext(ThemeContext);
```

## Custom Hooks

También podemos crear nuestros propios hooks para reutilizar lógica.', 'Guía completa sobre React Hooks y su uso práctico', 1, 2, 'published', '5 min read', 25, 200),

('Introducción al diseño responsivo', '# Diseño responsivo con CSS

El diseño responsivo es fundamental en el desarrollo web moderno. Aprende las mejores prácticas.

## Media Queries

```css
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
```

## Flexbox y Grid

Utiliza Flexbox para layouts flexibles:

```css
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
```

## Imágenes responsivas

```html
<img src="image.jpg" alt="Descripción" style="max-width: 100%; height: auto;">
```', 'Fundamentos del diseño responsivo para sitios web modernos', 2, 2, 'published', '4 min read', 18, 150);

-- Asignar tags a los posts
INSERT INTO post_tags (post_id, tag_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), -- Post 1: React, JavaScript, PHP, MySQL
(2, 1), (2, 2), (2, 10), -- Post 2: React, JavaScript, Desarrollo Web
(3, 5), (3, 8), (3, 9), (3, 10); -- Post 3: CSS, UX, UI, Desarrollo Web

-- Comentarios de ejemplo
INSERT INTO comments (post_id, author_name, author_email, content, status) VALUES
(1, 'Juan Pérez', 'juan@email.com', '¡Excelente artículo! Me encantó la introducción.', 'approved'),
(1, 'María García', 'maria@email.com', '¿Cuándo publicarán más tutoriales?', 'approved'),
(2, 'Carlos López', 'carlos@email.com', 'Los hooks son geniales, pero al principio cuesta entenderlos.', 'approved'),
(3, 'Ana Rodríguez', 'ana@email.com', 'Buen artículo sobre responsive design.', 'approved');

-- Índices para mejorar rendimiento
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_post_tags_post ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- Vistas útiles
CREATE VIEW posts_with_details AS
SELECT
    p.*,
    c.name as category_name,
    c.slug as category_slug,
    u.name as author_name,
    u.email as author_email,
    COUNT(co.id) as comments_count
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN comments co ON p.id = co.post_id AND co.status = 'approved'
GROUP BY p.id;

CREATE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM posts WHERE status = 'published') as total_posts,
    (SELECT COUNT(*) FROM posts WHERE status = 'draft') as draft_posts,
    (SELECT SUM(views) FROM posts WHERE status = 'published') as total_views,
    (SELECT SUM(likes) FROM posts WHERE status = 'published') as total_likes,
    (SELECT COUNT(*) FROM comments WHERE status = 'approved') as total_comments,
    (SELECT COUNT(*) FROM comments WHERE status = 'pending') as pending_comments,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM users WHERE role IN ('admin', 'author')) as total_authors;
