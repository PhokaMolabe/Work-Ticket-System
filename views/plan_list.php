<?php ob_start(); ?>
<div class="row">
    <div class="col-md-12">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Plans</h3>
            </div>
            <div class="panel-body">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Plan Name</th>
                            <th>Price</th>
                            <th>Type</th>
                            <th>Radius</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($plans as $plan): ?>
                        <tr>
                            <td><?php echo $plan['id']; ?></td>
                            <td><?php echo htmlspecialchars($plan['name_plan']); ?></td>
                            <td>$<?php echo number_format($plan['price'], 2); ?></td>
                            <td><?php echo htmlspecialchars($plan['type']); ?></td>
                            <td>
                                <?php if ($plan['is_radius']): ?>
                                    <span class="label label-success">Yes</span>
                                <?php else: ?>
                                    <span class="label label-default">No</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($plan['enabled']): ?>
                                    <span class="label label-success">Enabled</span>
                                <?php else: ?>
                                    <span class="label label-danger">Disabled</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (hasPermission('plan_edit', ['plan_enabled' => $plan['enabled']])): ?>
                                    <a href="index.php?_route=plan/edit/<?php echo $plan['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                                <?php else: ?>
                                    <span class="text-muted">No Access</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php $content = ob_get_clean(); include 'layout.php'; ?>
