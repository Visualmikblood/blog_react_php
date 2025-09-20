<?php
// Script de instalación automática para el blog ModernBlog
header("Content-Type: text/html; charset=UTF-8");

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Instalación - ModernBlog</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .step { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .progress { width: 100%; background: #f0f0f0; border-radius: 5px; margin: 10px 0; }
        .progress-bar { height: 20px; background: #28a745; border-radius: 5px; transition: width 0.3s; }
    </style>
</head>
<body>
    <h1>🚀 Instalación de ModernBlog</h1>
    <div id='progress-container'>
        <div class='progress'>
            <div class='progress-bar' id='progress-bar' style='width: 0%'></div>
        </div>
    </div>
    <div id='output'></div>
    <button onclick='startInstallation()'>Iniciar Instalación</button>
</body>
</html>";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];

    switch ($action) {
        case 'create_database':
            createDatabase();
            break;
        case 'create_tables':
            createTables();
            break;
        case 'insert_data':
            insertSampleData();
            break;
        case 'test_connection':
            testDatabaseConnection();
            break;
    }
    exit;
}

function updateProgress($percentage, $message) {
    echo "<script>
        document.getElementById('progress-bar').style.width = '{$percentage}%';
        document.getElementById('output').innerHTML += '<div class=\"step info\">{$message}</div>';
    </script>";
    flush();
}

function logSuccess($message) {
    echo "<script>
        document.getElementById('output').innerHTML += '<div class=\"step success\">✅ {$message}</div>';
    </script>";
    flush();
}

function logError($message) {
    echo "<script>
        document.getElementById('output').innerHTML += '<div class=\"step error\">❌ {$message}</div>';
    </script>";
    flush();
}

function createDatabase() {
    try {
        updateProgress(10, "Conectando a MySQL...");

        // Conectar sin base de datos específica
        $pdo = new PDO("mysql:host=localhost", "root", "");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        updateProgress(20, "Creando base de datos...");

        // Crear base de datos
        $pdo->exec("CREATE DATABASE IF NOT EXISTS modern_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        updateProgress(30, "Base de datos creada exitosamente");

        logSuccess("Base de datos 'modern_blog' creada correctamente");
    } catch (PDOException $e) {
        logError("Error al crear la base de datos: " . $e->getMessage());
    }
}

function createTables() {
    try {
        updateProgress(40, "Conectando a la base de datos...");

        $pdo = new PDO("mysql:host=localhost;dbname=modern_blog", "root", "");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        updateProgress(50, "Creando tablas...");

        // Tabla de usuarios
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'author', 'user') DEFAULT 'user',
            avatar VARCHAR(255) DEFAULT NULL,
            bio TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");

        // Tabla de categorías
        $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT DEFAULT NULL,
            icon VARCHAR(50) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        // Tabla de posts
        $pdo->exec("CREATE TABLE IF NOT EXISTS posts (
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
        )");

        // Tabla de tags
        $pdo->exec("CREATE TABLE IF NOT EXISTS tags (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            slug VARCHAR(50) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        // Tabla de relación posts-tags
        $pdo->exec("CREATE TABLE IF NOT EXISTS post_tags (
            post_id INT NOT NULL,
            tag_id INT NOT NULL,
            PRIMARY KEY (post_id, tag_id),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )");

        // Tabla de comentarios
        $pdo->exec("CREATE TABLE IF NOT EXISTS comments (
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
        )");

        // Tabla de configuraciones
        $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT DEFAULT NULL,
            setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");

        updateProgress(60, "Tablas creadas exitosamente");

        logSuccess("Todas las tablas han sido creadas correctamente");
    } catch (PDOException $e) {
        logError("Error al crear las tablas: " . $e->getMessage());
    }
}

function insertSampleData() {
    try {
        updateProgress(70, "Insertando datos de ejemplo...");

        $pdo = new PDO("mysql:host=localhost;dbname=modern_blog", "root", "");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Insertar usuarios
        $pdo->exec("INSERT IGNORE INTO users (name, email, password, role, bio) VALUES
            ('Administrador', 'admin@blog.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrador del blog ModernBlog'),
            ('Autor Demo', 'autor@blog.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'author', 'Autor de contenido para el blog')");

        // Insertar categorías
        $pdo->exec("INSERT IGNORE INTO categories (name, slug, description, icon) VALUES
            ('Tecnología', 'tecnologia', 'Artículos sobre tecnología, programación y desarrollo', '💻'),
            ('Diseño', 'diseno', 'Contenido relacionado con diseño gráfico y UX/UI', '🎨'),
            ('Marketing', 'marketing', 'Estrategias de marketing digital y crecimiento', '📈'),
            ('Tutoriales', 'tutoriales', 'Guías paso a paso y tutoriales prácticos', '📚')");

        // Insertar tags
        $pdo->exec("INSERT IGNORE INTO tags (name, slug) VALUES
            ('React', 'react'),
            ('JavaScript', 'javascript'),
            ('PHP', 'php'),
            ('MySQL', 'mysql'),
            ('CSS', 'css'),
            ('HTML', 'html'),
            ('SEO', 'seo'),
            ('UX', 'ux'),
            ('UI', 'ui'),
            ('Desarrollo Web', 'desarrollo-web')");

        // Insertar configuraciones
        $pdo->exec("INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type) VALUES
            ('site_name', 'ModernBlog', 'string'),
            ('site_description', 'Un blog moderno construido con React y PHP', 'string'),
            ('site_url', 'http://localhost/blog_react_php', 'string'),
            ('posts_per_page', '10', 'integer'),
            ('comments_enabled', 'true', 'boolean'),
            ('registration_enabled', 'false', 'boolean'),
            ('maintenance_mode', 'false', 'boolean')");

        // Insertar posts de ejemplo
        $pdo->exec("INSERT IGNORE INTO posts (title, content, excerpt, category_id, author_id, status, read_time, likes, views) VALUES
            ('Bienvenido a ModernBlog', '# Bienvenido a ModernBlog\n\n¡Hola! Este es el primer artículo de nuestro blog moderno construido con React y PHP.\n\n## ¿Qué encontrarás aquí?\n\n- Tutoriales de desarrollo web\n- Artículos sobre tecnología\n- Consejos de diseño y UX\n- Estrategias de marketing digital\n\n## Tecnologías utilizadas\n\nEste blog está construido con:\n\n- **Frontend**: React + Vite + Tailwind CSS\n- **Backend**: PHP + MySQL\n- **API**: RESTful API con autenticación JWT\n\n¡Esperamos que disfrutes del contenido!', 'Primer artículo de bienvenida al blog ModernBlog', 1, 1, 'published', '2 min read', 15, 120),
            ('Guía completa de React Hooks', '# Guía completa de React Hooks\n\nLos React Hooks revolucionaron la forma en que escribimos componentes en React. En este artículo exploraremos todos los hooks disponibles.\n\n## useState\n\nEl hook más básico para manejar estado local:\n\n```jsx\nconst [count, setCount] = useState(0);\n```\n\n## useEffect\n\nPara efectos secundarios:\n\n```jsx\nuseEffect(() => {\n  document.title = `Contador: ${count}`;\n}, [count]);\n```\n\n## useContext\n\nPara acceder al contexto:\n\n```jsx\nconst theme = useContext(ThemeContext);\n```\n\n## Custom Hooks\n\nTambién podemos crear nuestros propios hooks para reutilizar lógica.', 'Guía completa sobre React Hooks y su uso práctico', 1, 2, 'published', '5 min read', 25, 200),
            ('Introducción al diseño responsivo', '# Diseño responsivo con CSS\n\nEl diseño responsivo es fundamental en el desarrollo web moderno. Aprende las mejores prácticas.\n\n## Media Queries\n\n```css\n@media (max-width: 768px) {\n  .container {\n    padding: 1rem;\n  }\n}\n```\n\n## Flexbox y Grid\n\nUtiliza Flexbox para layouts flexibles:\n\n```css\n.container {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n```\n\n## Imágenes responsivas\n\n```html\n<img src=\"image.jpg\" alt=\"Descripción\" style=\"max-width: 100%; height: auto;\">\n```', 'Fundamentos del diseño responsivo para sitios web modernos', 2, 2, 'published', '4 min read', 18, 150)");

        updateProgress(90, "Datos de ejemplo insertados");

        logSuccess("Datos de ejemplo insertados correctamente");
    } catch (PDOException $e) {
        logError("Error al insertar datos de ejemplo: " . $e->getMessage());
    }
}

function testDatabaseConnection() {
    try {
        updateProgress(95, "Probando conexión a la base de datos...");

        $pdo = new PDO("mysql:host=localhost;dbname=modern_blog", "root", "");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Probar algunas consultas
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        updateProgress(100, "Instalación completada exitosamente");

        logSuccess("✅ Instalación completada exitosamente!");
        logSuccess("📊 Usuarios encontrados: " . $result['total']);
        logSuccess("🎉 Tu blog está listo para usar!");
        logSuccess("🌐 Accede al panel admin en: http://localhost:5173");

    } catch (PDOException $e) {
        logError("Error en la conexión de prueba: " . $e->getMessage());
    }
}
?>

<script>
function startInstallation() {
    const steps = [
        { action: 'create_database', message: 'Creando base de datos...' },
        { action: 'create_tables', message: 'Creando tablas...' },
        { action: 'insert_data', message: 'Insertando datos de ejemplo...' },
        { action: 'test_connection', message: 'Probando conexión...' }
    ];

    let currentStep = 0;

    function executeStep() {
        if (currentStep >= steps.length) {
            document.querySelector('button').style.display = 'none';
            return;
        }

        const step = steps[currentStep];
        document.getElementById('output').innerHTML += '<div class="step info">🔄 ' + step.message + '</div>';

        fetch('install.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=' + step.action
        })
        .then(response => response.text())
        .then(data => {
            // Los mensajes se muestran desde PHP
            currentStep++;
            setTimeout(executeStep, 500);
        })
        .catch(error => {
            document.getElementById('output').innerHTML += '<div class="step error">❌ Error: ' + error.message + '</div>';
        });
    }

    executeStep();
}
</script>