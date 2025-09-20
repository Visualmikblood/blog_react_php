<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->connect();

// Manejar peticiones OPTIONS (preflight)
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar autenticación para peticiones GET
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

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$status = isset($_GET['status']) ? $_GET['status'] : '';
$category = isset($_GET['category']) ? $_GET['category'] : '';
$search = isset($_GET['search']) ? $_GET['search'] : '';
$author_only = isset($_GET['author_only']) && $_GET['author_only'] === 'true';

$offset = ($page - 1) * $limit;

try {
    // Construir consulta con filtros
    $where_conditions = [];
    $params = [];

    if ($author_only && $tokenData['role'] !== 'admin') {
        $where_conditions[] = "p.author_id = :author_id";
        $params[':author_id'] = $tokenData['user_id'];
    }

    if ($status && $status !== 'all') {
        $where_conditions[] = "p.status = :status";
        $params[':status'] = $status;
    }

    if ($category && $category !== 'all') {
        $where_conditions[] = "c.slug = :category";
        $params[':category'] = $category;
    }

    if ($search) {
        $where_conditions[] = "(p.title LIKE :search OR p.excerpt LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $where_clause = empty($where_conditions) ? '1=1' : implode(' AND ', $where_conditions);

    // Consulta principal
    $query = "SELECT
                p.id, p.title, p.excerpt, p.status, p.created_at, p.updated_at,
                p.likes, p.views, p.read_time, p.featured_image,
                c.name as category, c.slug as category_slug,
                u.name as author, u.email as author_email,
                COUNT(co.id) as comments_count
              FROM posts p
              LEFT JOIN categories c ON p.category_id = c.id
              LEFT JOIN users u ON p.author_id = u.id
              LEFT JOIN comments co ON p.id = co.post_id AND co.status = 'approved'
              WHERE " . $where_clause . "
              GROUP BY p.id
              ORDER BY p.updated_at DESC
              LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();

    $posts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Obtener tags para cada post
        $tag_query = "SELECT t.name FROM tags t
                      INNER JOIN post_tags pt ON t.id = pt.tag_id
                      WHERE pt.post_id = :post_id";
        $tag_stmt = $db->prepare($tag_query);
        $tag_stmt->bindParam(':post_id', $row['id']);
        $tag_stmt->execute();

        $tags = [];
        while ($tag_row = $tag_stmt->fetch(PDO::FETCH_ASSOC)) {
            $tags[] = $tag_row['name'];
        }

        $posts[] = [
            "id" => (int)$row['id'],
            "title" => $row['title'],
            "excerpt" => $row['excerpt'],
            "status" => $row['status'],
            "category" => $row['category_slug'],
            "category_name" => $row['category'],
            "author" => $row['author'],
            "author_email" => $row['author_email'],
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at'],
            "featured_image" => $row['featured_image'],
            "likes" => (int)$row['likes'],
            "views" => (int)$row['views'],
            "comments" => (int)$row['comments_count'],
            "read_time" => $row['read_time'],
            "tags" => $tags
        ];
    }

    // Contar total para paginación
    $count_query = "SELECT COUNT(DISTINCT p.id) as total
                   FROM posts p
                   LEFT JOIN categories c ON p.category_id = c.id
                   WHERE " . $where_clause;

    $count_stmt = $db->prepare($count_query);
    foreach ($params as $key => $value) {
        $count_stmt->bindValue($key, $value);
    }
    $count_stmt->execute();

    $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $total_pages = ceil($total / $limit);

    http_response_code(200);
    echo json_encode([
        "posts" => $posts,
        "pagination" => [
            "current_page" => $page,
            "total_pages" => $total_pages,
            "total_posts" => (int)$total,
            "posts_per_page" => $limit
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}
?>
