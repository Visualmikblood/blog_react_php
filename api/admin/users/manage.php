<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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
            handleGetUsers($db);
            break;
        case 'POST':
            handleCreateUser($db);
            break;
        case 'PUT':
            handleUpdateUser($db);
            break;
        case 'DELETE':
            handleDeleteUser($db);
            break;
        default:
            http_response_code(405);
            echo json_encode(array("message" => "Método no permitido."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}

function handleGetUsers($db) {
    $role = isset($_GET['role']) ? $_GET['role'] : 'all';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    $where_clause = "1=1";
    if ($role !== 'all') {
        $where_clause = "role = :role";
    }

    $query = "SELECT id, name, email, role, avatar, bio, created_at, updated_at,
                     (SELECT COUNT(*) FROM posts WHERE author_id = users.id) as posts_count
              FROM users
              WHERE $where_clause
              ORDER BY created_at DESC
              LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);

    if ($role !== 'all') {
        $stmt->bindParam(':role', $role);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();

    $users = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $users[] = [
            "id" => (int)$row['id'],
            "name" => $row['name'],
            "email" => $row['email'],
            "role" => $row['role'],
            "avatar" => $row['avatar'],
            "bio" => $row['bio'],
            "posts_count" => (int)$row['posts_count'],
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at']
        ];
    }

    // Contar total
    $count_query = "SELECT COUNT(*) as total FROM users WHERE $where_clause";
    $count_stmt = $db->prepare($count_query);
    if ($role !== 'all') {
        $count_stmt->bindParam(':role', $role);
    }
    $count_stmt->execute();
    $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    http_response_code(200);
    echo json_encode([
        "users" => $users,
        "pagination" => [
            "current_page" => $page,
            "total_pages" => ceil($total / $limit),
            "total_users" => (int)$total,
            "users_per_page" => $limit
        ]
    ]);
}

function handleCreateUser($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->name) || !isset($data->email) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode(array("message" => "Nombre, email y contraseña requeridos."));
        return;
    }

    $name = Helpers::sanitizeInput($data->name);
    $email = Helpers::sanitizeInput($data->email);
    $password = password_hash($data->password, PASSWORD_DEFAULT);
    $role = isset($data->role) ? $data->role : 'user';
    $bio = isset($data->bio) ? Helpers::sanitizeInput($data->bio) : null;

    // Verificar que el email no existe
    $check_query = "SELECT id FROM users WHERE email = :email";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':email', $email);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Ya existe un usuario con ese email."));
        return;
    }

    $query = "INSERT INTO users (name, email, password, role, bio) VALUES (:name, :email, :password, :role, :bio)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $password);
    $stmt->bindParam(':role', $role);
    $stmt->bindParam(':bio', $bio);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array(
            "message" => "Usuario creado exitosamente.",
            "user_id" => $db->lastInsertId()
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo crear el usuario."));
    }
}

function handleUpdateUser($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id) || !isset($data->name) || !isset($data->email)) {
        http_response_code(400);
        echo json_encode(array("message" => "ID, nombre y email requeridos."));
        return;
    }

    $id = $data->id;
    $name = Helpers::sanitizeInput($data->name);
    $email = Helpers::sanitizeInput($data->email);
    $role = isset($data->role) ? $data->role : 'user';
    $bio = isset($data->bio) ? Helpers::sanitizeInput($data->bio) : null;

    // Verificar que el usuario existe
    $check_query = "SELECT id FROM users WHERE id = :id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':id', $id);
    $check_stmt->execute();

    if ($check_stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Usuario no encontrado."));
        return;
    }

    // Verificar que el email no existe (excepto para el mismo usuario)
    $email_check_query = "SELECT id FROM users WHERE email = :email AND id != :id";
    $email_check_stmt = $db->prepare($email_check_query);
    $email_check_stmt->bindParam(':email', $email);
    $email_check_stmt->bindParam(':id', $id);
    $email_check_stmt->execute();

    if ($email_check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Ya existe un usuario con ese email."));
        return;
    }

    $query = "UPDATE users SET name = :name, email = :email, role = :role, bio = :bio WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':role', $role);
    $stmt->bindParam(':bio', $bio);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Usuario actualizado exitosamente."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo actualizar el usuario."));
    }
}

function handleDeleteUser($db) {
    $user_id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$user_id) {
        http_response_code(400);
        echo json_encode(array("message" => "ID de usuario requerido."));
        return;
    }

    // Verificar que el usuario existe
    $check_query = "SELECT id FROM users WHERE id = :id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':id', $user_id);
    $check_stmt->execute();

    if ($check_stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Usuario no encontrado."));
        return;
    }

    // Verificar si el usuario tiene posts
    $posts_check_query = "SELECT COUNT(*) as count FROM posts WHERE author_id = :user_id";
    $posts_check_stmt = $db->prepare($posts_check_query);
    $posts_check_stmt->bindParam(':user_id', $user_id);
    $posts_check_stmt->execute();

    $post_count = $posts_check_stmt->fetch(PDO::FETCH_ASSOC)['count'];

    if ($post_count > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "No se puede eliminar un usuario que tiene artículos publicados."));
        return;
    }

    $query = "DELETE FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $user_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Usuario eliminado exitosamente."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo eliminar el usuario."));
    }
}
?>