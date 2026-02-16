<?php
require_once __DIR__ . '/../config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'edit':
        editUser();
        break;
    case 'edit_post':
        editUserPost();
        break;
    default:
        echo "Action not found";
}

function editUser() {
    if (!isLoggedIn()) {
        header('Location: ../index.php?_route=login');
        exit;
    }
    
    $user_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$user_id) {
        echo "User ID required";
        exit;
    }
    
    $pdo = getDB();
    $current_user = getCurrentUser();
    
    // Get user details
    $stmt = $pdo->prepare("SELECT * FROM tbl_users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "User not found";
        exit;
    }
    
    // Check permission
    requirePermission('user_edit', ['target_user_id' => $user_id]);
    
    include __DIR__ . '/../views/user_edit.php';
}

function editUserPost() {
    if (!isLoggedIn()) {
        header('Location: ../index.php?_route=login');
        exit;
    }
    
    // Validate CSRF token
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        validateCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '');
    }
    
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    if (!$user_id) {
        echo "User ID required";
        exit;
    }
    
    $pdo = getDB();
    $current_user = getCurrentUser();
    
    // Get user details for permission check
    $stmt = $pdo->prepare("SELECT * FROM tbl_users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "User not found";
        exit;
    }
    
    // Check permission
    requirePermission('user_edit', ['target_user_id' => $user_id]);
    
    // Validate and sanitize input
    $fullname = sanitizeInput($_POST['fullname'] ?? '');
    $phone = sanitizeInput($_POST['phone'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $username = sanitizeInput($_POST['username'] ?? '');
    $user_type = sanitizeInput($_POST['user_type'] ?? $user['user_type']);
    $status = sanitizeInput($_POST['status'] ?? $user['status']);
    
    // Validate email if provided
    if ($email && !validateEmail($email)) {
        die("Invalid email format");
    }
    
    // Validate phone if provided
    if ($phone && !validatePhone($phone)) {
        die("Invalid phone format");
    }
    
    // Check username uniqueness if changed
    if ($username !== $user['username']) {
        $stmt = $pdo->prepare("SELECT id FROM tbl_users WHERE username = ? AND id != ?");
        $stmt->execute([$username, $user_id]);
        if ($stmt->fetch()) {
            die("Username already exists");
        }
    }
    
    // Permission-based field restrictions
    $update_fields = [];
    $update_values = [];
    
    // Basic fields all can edit
    $update_fields[] = "fullname = ?";
    $update_values[] = $fullname;
    
    if ($current_user['user_type'] === 'Sales') {
        // Sales can only edit their own profile fields
        if ($phone) {
            $update_fields[] = "phone = ?";
            $update_values[] = $phone;
        }
        if ($email) {
            $update_fields[] = "email = ?";
            $update_values[] = $email;
        }
    } elseif (in_array($current_user['user_type'], ['Admin', 'SuperAdmin'])) {
        // Admin and SuperAdmin can edit all fields
        if ($phone) {
            $update_fields[] = "phone = ?";
            $update_values[] = $phone;
        }
        if ($email) {
            $update_fields[] = "email = ?";
            $update_values[] = $email;
        }
        $update_fields[] = "username = ?";
        $update_values[] = $username;
        $update_fields[] = "user_type = ?";
        $update_values[] = $user_type;
        $update_fields[] = "status = ?";
        $update_values[] = $status;
    } elseif ($current_user['user_type'] === 'Agent') {
        // Agent can edit users in their tree
        if ($phone) {
            $update_fields[] = "phone = ?";
            $update_values[] = $phone;
        }
        if ($email) {
            $update_fields[] = "email = ?";
            $update_values[] = $email;
        }
        $update_fields[] = "username = ?";
        $update_values[] = $username;
        // Agent cannot change user_type or status
    }
    
    // Handle password change
    $new_password = $_POST['new_password'] ?? '';
    if ($new_password) {
        if (strlen($new_password) < 6) {
            die("Password must be at least 6 characters");
        }
        $password_hash = password_hash($new_password, PASSWORD_DEFAULT, ['cost' => BCRYPT_COST]);
        $update_fields[] = "password_hash = ?";
        $update_values[] = $password_hash;
    }
    
    $update_values[] = $user_id;
    
    // Update user
    $sql = "UPDATE tbl_users SET " . implode(', ', $update_fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($update_values);
    
    if ($result) {
        header('Location: ../index.php?_route=settings/users-edit/' . $user_id);
        exit;
    } else {
        echo "Error updating user";
    }
}
?>
