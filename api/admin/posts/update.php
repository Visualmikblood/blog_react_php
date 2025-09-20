<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST, OPTIONS");
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

// Verificar autenticación
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
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(array("message" => "Token inválido."));
    exit();
}

if ($method !== 'PUT' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Método no permitido."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));


if (!isset($data->id) || !isset($data->title) || !isset($data->content)) {
    http_response_code(400);
    echo json_encode(array("message" => "ID, título y contenido son requeridos."));
    exit();
}

try {
    // Verificar que el post existe y el usuario tiene permisos
    $query = "SELECT author_id FROM posts WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Post no encontrado."));
        exit();
    }

    $post_data = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verificar permisos (solo el autor o admin puede editar)
    if ($post_data['author_id'] != $tokenData['user_id'] && $tokenData['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "No tienes permisos para editar este post."));
        exit();
    }

    // Actualizar post
    $query = "UPDATE posts SET
                title = :title,
                content = :content,
                excerpt = :excerpt,
                category_id = :category_id,
                featured_image = :featured_image,
                status = :status,
                read_time = :read_time,
                updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);

    $excerpt = isset($data->excerpt) ? $data->excerpt : Helpers::generateExcerpt($data->content);
    $read_time = Helpers::calculateReadTime($data->content);
    $category_id = isset($data->category_id) && $data->category_id !== '' ? $data->category_id : null;
    $featured_image = isset($data->featured_image) ? $data->featured_image : null;
    $status = isset($data->status) ? $data->status : 'draft';

    $stmt->bindParam(':title', $data->title);
    $stmt->bindParam(':content', $data->content);
    $stmt->bindParam(':excerpt', $excerpt);
    $stmt->bindParam(':category_id', $category_id);
    $stmt->bindParam(':featured_image', $featured_image);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':read_time', $read_time);
    $stmt->bindParam(':id', $data->id);

    if ($stmt->execute()) {
        // Actualizar tags
        if (isset($data->tags) && is_array($data->tags)) {
            updatePostTags($db, $data->id, $data->tags);
        }

        http_response_code(200);
        echo json_encode(array("message" => "Post actualizado exitosamente."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo actualizar el post."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}

function updatePostTags($db, $post_id, $tags) {
    // Eliminar tags existentes
    $query = "DELETE FROM post_tags WHERE post_id = :post_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':post_id', $post_id);
    $stmt->execute();

    // Insertar nuevos tags
    foreach ($tags as $tag_name) {
        $tag_name = trim($tag_name);
        if (empty($tag_name)) continue;

        $tag_slug = Helpers::generateSlug($tag_name);

        // Buscar o crear tag
        $query = "SELECT id FROM tags WHERE slug = :slug";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':slug', $tag_slug);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $tag_id = $stmt->fetch(PDO::FETCH_ASSOC)['id'];
        } else {
            // Crear nuevo tag
            $query = "INSERT INTO tags (name, slug) VALUES (:name, :slug)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':name', $tag_name);
            $stmt->bindParam(':slug', $tag_slug);
            $stmt->execute();
            $tag_id = $db->lastInsertId();
        }

        // Relacionar post con tag
        $query = "INSERT INTO post_tags (post_id, tag_id) VALUES (:post_id, :tag_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':post_id', $post_id);
        $stmt->bindParam(':tag_id', $tag_id);
        $stmt->execute();
    }
}
?>
