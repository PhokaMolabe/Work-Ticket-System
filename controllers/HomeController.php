<?php
require_once __DIR__ . '/../config.php';

function home() {
    if (!isLoggedIn()) {
        include __DIR__ . '/../views/login.php';
    } else {
        $user = getCurrentUser();
        include __DIR__ . '/../views/dashboard.php';
    }
}

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = sanitizeInput($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (login($username, $password)) {
        header('Location: index.php?_route=plan/list');
        exit;
    } else {
        $error = "Invalid username or password";
        include __DIR__ . '/../views/login.php';
    }
} else {
    home();
}
?>
