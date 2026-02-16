<?php
// Simple PHP development server starter, Used to start the built-in PHP server

echo "Starting PHP Development Server...\n";
echo "Server will be available at: http://localhost:8000\n";
echo "Press Ctrl+C to stop the server\n\n";

// Start the built-in PHP server
$command = 'php -S localhost:8000 -t . index.php';
echo "Executing: $command\n";
passthru($command);
?>
