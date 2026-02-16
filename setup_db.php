<?php
// Simple database setup script
try {
    // Connect to MySQL without database
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS app_db");
    echo "Database 'app_db' created successfully<br>";
    
    // Select the database
    $pdo->exec("USE app_db");
    
    // Read and execute SQL file
    $sql = file_get_contents('database.sql');
    $pdo->exec($sql);
    
    echo "Database tables and seed data imported successfully!<br>";
    echo "<a href='index.php'>Go to Application</a>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
