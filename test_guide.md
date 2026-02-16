# Testing Guide

## Quick Start

### Option 1: Using PHP Built-in Server (Recommended)

1. **Start the server:**
   ```bash
   cd C:\Users\phoka\OneDrive\Desktop\CascadeProjects
   php start_server.php
   ```
   OR manually:
   ```bash
   php -S localhost:8000 -t . index.php
   ```

2. **Open browser:** Navigate to `http://localhost:8000`

### Option 2: Using XAMPP/WAMP

1. Place project in htdocs/www folder
2. Start Apache and MySQL
3. Navigate to `http://localhost/your-project-folder`

## Testing Steps

### 1. Database Setup
```bash
mysql -u root -p < database.sql
```

### 2. Test Login with Different Roles

**Demo Accounts (password: `password` for all):**
- **SuperAdmin**: `superadmin` - Full access
- **Admin**: `admin` - Can manage users and plans  
- **Agent**: `agent` - Can manage enabled plans and users in tree
- **Sales1**: `sales1` - Limited access, reports to agent
- **Sales2**: `sales2` - Limited access, reports to agent

### 3. Test Permission Enforcement

#### Plan Edit Permissions:
1. **Login as SuperAdmin/Admin:**
   - Can edit any plan (enabled or disabled)
   - URL: `http://localhost:8000/?_route=plan/edit/1` (enabled)
   - URL: `http://localhost:8000/?_route=plan/edit/3` (disabled)

2. **Login as Agent:**
   - Can only edit enabled plans
   - Try: `http://localhost:8000/?_route=plan/edit/1` ✅ Should work
   - Try: `http://localhost:8000/?_route=plan/edit/3` ❌ Should show permission error

3. **Login as Sales1:**
   - Can only edit enabled plans
   - Try: `http://localhost:8000/?_route=plan/edit/1` ✅ Should work
   - Try: `http://localhost:8000/?_route=plan/edit/3` ❌ Should show permission error

#### User Edit Permissions:
1. **Login as SuperAdmin/Admin:**
   - Can edit any user
   - Try editing different users via Settings menu

2. **Login as Agent:**
   - Can edit users in their tree (sales1, sales2)
   - Try: `http://localhost:8000/?_route=settings/users-edit/4` (sales1) ✅
   - Try: `http://localhost:8000/?_route=settings/users-edit/2` (admin) ❌

3. **Login as Sales1:**
   - Can only edit themselves
   - Try: `http://localhost:8000/?_route=settings/users-edit/4` (self) ✅
   - Try: `http://localhost:8000/?_route=settings/users-edit/5` (sales2) ❌

### 4. Test URL Bypass Protection

Try accessing restricted URLs directly:
- Login as Sales, then directly visit admin URLs
- Try POST requests without proper permissions
- Verify "You do not have permission to access this page" message

### 5. Test Security Features

1. **CSRF Protection:**
   - View page source to see CSRF tokens in forms
   - Try submitting forms without tokens (should fail)

2. **Input Validation:**
   - Try invalid email formats in user edit
   - Try invalid phone numbers
   - Try SQL injection attempts

3. **Password Security:**
   - Change passwords - verify they're hashed in database

### 6. Run Automated Tests

```bash
php test_permissions.php
```

This will test:
- All user roles and their permissions
- CSRF token generation
- Input validation functions
- Database connectivity

## Expected Results

✅ **Success Indicators:**
- All demo accounts can login
- Permission restrictions work correctly
- Bootstrap 3 layout displays properly
- Forms submit successfully with proper validation
- CSRF protection active
- Database operations work

❌ **Failure Indicators:**
- Database connection errors
- Permission bypasses
- Missing Bootstrap styling
- Form submission errors
- Security vulnerabilities

## Troubleshooting

### Database Issues:
- Check MySQL is running
- Verify credentials in `config.php`
- Ensure database was created: `mysql -u root -p -e "SHOW DATABASES;"`

### Server Issues:
- Check PHP is installed: `php --version`
- Verify port 8000 is not in use
- Check file permissions

### Permission Issues:
- Clear browser cookies/sessions
- Verify user data in database
- Check session configuration

## Browser Testing

Test in multiple browsers:
- Chrome/Chromium
- Firefox  
- Edge
- Safari (if available)

Verify responsive design by resizing browser window.
