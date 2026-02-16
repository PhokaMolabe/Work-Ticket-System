<?php
require_once 'config.php';

// Simple router
$route = $_GET['_route'] ?? 'home';

// Route definitions
$routes = [
    'home' => 'controllers/HomeController.php',
    'plan/list' => 'controllers/PlanController.php?action=list',
    'plan/edit/{id}' => 'controllers/PlanController.php?action=edit',
    'plan/edit-post' => 'controllers/PlanController.php?action=edit_post',
    'settings/users-edit/{id}' => 'controllers/UserController.php?action=edit',
    'settings/users-edit-post' => 'controllers/UserController.php?action=edit_post',
];

// Parse route
$matched_route = null;
$params = [];

foreach ($routes as $pattern => $handler) {
    // Convert {id} pattern to regex
    $regex_pattern = preg_replace('/\{id\}/', '(\d+)', $pattern);
    $regex_pattern = '/^' . str_replace('/', '\/', $regex_pattern) . '$/';
    
    if (preg_match($regex_pattern, $route, $matches)) {
        $matched_route = $handler;
        $params = array_slice($matches, 1);
        break;
    }
}

if (!$matched_route) {
    http_response_code(404);
    echo "Page not found";
    exit;
}

// Parse handler
if (strpos($matched_route, '?') !== false) {
    list($controller_file, $query_string) = explode('?', $matched_route, 2);
    parse_str($query_string, $_GET);
} else {
    $controller_file = $matched_route;
}

// Include and execute controller
if (file_exists($controller_file)) {
    require_once $controller_file;
} else {
    http_response_code(404);
    echo "Controller not found";
}
?>
