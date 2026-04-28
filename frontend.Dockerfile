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

# Copy file konfigurasi Nginx (opsional, jika butuh routing SPA)
# Dalam kasus ini default Nginx cukup karena tidak pakai React Router history mode rumit

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
