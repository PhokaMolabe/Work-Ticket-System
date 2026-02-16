<?php ob_start(); ?>
<div class="row">
    <div class="col-md-8 col-md-offset-2">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Edit Plan</h3>
            </div>
            <div class="panel-body">
                <form method="post" action="index.php?_route=plan/edit-post" class="form-horizontal">
                    <input type="hidden" name="<?php echo CSRF_TOKEN_NAME; ?>" value="<?php echo generateCSRFToken(); ?>">
                    <input type="hidden" name="plan_id" value="<?php echo $plan['id']; ?>">
                    
                    <div class="form-group">
                        <label for="name_plan" class="col-sm-3 control-label">Plan Name</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="name_plan" name="name_plan" 
                                   value="<?php echo htmlspecialchars($plan['name_plan']); ?>" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="price" class="col-sm-3 control-label">Price</label>
                        <div class="col-sm-9">
                            <div class="input-group">
                                <span class="input-group-addon">$</span>
                                <input type="number" step="0.01" class="form-control" id="price" name="price" 
                                       value="<?php echo $plan['price']; ?>" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="type" class="col-sm-3 control-label">Type</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="type" name="type" 
                                   value="<?php echo htmlspecialchars($plan['type']); ?>" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="col-sm-3 control-label">Radius Plan</label>
                        <div class="col-sm-9">
                            <div class="checkbox">
                                <label>
                                    <input type="checkbox" name="is_radius" value="1" 
                                           <?php echo $plan['is_radius'] ? 'checked' : ''; ?>>
                                    This is a RADIUS plan
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <?php if (in_array(getCurrentUser()['user_type'], ['SuperAdmin', 'Admin'])): ?>
                    <div class="form-group">
                        <label class="col-sm-3 control-label">Status</label>
                        <div class="col-sm-9">
                            <div class="checkbox">
                                <label>
                                    <input type="checkbox" name="enabled" value="1" 
                                           <?php echo $plan['enabled'] ? 'checked' : ''; ?>>
                                    Plan is enabled
                                </label>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <div class="form-group">
                        <div class="col-sm-offset-3 col-sm-9">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <a href="index.php?_route=plan/list" class="btn btn-default">Cancel</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        
        <?php if (!empty($recharges)): ?>
        <div class="panel panel-info">
            <div class="panel-heading">
                <h4 class="panel-title">Related Recharges</h4>
            </div>
            <div class="panel-body">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Status</th>
                            <th>Recharged On</th>
                            <th>Expiration</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recharges as $recharge): ?>
                        <tr>
                            <td><?php echo $recharge['customer_id']; ?></td>
                            <td>
                                <span class="label label-<?php echo $recharge['status'] == 'active' ? 'success' : 'default'; ?>">
                                    <?php echo htmlspecialchars($recharge['status']); ?>
                                </span>
                            </td>
                            <td><?php echo $recharge['recharged_on']; ?></td>
                            <td><?php echo $recharge['expiration']; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>
<?php $content = ob_get_clean(); include 'layout.php'; ?>
