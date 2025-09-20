<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../../config/database.php';

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

if ($method !== 'DELETE') {
    http_response_code(405);
    echo json_encode(array("message" => "Método no permitido."));
    exit();
}

$post_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$post_id) {
    http_response_code(400);
    echo json_encode(array("message" => "ID del post requerido."));
    exit();
}

try {
    // Verificar que el post existe y el usuario tiene permisos
    $query = "SELECT author_id FROM posts WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $post_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Post no encontrado."));
        exit();
    }

    $post_data = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verificar permisos (solo el autor o admin puede eliminar)
    if ($post_data['author_id'] != $tokenData['user_id'] && $tokenData['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "No tienes permisos para eliminar este post."));
        exit();
    }

    // Iniciar transacción
    $db->beginTransaction();

    // Eliminar relaciones con tags
    $query = "DELETE FROM post_tags WHERE post_id = :post_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':post_id', $post_id);
    $stmt->execute();

    // Eliminar comentarios
    $query = "DELETE FROM comments WHERE post_id = :post_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':post_id', $post_id);
    $stmt->execute();

    // Eliminar post
    $query = "DELETE FROM posts WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $post_id);

    if ($stmt->execute()) {
        $db->commit();
        http_response_code(200);
        echo json_encode(array("message" => "Post eliminado exitosamente."));
    } else {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo eliminar el post."));
    }
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}
?>
