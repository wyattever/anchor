# Cloud SQL Auth Proxy Configuration for Cloud Run

This document outlines the configuration required to connect the PHP backend to a Cloud SQL instance using the Cloud SQL Auth Proxy sidecar on Cloud Run.

## 1. Cloud Run Service Configuration (`service.yaml`)

To enable the Cloud SQL Auth Proxy, add the following annotation to the `template` metadata in your `service.yaml`:

```yaml
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: acp-vertex-core:us-central1:INSTANCE_NAME
```

## 2. Unix Socket Path Format

When the Cloud SQL Auth Proxy is enabled, the Unix socket will be automatically created at the following path:

`/cloudsql/acp-vertex-core:us-central1:INSTANCE_NAME`

## 3. Volume Mount Configuration

While Cloud Run handles the sidecar automatically via the annotation, you must ensure the container can access the `/cloudsql` directory. In the `containers` spec:

```yaml
spec:
  containers:
  - image: gcr.io/acp-vertex-core/anchor-php:latest
    volumeMounts:
    - mountPath: /cloudsql
      name: cloudsql-unix-socket
  volumes:
  - name: cloudsql-unix-socket
    emptyDir: {}
```

*Note: For Cloud Run, explicitly defining volumes for `/cloudsql` is often handled by the runtime when the annotation is present, but explicitly defining it ensures compatibility and clarity.*

## 4. PHP PDO Connection String

To connect via the Unix socket in PHP, use the following DSN format for `PDO`:

```php
$dsn = "mysql:unix_socket=/cloudsql/acp-vertex-core:us-central1:INSTANCE_NAME;dbname=YOUR_DATABASE_NAME";
$user = "YOUR_DB_USER";
$pass = "YOUR_DB_PASSWORD";

try {
    $pdo = new PDO($dsn, $user, $pass);
} catch (PDOException $e) {
    throw new PDOException($e->getMessage(), (int)$e->getCode());
}
```

## 5. Required Environment Variables

Ensure the following environment variable is set in the `service.yaml` to trigger the correct connection logic in the application:

```yaml
env:
- name: DB_CONNECTION_TYPE
  value: unix-socket
```
