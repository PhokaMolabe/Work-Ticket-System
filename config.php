<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'app_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Application configuration
define('APP_URL', 'http://localhost');
define('SESSION_NAME', 'app_session');

// Security
define('CSRF_TOKEN_NAME', 'csrf_token');
define('BCRYPT_COST', 12);

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session
session_name(SESSION_NAME);
session_start();

// Database connection
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }
    return $pdo;
}

// CSRF Protection
function generateCSRFToken() {
    if (empty($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

function validateCSRFToken($token) {
    if (!isset($_SESSION[CSRF_TOKEN_NAME]) || !hash_equals($_SESSION[CSRF_TOKEN_NAME], $token)) {
        die("CSRF token validation failed");
    }
}

// Authentication helpers
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    static $user = null;
    if ($user === null) {
        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT * FROM tbl_users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
    }
    return $user;
}

function login($username, $password) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM tbl_users WHERE username = ? AND status = 'active'");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        return true;
    }
    return false;
}

function logout() {
    session_destroy();
    session_start();
}

// Permission system
function hasPermission($required_permission, $resource_data = null) {
    $user = getCurrentUser();
    if (!$user) {
        return false;
    }
    
    switch ($required_permission) {
        case 'plan_edit':
            // SuperAdmin and Admin can edit any plan
            if (in_array($user['user_type'], ['SuperAdmin', 'Admin'])) {
                return true;
            }
            
            // Agent and Sales can only edit enabled plans
            if (isset($resource_data['plan_enabled']) && !$resource_data['plan_enabled']) {
                return false;
            }
            
            // Sales must be restricted by ownership/tree
            if ($user['user_type'] === 'Sales') {
                if (isset($resource_data['customer_id'])) {
                    // Check if customer belongs to sales user's tree
                    return isCustomerInSalesTree($user['id'], $resource_data['customer_id']);
                }
            }
            
            // Agent can edit enabled plans
            if ($user['user_type'] === 'Agent') {
                return true;
            }
            
            return false;
            
        case 'user_edit':
            // SuperAdmin and Admin can edit any user
            if (in_array($user['user_type'], ['SuperAdmin', 'Admin'])) {
                return true;
            }
            
            // Agent can edit users under their tree
            if ($user['user_type'] === 'Agent' && isset($resource_data['target_user_id'])) {
                return isUserInAgentTree($user['id'], $resource_data['target_user_id']);
            }
            
            // Sales can only edit themselves
            if ($user['user_type'] === 'Sales' && isset($resource_data['target_user_id'])) {
                return $user['id'] == $resource_data['target_user_id'];
            }
            
            return false;
            
        default:
            return false;
    }
}

function isCustomerInSalesTree($sales_id, $customer_id) {
    $pdo = getDB();
    
    // Get the sales user's agent
    $stmt = $pdo->prepare("SELECT root FROM tbl_users WHERE id = ?");
    $stmt->execute([$sales_id]);
    $sales_user = $stmt->fetch();
    
    if (!$sales_user || !$sales_user['root']) {
        return false;
    }
    
    // Check if customer belongs to the same agent tree
    $stmt = $pdo->prepare("SELECT id FROM tbl_users WHERE id = ? AND (root = ? OR id = ?)");
    $stmt->execute([$customer_id, $sales_user['root'], $sales_user['root']]);
    return $stmt->fetch() !== false;
}

function isUserInAgentTree($agent_id, $target_user_id) {
    $pdo = getDB();
    
    // Check if target user has this agent as root or is the agent themselves
    $stmt = $pdo->prepare("SELECT id FROM tbl_users WHERE id = ? AND (root = ? OR id = ?)");
    $stmt->execute([$target_user_id, $agent_id, $agent_id]);
    return $stmt->fetch() !== false;
}

function requirePermission($required_permission, $resource_data = null) {
    if (!hasPermission($required_permission, $resource_data)) {
        die("You do not have permission to access this page");
    }
}

// Input validation
function sanitizeInput($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validatePhone($phone) {
    return preg_match('/^[0-9+\-\s()]+$/', $phone);
}
?>
