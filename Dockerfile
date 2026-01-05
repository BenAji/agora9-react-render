# Multi-stage build for AGORA React App with Outlook Add-in support

# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_ENVIRONMENT=production
ARG REACT_APP_WEATHER_API_KEY

# Set environment variables for the build
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV REACT_APP_WEATHER_API_KEY=$REACT_APP_WEATHER_API_KEY

# Build the React app and copy Outlook files
RUN npm run build:outlook

# Stage 2: Production server
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

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
