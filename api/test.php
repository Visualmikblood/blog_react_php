<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

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

$data = json_decode(file_get_contents("php://input"));

error_log("Test endpoint - Received data: " . print_r($data, true));
error_log("Test endpoint - Raw input: " . file_get_contents("php://input"));

if (!$data) {
    http_response_code(400);
    echo json_encode(array("message" => "JSON inválido.", "raw" => file_get_contents("php://input")));
    exit();
}

http_response_code(200);
echo json_encode(array(
    "message" => "Test exitoso",
    "received" => $data,
    "raw" => file_get_contents("php://input")
));
?>