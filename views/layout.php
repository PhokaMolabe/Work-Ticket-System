<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application</title>
    
    <!-- Bootstrap 3 CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css">
    
    <style>
        .navbar {
            margin-bottom: 20px;
        }
        .panel {
            margin-bottom: 20px;
        }
        .form-horizontal .control-label {
            text-align: right;
        }
        .btn-group {
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <?php if (isLoggedIn()): ?>
    <nav class="navbar navbar-default">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="index.php?_route=home">Application</a>
            </div>
            <div id="navbar" class="navbar-collapse collapse">
                <ul class="nav navbar-nav">
                    <li><a href="index.php?_route=plan/list">Plans</a></li>
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button">Settings <span class="caret"></span></a>
                        <ul class="dropdown-menu">
                            <li><a href="index.php?_route=settings/users-edit/<?php echo getCurrentUser()['id']; ?>">My Profile</a></li>
                            <?php if (in_array(getCurrentUser()['user_type'], ['Admin', 'SuperAdmin'])): ?>
                            <li><a href="index.php?_route=settings/users">Users</a></li>
                            <?php endif; ?>
                        </ul>
                    </li>
                </ul>
                <ul class="nav navbar-nav navbar-right">
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button">
                            <?php echo htmlspecialchars(getCurrentUser()['fullname']); ?> <span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a href="index.php?_route=settings/users-edit/<?php echo getCurrentUser()['id']; ?>">Profile</a></li>
                            <li role="separator" class="divider"></li>
                            <li><a href="index.php?_route=logout">Logout</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    <?php endif; ?>
    
    <div class="container">
        <?php if (isset($error)): ?>
        <div class="alert alert-danger">
            <?php echo htmlspecialchars($error); ?>
        </div>
        <?php endif; ?>
        
        <?php if (isset($success)): ?>
        <div class="alert alert-success">
            <?php echo htmlspecialchars($success); ?>
        </div>
        <?php endif; ?>
        
        <?php echo $content ?? ''; ?>
    </div>
    
    <!-- Bootstrap 3 JS -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</body>
</html>
