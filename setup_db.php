<?php

try {
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS app_db");
    echo "Database 'app_db' created successfully<br>";
    
    $pdo->exec("USE app_db");
    
    $sql = file_get_contents('database.sql');
    $pdo->exec($sql);
    
    echo "Database tables and seed data imported successfully!<br>";
    echo "<a href='index.php'>Go to Application</a>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
