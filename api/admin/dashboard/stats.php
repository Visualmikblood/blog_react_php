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

try {
    $user_id = $tokenData['user_id'];
    $is_admin = $tokenData['role'] === 'admin';

    // Estadísticas generales
    $stats = [];

    // Total de posts (todos para admin, solo del usuario para author)
    if ($is_admin) {
        $query = "SELECT COUNT(*) as total FROM posts";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT COUNT(*) as total FROM posts WHERE author_id = :author_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();
    $stats['total_posts'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Posts publicados
    if ($is_admin) {
        $query = "SELECT COUNT(*) as total FROM posts WHERE status = 'published'";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT COUNT(*) as total FROM posts WHERE status = 'published' AND author_id = :author_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();
    $stats['published_posts'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Borradores
    if ($is_admin) {
        $query = "SELECT COUNT(*) as total FROM posts WHERE status = 'draft'";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT COUNT(*) as total FROM posts WHERE status = 'draft' AND author_id = :author_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();
    $stats['draft_posts'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Total de vistas
    if ($is_admin) {
        $query = "SELECT SUM(views) as total FROM posts WHERE status = 'published'";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT SUM(views) as total FROM posts WHERE status = 'published' AND author_id = :author_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();
    $stats['total_views'] = (int)($stmt->fetch(PDO::FETCH_ASSOC)['total'] ?: 0);

    // Total de likes
    if ($is_admin) {
        $query = "SELECT SUM(likes) as total FROM posts WHERE status = 'published'";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT SUM(likes) as total FROM posts WHERE status = 'published' AND author_id = :author_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();
    $stats['total_likes'] = (int)($stmt->fetch(PDO::FETCH_ASSOC)['total'] ?: 0);

    // Total de comentarios
    if ($is_admin) {
        $query = "SELECT COUNT(*) as total FROM comments WHERE status = 'approved'";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT COUNT(c.id) as total FROM comments c
                  INNER JOIN posts p ON c.post_id = p.id
                  WHERE c.status = 'approved' AND p.author_id = :author_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();
    $stats['total_comments'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Comentarios pendientes (solo para admin)
    if ($is_admin) {
        $query = "SELECT COUNT(*) as total FROM comments WHERE status = 'pending'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $stats['pending_comments'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }

    // Posts más populares
    if ($is_admin) {
        $query = "SELECT id, title, views, likes, (views + likes * 2) as popularity_score
                  FROM posts WHERE status = 'published'
                  ORDER BY popularity_score DESC LIMIT 5";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT id, title, views, likes, (views + likes * 2) as popularity_score
                  FROM posts WHERE status = 'published' AND author_id = :author_id
                  ORDER BY popularity_score DESC LIMIT 5";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();

    $popular_posts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $popular_posts[] = [
            "id" => (int)$row['id'],
            "title" => $row['title'],
            "views" => (int)$row['views'],
            "likes" => (int)$row['likes']
        ];
    }

    // Posts recientes
    if ($is_admin) {
        $query = "SELECT p.id, p.title, p.status, p.created_at, u.name as author
                  FROM posts p
                  LEFT JOIN users u ON p.author_id = u.id
                  ORDER BY p.created_at DESC LIMIT 5";
        $stmt = $db->prepare($query);
    } else {
        $query = "SELECT id, title, status, created_at
                  FROM posts WHERE author_id = :author_id
                  ORDER BY created_at DESC LIMIT 5";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':author_id', $user_id);
    }
    $stmt->execute();

    $recent_posts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $post_data = [
            "id" => (int)$row['id'],
            "title" => $row['title'],
            "status" => $row['status'],
            "created_at" => $row['created_at']
        ];

        if ($is_admin && isset($row['author'])) {
            $post_data['author'] = $row['author'];
        }

        $recent_posts[] = $post_data;
    }

    // Estadísticas por categoría (solo para admin)
    $category_stats = [];
    if ($is_admin) {
        $query = "SELECT c.name, c.slug, COUNT(p.id) as post_count
                  FROM categories c
                  LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
                  GROUP BY c.id, c.name, c.slug
                  ORDER BY post_count DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $category_stats[] = [
                "name" => $row['name'],
                "slug" => $row['slug'],
                "post_count" => (int)$row['post_count']
            ];
        }
    }

    $response = [
        "stats" => $stats,
        "popular_posts" => $popular_posts,
        "recent_posts" => $recent_posts
    ];

    if ($is_admin) {
        $response["category_stats"] = $category_stats;
    }

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}
?>
