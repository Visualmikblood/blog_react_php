<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../../config/database.php';
include_once __DIR__ . '/../../utils/helpers.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar autenticación y permisos de admin
$headers = apache_request_headers();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Token de autorización requerido."));
    exit();
}

$token = str_replace('Bearer ', '', $headers['Authorization']);
try {
    $tokenData = json_decode(base64_decode($token), true);
    if ($tokenData['exp'] < time()) {
        http_response_code(401);
        echo json_encode(array("message" => "Token expirado."));
        exit();
    }

    if ($tokenData['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "Permisos de administrador requeridos."));
        exit();
    }
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(array("message" => "Token inválido."));
    exit();
}

try {
    switch ($method) {
        case 'GET':
            handleGetCategories($db);
            break;
        case 'POST':
            // Determinar la acción basada en el campo 'action' del FormData
            $action = isset($_POST['action']) ? $_POST['action'] : null;
            switch ($action) {
                case 'create':
                    handleCreateCategory($db);
                    break;
                case 'update':
                    handleUpdateCategory($db);
                    break;
                case 'delete':
                    handleDeleteCategory($db);
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(array("message" => "Acción no válida."));
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(array("message" => "Método no permitido."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}

function handleGetCategories($db) {
    $query = "SELECT c.id, c.name, c.slug, c.description, c.icon, c.created_at,
                     COUNT(p.id) as post_count
              FROM categories c
              LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
              GROUP BY c.id
              ORDER BY c.name";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $categories = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categories[] = [
            "id" => (int)$row['id'],
            "name" => $row['name'],
            "slug" => $row['slug'],
            "description" => $row['description'],
            "icon" => $row['icon'],
            "post_count" => (int)$row['post_count'],
            "created_at" => $row['created_at']
        ];
    }

    http_response_code(200);
    echo json_encode(["categories" => $categories]);
}

function handleCreateCategory($db) {
    $name = isset($_POST['name']) ? Helpers::sanitizeInput($_POST['name']) : null;

    if (!$name) {
        http_response_code(400);
        echo json_encode(array("message" => "Nombre de categoría requerido."));
        return;
    }

    $slug = Helpers::generateSlug($name);
    $description = isset($_POST['description']) ? Helpers::sanitizeInput($_POST['description']) : null;
    $icon = isset($_POST['icon']) ? Helpers::sanitizeInput($_POST['icon']) : null;

    // Verificar que el slug no existe
    $check_query = "SELECT id FROM categories WHERE slug = :slug";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':slug', $slug);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Ya existe una categoría con ese nombre."));
        return;
    }

    $query = "INSERT INTO categories (name, slug, description, icon) VALUES (:name, :slug, :description, :icon)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':slug', $slug);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':icon', $icon);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array(
            "message" => "Categoría creada exitosamente.",
            "category_id" => $db->lastInsertId()
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo crear la categoría."));
    }
}

function handleUpdateCategory($db) {
    $id = isset($_POST['id']) ? $_POST['id'] : null;
    $name = isset($_POST['name']) ? Helpers::sanitizeInput($_POST['name']) : null;

    if (!$id || !$name) {
        http_response_code(400);
        echo json_encode(array("message" => "ID y nombre de categoría requeridos."));
        return;
    }

    $slug = Helpers::generateSlug($name);
    $description = isset($_POST['description']) ? Helpers::sanitizeInput($_POST['description']) : null;
    $icon = isset($_POST['icon']) ? Helpers::sanitizeInput($_POST['icon']) : null;

    // Verificar que la categoría existe
    $check_query = "SELECT id FROM categories WHERE id = :id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':id', $id);
    $check_stmt->execute();

    if ($check_stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Categoría no encontrada."));
        return;
    }

    // Verificar que el nuevo slug no existe (excepto para la misma categoría)
    $slug_check_query = "SELECT id FROM categories WHERE slug = :slug AND id != :id";
    $slug_check_stmt = $db->prepare($slug_check_query);
    $slug_check_stmt->bindParam(':slug', $slug);
    $slug_check_stmt->bindParam(':id', $id);
    $slug_check_stmt->execute();

    if ($slug_check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Ya existe una categoría con ese nombre."));
        return;
    }

    $query = "UPDATE categories SET name = :name, slug = :slug, description = :description, icon = :icon WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':slug', $slug);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':icon', $icon);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Categoría actualizada exitosamente."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo actualizar la categoría."));
    }
}

function handleDeleteCategory($db) {
    $category_id = isset($_POST['id']) ? $_POST['id'] : null;

    if (!$category_id) {
        http_response_code(400);
        echo json_encode(array("message" => "ID de categoría requerido."));
        return;
    }

    // Verificar que la categoría existe
    $check_query = "SELECT id FROM categories WHERE id = :id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':id', $category_id);
    $check_stmt->execute();

    if ($check_stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Categoría no encontrada."));
        return;
    }

    // Verificar si hay posts usando esta categoría
    $posts_check_query = "SELECT COUNT(*) as count FROM posts WHERE category_id = :category_id";
    $posts_check_stmt = $db->prepare($posts_check_query);
    $posts_check_stmt->bindParam(':category_id', $category_id);
    $posts_check_stmt->execute();

    $post_count = $posts_check_stmt->fetch(PDO::FETCH_ASSOC)['count'];

    if ($post_count > 0) {
        // Mover posts a sin categoría antes de eliminar
        $update_posts_query = "UPDATE posts SET category_id = NULL WHERE category_id = :category_id";
        $update_posts_stmt = $db->prepare($update_posts_query);
        $update_posts_stmt->bindParam(':category_id', $category_id);
        $update_posts_stmt->execute();
    }

    $query = "DELETE FROM categories WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $category_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Categoría eliminada exitosamente.",
            "posts_moved" => (int)$post_count
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo eliminar la categoría."));
    }
}
?>
