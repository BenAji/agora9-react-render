# Multi-stage build for AGORA React App with Outlook Add-in support

# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app and copy Outlook files
RUN npm run build:outlook

# Stage 2: Production server
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/build ./build

# Copy server file
COPY server.js ./

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Set PORT environment variable (Cloud Run uses 8080 by default)
ENV PORT=8080

# Start the server
CMD ["node", "server.js"]
