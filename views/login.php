<?php ob_start(); ?>
<div class="row">
    <div class="col-md-4 col-md-offset-4">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Login</h3>
            </div>
            <div class="panel-body">
                <form method="post" class="form-horizontal">
                    <input type="hidden" name="<?php echo CSRF_TOKEN_NAME; ?>" value="<?php echo generateCSRFToken(); ?>">
                    
                    <div class="form-group">
                        <label for="username" class="col-sm-3 control-label">Username</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="username" name="username" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="password" class="col-sm-3 control-label">Password</label>
                        <div class="col-sm-9">
                            <input type="password" class="form-control" id="password" name="password" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="col-sm-offset-3 col-sm-9">
                            <button type="submit" name="login" class="btn btn-primary">Login</button>
                        </div>
                    </div>
                </form>
                
                <div class="alert alert-info">
                    <strong>Demo Accounts:</strong><br>
                    SuperAdmin: superadmin / password<br>
                    Admin: admin / password<br>
                    Agent: agent / password<br>
                    Sales: sales1 / password
                </div>
            </div>
        </div>
    </div>
</div>
<?php $content = ob_get_clean(); include 'layout.php'; ?>
