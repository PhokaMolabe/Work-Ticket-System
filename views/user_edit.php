<?php ob_start(); ?>
<div class="row">
    <div class="col-md-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h4 class="panel-title">Profile</h4>
            </div>
            <div class="panel-body">
                <form method="post" action="index.php?_route=settings/users-edit-post" class="form-horizontal">
                    <input type="hidden" name="<?php echo CSRF_TOKEN_NAME; ?>" value="<?php echo generateCSRFToken(); ?>">
                    <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                    
                    <div class="form-group">
                        <label for="fullname" class="col-sm-3 control-label">Full Name</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="fullname" name="fullname" 
                                   value="<?php echo htmlspecialchars($user['fullname']); ?>" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="phone" class="col-sm-3 control-label">Phone</label>
                        <div class="col-sm-9">
                            <input type="tel" class="form-control" id="phone" name="phone" 
                                   value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="email" class="col-sm-3 control-label">Email</label>
                        <div class="col-sm-9">
                            <input type="email" class="form-control" id="email" name="email" 
                                   value="<?php echo htmlspecialchars($user['email'] ?? ''); ?>">
                        </div>
                    </div>
                    
                    <?php if (in_array(getCurrentUser()['user_type'], ['Admin', 'SuperAdmin', 'Agent'])): ?>
                    <div class="form-group">
                        <label for="username" class="col-sm-3 control-label">Username</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="username" name="username" 
                                   value="<?php echo htmlspecialchars($user['username']); ?>" required>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <?php if (in_array(getCurrentUser()['user_type'], ['Admin', 'SuperAdmin'])): ?>
                    <div class="form-group">
                        <label for="user_type" class="col-sm-3 control-label">User Type</label>
                        <div class="col-sm-9">
                            <select class="form-control" id="user_type" name="user_type">
                                <option value="SuperAdmin" <?php echo $user['user_type'] == 'SuperAdmin' ? 'selected' : ''; ?>>SuperAdmin</option>
                                <option value="Admin" <?php echo $user['user_type'] == 'Admin' ? 'selected' : ''; ?>>Admin</option>
                                <option value="Agent" <?php echo $user['user_type'] == 'Agent' ? 'selected' : ''; ?>>Agent</option>
                                <option value="Sales" <?php echo $user['user_type'] == 'Sales' ? 'selected' : ''; ?>>Sales</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="status" class="col-sm-3 control-label">Status</label>
                        <div class="col-sm-9">
                            <select class="form-control" id="status" name="status">
                                <option value="active" <?php echo $user['status'] == 'active' ? 'selected' : ''; ?>>Active</option>
                                <option value="inactive" <?php echo $user['status'] == 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                            </select>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <div class="form-group">
                        <div class="col-sm-offset-3 col-sm-9">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <a href="index.php?_route=home" class="btn btn-default">Cancel</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <div class="col-md-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h4 class="panel-title">Credentials</h4>
            </div>
            <div class="panel-body">
                <form method="post" action="index.php?_route=settings/users-edit-post" class="form-horizontal">
                    <input type="hidden" name="<?php echo CSRF_TOKEN_NAME; ?>" value="<?php echo generateCSRFToken(); ?>">
                    <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                    
                    <div class="form-group">
                        <label for="new_password" class="col-sm-3 control-label">New Password</label>
                        <div class="col-sm-9">
                            <input type="password" class="form-control" id="new_password" name="new_password" 
                                   placeholder="Leave blank to keep current password">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm_password" class="col-sm-3 control-label">Confirm Password</label>
                        <div class="col-sm-9">
                            <input type="password" class="form-control" id="confirm_password" name="confirm_password" 
                                   placeholder="Confirm new password">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="col-sm-offset-3 col-sm-9">
                            <button type="submit" class="btn btn-warning">Update Password</button>
                        </div>
                    </div>
                </form>
                
                <hr>
                
                <div class="row">
                    <div class="col-sm-12">
                        <h5>Account Information</h5>
                        <p><strong>User ID:</strong> <?php echo $user['id']; ?></p>
                        <p><strong>User Type:</strong> <?php echo htmlspecialchars($user['user_type']); ?></p>
                        <p><strong>Status:</strong> 
                            <span class="label label-<?php echo $user['status'] == 'active' ? 'success' : 'danger'; ?>">
                                <?php echo htmlspecialchars($user['status']); ?>
                            </span>
                        </p>
                        <?php if ($user['root']): ?>
                        <p><strong>Reports to:</strong> Agent ID <?php echo $user['root']; ?></p>
                        <?php endif; ?>
                        <p><strong>Created:</strong> <?php echo $user['created_at']; ?></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            const newPassword = form.querySelector('#new_password');
            const confirmPassword = form.querySelector('#confirm_password');
            
            if (newPassword && confirmPassword) {
                if (newPassword.value && newPassword.value !== confirmPassword.value) {
                    e.preventDefault();
                    alert('Passwords do not match');
                    return false;
                }
            }
        });
    });
});
</script>
<?php $content = ob_get_clean(); include 'layout.php'; ?>
