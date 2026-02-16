<?php ob_start(); ?>
<div class="row">
    <div class="col-md-12">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Dashboard</h3>
            </div>
            <div class="panel-body">
                <h4>Welcome, <?php echo htmlspecialchars($user['fullname']); ?>!</h4>
                <p><strong>User Type:</strong> <?php echo htmlspecialchars($user['user_type']); ?></p>
                <p><strong>Username:</strong> <?php echo htmlspecialchars($user['username']); ?></p>
                <p><strong>Email:</strong> <?php echo htmlspecialchars($user['email'] ?? 'Not set'); ?></p>
                <p><strong>Phone:</strong> <?php echo htmlspecialchars($user['phone'] ?? 'Not set'); ?></p>
                
                <div class="btn-group">
                    <a href="index.php?_route=plan/list" class="btn btn-primary">View Plans</a>
                    <a href="index.php?_route=settings/users-edit/<?php echo $user['id']; ?>" class="btn btn-default">Edit Profile</a>
                </div>
            </div>
        </div>
    </div>
</div>
<?php $content = ob_get_clean(); include 'layout.php'; ?>
