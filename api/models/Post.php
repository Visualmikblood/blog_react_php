<?php
class Post {
    private $conn;
    private $table = 'posts';

    public $id;
    public $title;
    public $content;
    public $excerpt;
    public $category_id;
    public $author_id;
    public $featured_image;
    public $status;
    public $read_time;
    public $likes;
    public $views;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  SET title = :title,
                      content = :content,
                      excerpt = :excerpt,
                      category_id = :category_id,
                      author_id = :author_id,
                      featured_image = :featured_image,
                      status = :status,
                      read_time = :read_time";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->content = htmlspecialchars(strip_tags($this->content));
        $this->excerpt = htmlspecialchars(strip_tags($this->excerpt));
        $this->featured_image = htmlspecialchars(strip_tags($this->featured_image));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->read_time = htmlspecialchars(strip_tags($this->read_time));

        // Bind datos
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':content', $this->content);
        $stmt->bindParam(':excerpt', $this->excerpt);
        $stmt->bindParam(':category_id', $this->category_id);
        $stmt->bindParam(':author_id', $this->author_id);
        $stmt->bindParam(':featured_image', $this->featured_image);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':read_time', $this->read_time);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    public function read() {
        $query = "SELECT p.*, c.name as category_name, c.slug as category_slug,
                         u.name as author_name, u.email as author_email
                  FROM " . $this->table . " p
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN users u ON p.author_id = u.id
                  ORDER BY p.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    public function readOne() {
        $query = "SELECT p.*, c.name as category_name, c.slug as category_slug,
                         u.name as author_name, u.email as author_email
                  FROM " . $this->table . " p
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN users u ON p.author_id = u.id
                  WHERE p.id = :id
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->title = $row['title'];
            $this->content = $row['content'];
            $this->excerpt = $row['excerpt'];
            $this->category_id = $row['category_id'];
            $this->author_id = $row['author_id'];
            $this->featured_image = $row['featured_image'];
            $this->status = $row['status'];
            $this->read_time = $row['read_time'];
            $this->likes = $row['likes'];
            $this->views = $row['views'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }

        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table . "
                  SET title = :title,
                      content = :content,
                      excerpt = :excerpt,
                      category_id = :category_id,
                      featured_image = :featured_image,
                      status = :status,
                      read_time = :read_time,
                      updated_at = NOW()
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->content = htmlspecialchars(strip_tags($this->content));
        $this->excerpt = htmlspecialchars(strip_tags($this->excerpt));
        $this->featured_image = htmlspecialchars(strip_tags($this->featured_image));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->read_time = htmlspecialchars(strip_tags($this->read_time));

        // Bind datos
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':content', $this->content);
        $stmt->bindParam(':excerpt', $this->excerpt);
        $stmt->bindParam(':category_id', $this->category_id);
        $stmt->bindParam(':featured_image', $this->featured_image);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':read_time', $this->read_time);
        $stmt->bindParam(':id', $this->id);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>
