#!/bin/sh

# Loop through all arguments as host:port pairs
for service in "$@"; do
  host=$(echo "$service" | cut -d: -f1)
  port=$(echo "$service" | cut -d: -f2)

  echo "Waiting for $host:$port to be available..."

  while ! nc -z "$host" "$port"; do
    sleep 1
  done

  echo "$host:$port is available."
done

# Fix permissions on uploads directory
echo "Fixing permissions for /var/www/uploads..."
chown -R www-data:www-data /var/www/uploads
chmod -R 755 /var/www/uploads

# Start Nginx
echo "All services are up. Starting Nginx..."
echo "\nLocalhost -> https://localhost:8443"
exec nginx -g "daemon off;"
