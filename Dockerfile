# Railway Dockerfile v3 - No TypeScript build
FROM node:20-alpine

WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install only production dependencies first
RUN npm ci --only=production

# Install dev dependencies for build
RUN npm install typescript @types/node vite vite-plugin-solid

# Copy source
COPY . .

# Build with explicit commands
RUN npx tsc && npx vite build

# Remove dev dependencies
RUN npm prune --production

# Copy simple server
COPY simple-server.js ./

EXPOSE 3000

CMD ["node", "simple-server.js"]