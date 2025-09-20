<?php
// api/admin/auth.php - Sistema de autenticación
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
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

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Método no permitido."));
    exit();
}

// Procesar datos tanto de JSON como de FormData
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if (strpos($contentType, 'application/json') !== false) {
    // Procesar como JSON
    $data = json_decode(file_get_contents("php://input"));
} elseif (strpos($contentType, 'multipart/form-data') !== false) {
    // Procesar como FormData
    $data = new stdClass();
    $data->action = $_POST['action'] ?? null;
    $data->email = $_POST['email'] ?? null;
    $data->password = $_POST['password'] ?? null;
    $data->token = $_POST['token'] ?? null;
} else {
    // Intentar procesar como JSON por defecto
    $data = json_decode(file_get_contents("php://input"));
}

// Debug: Log the received data
error_log("Received data: " . print_r($data, true));
error_log("Raw input: " . file_get_contents("php://input"));
error_log("Content-Type: " . $contentType);

if (!$data) {
    http_response_code(400);
    echo json_encode(array("message" => "Datos inválidos."));
    exit();
}

if (!isset($data->action)) {
    http_response_code(400);
    echo json_encode(array("message" => "Acción requerida.", "received_data" => $data));
    exit();
}

switch ($data->action) {
    case 'login':
        handleLogin($db, $data);
        break;
    case 'verify':
        handleVerifyToken($db, $data);
        break;
    default:
        http_response_code(400);
        echo json_encode(array("message" => "Acción no válida."));
}

function handleLogin($db, $data) {
    if (!isset($data->email) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode(array("message" => "Email y contraseña requeridos."));
        return;
    }

    $email = Helpers::sanitizeInput($data->email);
    $password = $data->password;

    $query = "SELECT id, name, email, password, role FROM users WHERE email = :email AND (role = 'admin' OR role = 'author')";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() === 1) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (Helpers::verifyPassword($password, $user['password'])) {
            // Generar JWT token simple (en producción usar library JWT)
            $token = base64_encode(json_encode([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'exp' => time() + (24 * 60 * 60) // 24 horas
            ]));

            http_response_code(200);
            echo json_encode(array(
                "message" => "Login exitoso",
                "token" => $token,
                "user" => array(
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "email" => $user['email'],
                    "role" => $user['role']
                )
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Credenciales inválidas."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Usuario no encontrado."));
    }
}

function handleVerifyToken($db, $data) {
    if (!isset($data->token)) {
        http_response_code(400);
        echo json_encode(array("message" => "Token requerido."));
        return;
    }

    try {
        $tokenData = json_decode(base64_decode($data->token), true);

        if ($tokenData['exp'] < time()) {
            http_response_code(401);
            echo json_encode(array("message" => "Token expirado."));
            return;
        }

        // Verificar que el usuario aún existe
        $query = "SELECT id, name, email, role FROM users WHERE id = :id AND (role = 'admin' OR role = 'author')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $tokenData['user_id']);
        $stmt->execute();

        if ($stmt->rowCount() === 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(array(
                "valid" => true,
                "user" => $user
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Usuario no válido."));
        }
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(array("message" => "Token inválido."));
    }
}
?>
