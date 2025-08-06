# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the React application for production
RUN npm run build

# Stage 2: Serve the built application with a lightweight server
FROM alpine:latest

# Install Node.js and npm (needed for 'serve' package)
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy the built React app from the builder stage
COPY --from=builder /app/build ./build

# Install 'serve' globally to serve static files
RUN npm install -g serve

# Expose the port where the app will be served
EXPOSE 3000

# Command to serve the built React application
# The -s flag ensures it serves a single-page application (SPA)
# The -l 3000 flag specifies the port to listen on
CMD ["serve", "-s", "build", "-l", "3000"]
