FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build for production
RUN npm run build

ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
EXPOSE 3000

# Run production server (not dev)
CMD ["npm", "start"]
