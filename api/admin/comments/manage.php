<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

try {
    switch ($method) {
        case 'GET':
            handleGetComments($db);
            break;
        case 'PUT':
            handleUpdateComment($db);
            break;
        case 'DELETE':
            handleDeleteComment($db);
            break;
        default:
            http_response_code(405);
            echo json_encode(array("message" => "Método no permitido."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}

function handleGetComments($db) {
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    $where_clause = "1=1";
    if ($status !== 'all') {
        $where_clause = "c.status = :status";
    }

    $query = "SELECT c.*, p.title as post_title, p.id as post_id,
                     u.name as author_name, u.email as author_email
              FROM comments c
              LEFT JOIN posts p ON c.post_id = p.id
              LEFT JOIN users u ON c.user_id = u.id
              WHERE $where_clause
              ORDER BY c.created_at DESC
              LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);

    if ($status !== 'all') {
        $stmt->bindParam(':status', $status);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();

    $comments = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $comments[] = [
            "id" => (int)$row['id'],
            "post_id" => (int)$row['post_id'],
            "post_title" => $row['post_title'],
            "user_id" => $row['user_id'] ? (int)$row['user_id'] : null,
            "author_name" => $row['author_name'] ?: $row['author_name'],
            "author_email" => $row['author_email'] ?: $row['author_email'],
            "content" => $row['content'],
            "status" => $row['status'],
            "parent_id" => $row['parent_id'] ? (int)$row['parent_id'] : null,
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at']
        ];
    }

    // Contar total
    $count_query = "SELECT COUNT(*) as total FROM comments c WHERE $where_clause";
    $count_stmt = $db->prepare($count_query);
    if ($status !== 'all') {
        $count_stmt->bindParam(':status', $status);
    }
    $count_stmt->execute();
    $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    http_response_code(200);
    echo json_encode([
        "comments" => $comments,
        "pagination" => [
            "current_page" => $page,
            "total_pages" => ceil($total / $limit),
            "total_comments" => (int)$total,
            "comments_per_page" => $limit
        ]
    ]);
}

function handleUpdateComment($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id) || !isset($data->status)) {
        http_response_code(400);
        echo json_encode(array("message" => "ID y status requeridos."));
        return;
    }

    $query = "UPDATE comments SET status = :status, updated_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':status', $data->status);
    $stmt->bindParam(':id', $data->id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Comentario actualizado exitosamente."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo actualizar el comentario."));
    }
}

function handleDeleteComment($db) {
    $comment_id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$comment_id) {
        http_response_code(400);
        echo json_encode(array("message" => "ID de comentario requerido."));
        return;
    }

    $query = "DELETE FROM comments WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $comment_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Comentario eliminado exitosamente."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo eliminar el comentario."));
    }
}
?>