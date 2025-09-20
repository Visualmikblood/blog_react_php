<?php
include_once 'api/config/database.php';

$database = new Database();
$db = $database->connect();

try {
    // Crear usuario admin si no existe
    $userQuery = "INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    $userStmt = $db->prepare($userQuery);
    $userStmt->execute(['Administrador', 'admin@blog.com', password_hash('password', PASSWORD_DEFAULT), 'admin']);

    // Obtener ID del usuario admin
    $userIdQuery = "SELECT id FROM users WHERE email = ?";
    $userIdStmt = $db->prepare($userIdQuery);
    $userIdStmt->execute(['admin@blog.com']);
    $userId = $userIdStmt->fetch(PDO::FETCH_ASSOC)['id'];

    // Crear categorías si no existen
    $categories = [
        ['Tecnología', 'tecnologia'],
        ['Desarrollo Web', 'desarrollo-web'],
        ['Tutoriales', 'tutoriales'],
        ['Diseño', 'diseno']
    ];

    foreach ($categories as $category) {
        $catQuery = "INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)";
        $catStmt = $db->prepare($catQuery);
        $catStmt->execute($category);
    }

    // Crear artículos de ejemplo publicados
    $posts = [
        [
            'title' => 'Bienvenido a ModernBlog',
            'content' => '# Bienvenido a ModernBlog

¡Hola! Este es el primer artículo de bienvenida a nuestro blog ModernBlog.

## ¿Qué encontrarás aquí?

En este blog encontrarás contenido sobre:

- **Tecnología** - Las últimas tendencias y novedades
- **Desarrollo Web** - Tutoriales y guías prácticas
- **Diseño** - Inspiración y mejores prácticas
- **Tutoriales** - Guías paso a paso para aprender nuevas habilidades

## Nuestra misión

Nuestra misión es compartir conocimiento de calidad de manera accesible y gratuita. Creemos que el aprendizaje continuo es fundamental en el mundo actual.

### ¡Comienza tu viaje!

Explora nuestros artículos y descubre todo lo que tenemos para ofrecerte.',
            'excerpt' => 'Primer artículo de bienvenida al blog ModernBlog. Descubre qué encontrarás en nuestra plataforma.',
            'category_slug' => 'tecnologia',
            'status' => 'published'
        ],
        [
            'title' => 'Guía completa de React Hooks',
            'content' => '# Guía completa de React Hooks

Los React Hooks revolucionaron la forma en que escribimos componentes en React. En esta guía completa aprenderás todo lo necesario.

## ¿Qué son los Hooks?

Los Hooks son funciones que te permiten "engancharte" a las características de React desde componentes funcionales.

### useState

El Hook más básico para manejar estado local:

```javascript
const [count, setCount] = useState(0);
```

### useEffect

Para efectos secundarios en componentes funcionales:

```javascript
useEffect(() => {
  document.title = `Contador: ${count}`;
}, [count]);
```

## Hooks avanzados

### useContext
Para consumir contexto sin necesidad de componentes intermedios.

### useReducer
Para manejar estado complejo con lógica más elaborada.

## Conclusión

Los React Hooks han simplificado enormemente el desarrollo con React, permitiendo escribir componentes más limpios y reutilizables.',
            'excerpt' => 'Guía completa sobre React Hooks y su uso práctico en el desarrollo moderno.',
            'category_slug' => 'desarrollo-web',
            'status' => 'published'
        ],
        [
            'title' => 'Introducción a CSS Grid',
            'content' => '# Introducción a CSS Grid

CSS Grid es un sistema de diseño bidimensional que revolucionó la forma en que creamos layouts web.

## ¿Por qué CSS Grid?

Antes de CSS Grid, crear layouts complejos requería:

- Floats complicados
- Flexbox para diseños unidimensionales
- Frameworks CSS pesados
- JavaScript para layouts complejos

## Conceptos básicos

### Grid Container
El elemento padre que contiene el grid:

```css
.container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 100px 200px;
  gap: 20px;
}
```

### Grid Items
Los elementos hijos del grid container.

## Propiedades principales

### grid-template-columns
Define las columnas del grid.

### grid-template-rows
Define las filas del grid.

### gap
Espacio entre grid items.

## Conclusión

CSS Grid es una herramienta poderosa que simplifica enormemente la creación de layouts complejos en la web.',
            'excerpt' => 'Descubre cómo CSS Grid revoluciona la creación de layouts web modernos.',
            'category_slug' => 'desarrollo-web',
            'status' => 'published'
        ],
        [
            'title' => 'Tendencias de diseño UX 2024',
            'content' => '# Tendencias de diseño UX 2024

El diseño de experiencia de usuario evoluciona constantemente. Aquí las tendencias más importantes para 2024.

## 1. Diseño inclusivo

Crear productos accesibles para todos los usuarios, independientemente de sus capacidades.

### Principios clave:
- Contraste adecuado
- Navegación por teclado
- Texto alternativo en imágenes
- Tamaños de fuente legibles

## 2. Microinteracciones

Pequeñas animaciones que mejoran la experiencia del usuario.

### Ejemplos:
- Botones que cambian de color al hacer hover
- Animaciones de carga
- Feedback visual en formularios

## 3. Diseño móvil primero

Enfocarse en la experiencia móvil antes que en desktop.

## 4. Dark mode

Modo oscuro cada vez más popular entre los usuarios.

## 5. Voice interfaces

Interfaces de voz para una interacción más natural.

## Conclusión

El diseño UX continúa evolucionando para crear experiencias más intuitivas y accesibles.',
            'excerpt' => 'Las tendencias más importantes en diseño de experiencia de usuario para este año.',
            'category_slug' => 'diseno',
            'status' => 'published'
        ],
        [
            'title' => 'JavaScript moderno: ES6+',
            'content' => '# JavaScript moderno: ES6+

JavaScript ha evolucionado significativamente con ES6 y versiones posteriores. Veamos las características más importantes.

## Variables con let y const

```javascript
// Antes (ES5)
var name = "Juan";

// Ahora (ES6+)
const name = "Juan"; // Para valores constantes
let age = 25;       // Para valores que cambian
```

## Arrow functions

```javascript
// Función tradicional
function greet(name) {
  return "Hola " + name;
}

// Arrow function
const greet = (name) => `Hola ${name}`;
```

## Template literals

```javascript
// Concatenación tradicional
var message = "Hola " + name + ", tienes " + age + " años.";

// Template literal
const message = `Hola ${name}, tienes ${age} años.`;
```

## Destructuring

```javascript
// Arrays
const [first, second] = [1, 2];

// Objetos
const {name, age} = person;
```

## Async/await

```javascript
async function fetchUser() {
  try {
    const response = await fetch(\'/api/user\');
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(\'Error:\', error);
  }
}
```

## Conclusión

ES6+ ha hecho JavaScript más expresivo y poderoso, facilitando el desarrollo de aplicaciones modernas.',
            'excerpt' => 'Descubre las características más importantes de JavaScript moderno con ES6+.',
            'category_slug' => 'desarrollo-web',
            'status' => 'published'
        ]
    ];

    foreach ($posts as $post) {
        // Obtener ID de categoría
        $catIdQuery = "SELECT id FROM categories WHERE slug = ?";
        $catIdStmt = $db->prepare($catIdQuery);
        $catIdStmt->execute([$post['category_slug']]);
        $categoryId = $catIdStmt->fetch(PDO::FETCH_ASSOC)['id'];

        // Insertar artículo
        $postQuery = "INSERT INTO posts (title, content, excerpt, category_id, author_id, status, read_time) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $postStmt = $db->prepare($postQuery);
        $postStmt->execute([
            $post['title'],
            $post['content'],
            $post['excerpt'],
            $categoryId,
            $userId,
            $post['status'],
            '5 min read'
        ]);
    }

    echo "✅ Artículos de ejemplo creados exitosamente!\n";
    echo "📝 Se crearon " . count($posts) . " artículos publicados.\n";
    echo "🌐 Ahora puedes ver el blog público en: http://localhost:5173\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>