<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../../config/database.php';
include_once __DIR__ . '/../../models/Post.php';
include_once '../../utils/helpers.php';

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

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Método no permitido."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->title) || !isset($data->content)) {
    http_response_code(400);
    echo json_encode(array("message" => "Título y contenido son requeridos."));
    exit();
}

try {
    $post = new Post($db);

    $post->title = $data->title;
    $post->content = $data->content;
    $post->excerpt = isset($data->excerpt) ? $data->excerpt : Helpers::generateExcerpt($data->content);
    $post->category_id = isset($data->category_id) ? $data->category_id : null;
    $post->author_id = $tokenData['user_id'];
    $post->featured_image = isset($data->featured_image) ? $data->featured_image : null;
    $post->status = isset($data->status) ? $data->status : 'draft';
    $post->read_time = Helpers::calculateReadTime($data->content);

    if ($post->create()) {
        $post_id = $db->lastInsertId();

        // Insertar tags si existen
        if (isset($data->tags) && is_array($data->tags)) {
            insertPostTags($db, $post_id, $data->tags);
        }

        http_response_code(201);
        echo json_encode(array(
            "message" => "Post creado exitosamente.",
            "post_id" => $post_id
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo crear el post."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}

function insertPostTags($db, $post_id, $tags) {
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
        $query = "INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (:post_id, :tag_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':post_id', $post_id);
        $stmt->bindParam(':tag_id', $tag_id);
        $stmt->execute();
    }
}
?>
