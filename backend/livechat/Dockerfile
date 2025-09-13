FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY . .
COPY frontend/ ./frontend/
RUN npm run build

EXPOSE 6002

CMD ["node", "dist/server.js"]