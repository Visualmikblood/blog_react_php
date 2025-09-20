<?php
echo "<h1>Instalador de ModernBlog</h1>";

// Configuración de base de datos
$db_config = [
    'host' => 'localhost',
    'dbname' => 'modern_blog',
    'username' => 'root',
    'password' => ''
];

try {
    // Conectar a MySQL sin especificar base de datos
    $pdo = new PDO("mysql:host={$db_config['host']}", $db_config['username'], $db_config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p>✅ Conexión a MySQL exitosa</p>";

    // Crear base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS {$db_config['dbname']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p>✅ Base de datos '{$db_config['dbname']}' creada/verificada</p>";

    // Conectar a la base de datos específica
    $pdo->exec("USE {$db_config['dbname']}");

    // Leer y ejecutar el script SQL
    $sql_file = __DIR__ . '/database/modern_blog.sql';
    if (file_exists($sql_file)) {
        $sql = file_get_contents($sql_file);
        $pdo->exec($sql);
        echo "<p>✅ Tablas y datos creados exitosamente</p>";
    } else {
        echo "<p>❌ Archivo SQL no encontrado: $sql_file</p>";
    }

    echo "<h2>🎉 Instalación completada exitosamente!</h2>";
    echo "<p>Ahora puedes:</p>";
    echo "<ul>";
    echo "<li>Acceder al panel de administración con las credenciales mostradas arriba</li>";
    echo "<li>Configurar tu frontend React para conectarse a la API</li>";
    echo "<li>Comenzar a crear contenido</li>";
    echo "</ul>";

} catch (PDOException $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
