<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'config/database.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            handlePublicGet($db);
            break;
        default:
            http_response_code(405);
            echo json_encode(array("message" => "Método no permitido."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error del servidor: " . $e->getMessage()));
}

function handlePublicGet($db) {
    $request_uri = $_SERVER['REQUEST_URI'];

    // Obtener artículo individual (DEBE IR PRIMERO - patrón más específico)
    if (preg_match('/\/public\/posts\/(\d+)/', $request_uri, $matches)) {
        $postId = $matches[1];
        getPostById($db, $postId);
    }
    // Obtener artículos publicados
    elseif (strpos($request_uri, '/public/posts') !== false) {
        getPublishedPosts($db);
    }
    // Obtener categorías
    elseif (strpos($request_uri, '/public/categories') !== false) {
        getCategories($db);
    }
    else {
        http_response_code(404);
        echo json_encode(array("message" => "Endpoint no encontrado."));
    }
}

function getPublishedPosts($db) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;

    $offset = ($page - 1) * $limit;

    $query = "SELECT
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                u.name as author_name,
                COUNT(co.id) as comments_count
              FROM posts p
              LEFT JOIN categories c ON p.category_id = c.id
              LEFT JOIN users u ON p.author_id = u.id
              LEFT JOIN comments co ON p.id = co.post_id AND co.status = 'approved'
              WHERE p.status = 'published'";

    $params = [];

    if ($category) {
        $query .= " AND c.slug = :category";
        $params[':category'] = $category;
    }

    if ($search) {
        $query .= " AND (p.title LIKE :search OR p.content LIKE :search OR p.excerpt LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $query .= " GROUP BY p.id ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Obtener total de posts para paginación
    $countQuery = "SELECT COUNT(*) as total FROM posts p WHERE p.status = 'published'";
    if ($category) {
        $countQuery .= " AND p.category_id IN (SELECT id FROM categories WHERE slug = :category)";
    }
    if ($search) {
        $countQuery .= " AND (p.title LIKE :search OR p.content LIKE :search OR p.excerpt LIKE :search)";
    }

    $countStmt = $db->prepare($countQuery);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Formatear posts para el frontend
    $formattedPosts = array_map(function($post) {
        return [
            'id' => $post['id'],
            'title' => $post['title'],
            'excerpt' => $post['excerpt'],
            'content' => $post['content'],
            'category' => $post['category_name'] ?: 'Sin categoría',
            'category_slug' => $post['category_slug'],
            'author' => $post['author_name'] ?: 'Anónimo',
            'date' => date('Y-m-d', strtotime($post['created_at'])),
            'featured_image' => $post['featured_image'],
            'comments_count' => (int)$post['comments_count'],
            'read_time' => $post['read_time'] ?: '5 min read'
        ];
    }, $posts);

    http_response_code(200);
    echo json_encode([
        "posts" => $formattedPosts,
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => (int)$total,
            "pages" => ceil($total / $limit)
        ]
    ]);
}

function getPostById($db, $postId) {
    $query = "SELECT
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                u.name as author_name,
                u.bio as author_bio,
                COUNT(co.id) as comments_count
              FROM posts p
              LEFT JOIN categories c ON p.category_id = c.id
              LEFT JOIN users u ON p.author_id = u.id
              LEFT JOIN comments co ON p.id = co.post_id AND co.status = 'approved'
              WHERE p.id = :id AND p.status = 'published'
              GROUP BY p.id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $postId, PDO::PARAM_INT);
    $stmt->execute();

    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        http_response_code(404);
        echo json_encode(array("message" => "Artículo no encontrado."));
        return;
    }

    // Obtener comentarios del artículo
    $commentsQuery = "SELECT
                        c.*,
                        u.name as author_name,
                        u.avatar as author_avatar
                      FROM comments c
                      LEFT JOIN users u ON c.user_id = u.id
                      WHERE c.post_id = :post_id AND c.status = 'approved'
                      ORDER BY c.created_at ASC";

    $commentsStmt = $db->prepare($commentsQuery);
    $commentsStmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
    $commentsStmt->execute();
    $comments = $commentsStmt->fetchAll(PDO::FETCH_ASSOC);

    $formattedPost = [
        'id' => $post['id'],
        'title' => $post['title'],
        'excerpt' => $post['excerpt'],
        'content' => $post['content'],
        'category' => $post['category_name'] ?: 'Sin categoría',
        'category_slug' => $post['category_slug'],
        'author' => $post['author_name'] ?: 'Anónimo',
        'author_bio' => $post['author_bio'],
        'date' => date('Y-m-d', strtotime($post['created_at'])),
        'featured_image' => $post['featured_image'],
        'comments_count' => (int)$post['comments_count'],
        'read_time' => $post['read_time'] ?: '5 min read',
        'comments' => array_map(function($comment) {
            return [
                'id' => $comment['id'],
                'author_name' => $comment['author_name'] ?: $comment['author_name'],
                'author_email' => $comment['author_email'],
                'content' => $comment['content'],
                'date' => date('Y-m-d H:i', strtotime($comment['created_at']))
            ];
        }, $comments)
    ];

    http_response_code(200);
    echo json_encode(["post" => $formattedPost]);
}

function getCategories($db) {
    $query = "SELECT c.*, COUNT(p.id) as posts_count
              FROM categories c
              LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
              GROUP BY c.id
              ORDER BY c.name";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["categories" => $categories]);
}
?>