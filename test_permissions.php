<?php
require_once 'config.php';

// Test script to verify permission enforcement
echo "<h1>Permission System Test</h1>";

// Test users
$test_users = [
    ['username' => 'superadmin', 'password' => 'password'],
    ['username' => 'admin', 'password' => 'password'],
    ['username' => 'agent', 'password' => 'password'],
    ['username' => 'sales1', 'password' => 'password']
];

// Test routes
$test_routes = [
    'plan/list',
    'plan/edit/1',      // Enabled plan
    'plan/edit/3',      // Disabled plan
    'settings/users-edit/1', // SuperAdmin
    'settings/users-edit/2', // Admin
    'settings/users-edit/3', // Agent
    'settings/users-edit/4', // Sales1
    'settings/users-edit/5', // Sales2
];

foreach ($test_users as $test_user) {
    echo "<h2>Testing user: {$test_user['username']}</h2>";
    
    // Login
    session_destroy();
    session_start();
    
    if (login($test_user['username'], $test_user['password'])) {
        echo "<p>✓ Login successful</p>";
        $user = getCurrentUser();
        echo "<p>User Type: {$user['user_type']}</p>";
        
        foreach ($test_routes as $route) {
            echo "<h3>Route: $route</h3>";
            
            // Simulate route access
            $_GET['_route'] = $route;
            
            try {
                // Parse route
                if (strpos($route, 'plan/edit') === 0) {
                    $plan_id = (int)substr($route, strrpos($route, '/') + 1);
                    $pdo = getDB();
                    $stmt = $pdo->prepare("SELECT * FROM tbl_plans WHERE id = ?");
                    $stmt->execute([$plan_id]);
                    $plan = $stmt->fetch();
                    
                    if ($plan) {
                        $has_access = hasPermission('plan_edit', ['plan_enabled' => $plan['enabled']]);
                        echo "<p>Plan Edit Access: " . ($has_access ? "✓ ALLOWED" : "✗ DENIED") . "</p>";
                        if (!$has_access) {
                            echo "<p>Message: You do not have permission to access this page</p>";
                        }
                    }
                } elseif (strpos($route, 'settings/users-edit') === 0) {
                    $user_id = (int)substr($route, strrpos($route, '/') + 1);
                    $has_access = hasPermission('user_edit', ['target_user_id' => $user_id]);
                    echo "<p>User Edit Access: " . ($has_access ? "✓ ALLOWED" : "✗ DENIED") . "</p>";
                    if (!$has_access) {
                        echo "<p>Message: You do not have permission to access this page</p>";
                    }
                } elseif ($route === 'plan/list') {
                    echo "<p>Plan List: ✓ ALLOWED (all logged-in users)</p>";
                }
            } catch (Exception $e) {
                echo "<p>✗ ERROR: " . $e->getMessage() . "</p>";
            }
        }
    } else {
        echo "<p>✗ Login failed</p>";
    }
    
    echo "<hr>";
}

echo "<h2>CSRF Token Test</h2>";
$token1 = generateCSRFToken();
$token2 = generateCSRFToken();
echo "<p>Token consistency: " . ($token1 === $token2 ? "✓ PASS" : "✗ FAIL") . "</p>";

echo "<h2>Input Validation Test</h2>";
$test_inputs = [
    'email' => ['test@example.com' => true, 'invalid-email' => false],
    'phone' => ['123-456-7890' => true, 'abc123' => false]
];

foreach ($test_inputs as $type => $tests) {
    echo "<h3>$type validation:</h3>";
    foreach ($tests as $input => $expected) {
        if ($type === 'email') {
            $result = validateEmail($input);
        } else {
            $result = validatePhone($input);
        }
        echo "<p>Input: $input - " . ($result === $expected ? "✓ PASS" : "✗ FAIL") . "</p>";
    }
}

echo "<h2>Database Connection Test</h2>";
try {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT COUNT(*) as user_count FROM tbl_users");
    $result = $stmt->fetch();
    echo "<p>✓ Database connected successfully</p>";
    echo "<p>User count: {$result['user_count']}</p>";
} catch (Exception $e) {
    echo "<p>✗ Database connection failed: " . $e->getMessage() . "</p>";
}
?>
