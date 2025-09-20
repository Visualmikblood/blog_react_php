<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../../config/database.php';

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
            handleGetSettings($db);
            break;
        case 'PUT':
            handleUpdateSettings($db);
            break;
        default:
            http_response_code(405);
            echo json_encode(array("message" => "Método no permitido."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}

function handleGetSettings($db) {
    $query = "SELECT * FROM site_settings ORDER BY setting_key";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $settings = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $settings[$row['setting_key']] = [
            "value" => $row['setting_value'],
            "type" => $row['setting_type'],
            "description" => getSettingDescription($row['setting_key'])
        ];
    }

    http_response_code(200);
    echo json_encode(["settings" => $settings]);
}

function handleUpdateSettings($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->settings) || !is_object($data->settings)) {
        http_response_code(400);
        echo json_encode(array("message" => "Datos de configuración requeridos."));
        return;
    }

    $updated = 0;
    $errors = [];

    foreach ($data->settings as $key => $setting) {
        try {
            $query = "UPDATE site_settings
                     SET setting_value = :value, updated_at = NOW()
                     WHERE setting_key = :key";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':value', $setting->value);
            $stmt->bindParam(':key', $key);

            if ($stmt->execute()) {
                $updated++;
            } else {
                $errors[] = "Error al actualizar: $key";
            }
        } catch (Exception $e) {
            $errors[] = "Error en $key: " . $e->getMessage();
        }
    }

    if (empty($errors)) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Configuración actualizada exitosamente.",
            "updated" => $updated
        ));
    } else {
        http_response_code(207); // Multi-Status
        echo json_encode(array(
            "message" => "Configuración parcialmente actualizada.",
            "updated" => $updated,
            "errors" => $errors
        ));
    }
}

function getSettingDescription($key) {
    $descriptions = [
        'site_name' => 'Nombre del sitio web',
        'site_description' => 'Descripción del sitio web',
        'site_url' => 'URL base del sitio web',
        'posts_per_page' => 'Número de artículos por página',
        'comments_enabled' => 'Habilitar comentarios en artículos',
        'registration_enabled' => 'Permitir registro de nuevos usuarios',
        'maintenance_mode' => 'Modo mantenimiento (sitio no disponible)',
        'contact_email' => 'Email de contacto',
        'social_facebook' => 'URL de Facebook',
        'social_twitter' => 'URL de Twitter',
        'social_instagram' => 'URL de Instagram',
        'social_linkedin' => 'URL de LinkedIn',
        'analytics_code' => 'Código de Google Analytics',
        'meta_keywords' => 'Palabras clave para SEO',
        'meta_description' => 'Descripción meta para SEO'
    ];

    return isset($descriptions[$key]) ? $descriptions[$key] : 'Configuración del sitio';
}
?>