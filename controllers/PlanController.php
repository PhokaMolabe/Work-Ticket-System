<?php
require_once __DIR__ . '/../config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listPlans();
        break;
    case 'edit':
        editPlan();
        break;
    case 'edit_post':
        editPlanPost();
        break;
    default:
        echo "Action not found";
}

function listPlans() {
    if (!isLoggedIn()) {
        header('Location: ../index.php?_route=login');
        exit;
    }
    
    $pdo = getDB();
    $user = getCurrentUser();
    
    // Get plans with permission filtering
    $sql = "SELECT p.*, ur.customer_id, ur.status as recharge_status 
            FROM tbl_plans p 
            LEFT JOIN tbl_user_recharges ur ON p.id = ur.plan_id";
    
    if (in_array($user['user_type'], ['Agent', 'Sales'])) {
        $sql .= " WHERE p.enabled = TRUE";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $plans = $stmt->fetchAll();
    
    include __DIR__ . '/../views/plan_list.php';
}

function editPlan() {
    if (!isLoggedIn()) {
        header('Location: ../index.php?_route=login');
        exit;
    }
    
    $plan_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$plan_id) {
        echo "Plan ID required";
        exit;
    }
    
    $pdo = getDB();
    $user = getCurrentUser();
    
    // Get plan details
    $stmt = $pdo->prepare("SELECT * FROM tbl_plans WHERE id = ?");
    $stmt->execute([$plan_id]);
    $plan = $stmt->fetch();
    
    if (!$plan) {
        echo "Plan not found";
        exit;
    }
    
    // Check permission
    requirePermission('plan_edit', ['plan_enabled' => $plan['enabled']]);
    
    // Get related recharges if needed for permission checks
    $recharges = [];
    if ($user['user_type'] === 'Sales') {
        $stmt = $pdo->prepare("SELECT * FROM tbl_user_recharges WHERE plan_id = ?");
        $stmt->execute([$plan_id]);
        $recharges = $stmt->fetchAll();
    }
    
    include __DIR__ . '/../views/plan_edit.php';
}

function editPlanPost() {
    if (!isLoggedIn()) {
        header('Location: ../index.php?_route=login');
        exit;
    }
    
    // Validate CSRF token
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        validateCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '');
    }
    
    $plan_id = isset($_POST['plan_id']) ? (int)$_POST['plan_id'] : 0;
    if (!$plan_id) {
        echo "Plan ID required";
        exit;
    }
    
    $pdo = getDB();
    $user = getCurrentUser();
    
    // Get plan details for permission check
    $stmt = $pdo->prepare("SELECT * FROM tbl_plans WHERE id = ?");
    $stmt->execute([$plan_id]);
    $plan = $stmt->fetch();
    
    if (!$plan) {
        echo "Plan not found";
        exit;
    }
    
    // Check permission
    requirePermission('plan_edit', ['plan_enabled' => $plan['enabled']]);
    
    // Validate and sanitize input
    $name_plan = sanitizeInput($_POST['name_plan'] ?? '');
    $price = filter_var($_POST['price'] ?? 0, FILTER_VALIDATE_FLOAT);
    $type = sanitizeInput($_POST['type'] ?? '');
    $is_radius = isset($_POST['is_radius']) ? 1 : 0;
    $enabled = isset($_POST['enabled']) ? 1 : 0;
    
    // Additional validation for Sales users
    if ($user['user_type'] === 'Sales') {
        // Sales users cannot disable plans
        if (!$enabled && $plan['enabled']) {
            die("Sales users cannot disable plans");
        }
    }
    
    // Update plan
    $stmt = $pdo->prepare("UPDATE tbl_plans SET name_plan = ?, price = ?, type = ?, is_radius = ?, enabled = ? WHERE id = ?");
    $result = $stmt->execute([$name_plan, $price, $type, $is_radius, $enabled, $plan_id]);
    
    if ($result) {
        header('Location: ../index.php?_route=plan/list');
        exit;
    } else {
        echo "Error updating plan";
    }
}
?>
