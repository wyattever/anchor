<?php
/**
 * Test only — not for production deployment.
 * 
 * This script tests a PDO connection using a Unix socket path provided via environment variables.
 * Usage: DB_HOST=/cloudsql/PROJ:REG:INST DB_NAME=db DB_USER=user DB_PASS=pass php db-connection-test.php
 */

$host = getenv('DB_HOST'); // Unix socket path
$dbname = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');

if (!$host || !$dbname || !$user) {
    die("Error: Missing required environment variables (DB_HOST, DB_NAME, DB_USER).\n");
}

// Construct DSN for Unix socket
$dsn = "mysql:unix_socket={$host};dbname={$dbname}";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    echo "Connection successful\n";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
