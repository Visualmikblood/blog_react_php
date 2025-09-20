<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar autenticación SOLO para peticiones POST
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

// Crear directorio de uploads si no existe
$uploadDir = __DIR__ . '/../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Verificar si se recibió un archivo
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(array("message" => "No se recibió ningún archivo o hubo un error en la subida."));
    exit();
}

$file = $_FILES['image'];
$fileName = $file['name'];
$fileTmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];
$fileType = $file['type'];

// Validar tipo de archivo
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($fileType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(array("message" => "Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG, GIF y WebP."));
    exit();
}

// Validar tamaño del archivo (máximo 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($fileSize > $maxSize) {
    http_response_code(400);
    echo json_encode(array("message" => "El archivo es demasiado grande. Máximo 5MB."));
    exit();
}

// Generar nombre único para el archivo
$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
$newFileName = uniqid('img_', true) . '.' . $fileExtension;
$uploadPath = $uploadDir . $newFileName;

// Mover archivo al directorio de destino
if (move_uploaded_file($fileTmpName, $uploadPath)) {
    // Generar URL relativa para el frontend
    $imageUrl = '/uploads/' . $newFileName;

    http_response_code(200);
    echo json_encode(array(
        "message" => "Imagen subida exitosamente.",
        "image_url" => $imageUrl,
        "filename" => $newFileName
    ));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Error al guardar la imagen."));
}
?>