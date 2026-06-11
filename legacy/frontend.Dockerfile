# Tahap Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package info dan install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy seluruh source code frontend
COPY frontend/ .

# Build project menjadi file statis
RUN npm run build

# Tahap Run (Nginx)
FROM nginx:alpine

# Copy hasil build ke folder Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file konfigurasi Nginx custom untuk reverse proxy ke backend
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
