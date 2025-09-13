FROM node:20-alpine

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

RUN apk add --no-cache sqlite

COPY . .
RUN npm run build

EXPOSE 5501

CMD ["node", "dist/server.js"]