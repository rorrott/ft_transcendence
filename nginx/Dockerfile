FROM nginx:latest

# Remove default NGINX config
RUN rm /etc/nginx/conf.d/default.conf || true

# Use your custom nginx.conf in the correct place
COPY nginx/conf/nginx.conf /etc/nginx/nginx.conf

# Install dependencies for wait-for-service and SSL
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    openssl \
 && rm -rf /var/lib/apt/lists/*

# Create SSL directory and self-signed certificate
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/ft_transcendence.key \
  -out /etc/nginx/ssl/ft_transcendence.crt \
  -subj "/C=MO/ST=IDF/L=Paris/O=LocalDev/CN=localhost"

# Clean out NGINX default HTML files
RUN rm -rf /usr/share/nginx/html/* /usr/share/nginx/html/.??*

# Copy wait-for-service script
COPY nginx/wait-for-service.sh /wait-for-service.sh
RUN chmod +x /wait-for-service.sh

EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]

