# Use official Node.js image with necessary tooling
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and tsconfig
COPY package.json tsconfig.json ./

# Install dependencies
RUN npm install
# install  sqlite
RUN apk add sqlite

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose port
EXPOSE 5600

# Start the application
CMD ["npm", "start"]