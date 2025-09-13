FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl
RUN apk add --no-cache openssl

# Copy only what's needed to install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

RUN chmod +x node_modules/.bin/vite

# Generate self-signed cert for localhost
RUN mkdir -p /app/certs \
 && openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
    -subj "/CN=localhost" \
    -keyout /app/certs/localhost-key.pem \
    -out /app/certs/localhost.pem \
    -days 3650

# Write the build-id.js file
ARG BUILD_DATE
RUN mkdir -p /app/dist && echo "window.buildId = '${BUILD_DATE}';" > /app/dist/build-id.js

EXPOSE 3000

# Build the production-ready frontend
CMD [ "npm", "run", "dev" ]