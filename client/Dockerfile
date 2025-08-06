# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

# Declare build argument for the server URL.
# This allows you to pass REACT_APP_SERVER_URL during the Docker build.
ARG REACT_APP_SERVER_URL

# Set the build argument as an environment variable.
# Create React App's 'npm run build' command will read this ENV variable
# and inline its value into the JavaScript bundle.
ENV REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
# Ensure your .env file is NOT ignored by .dockerignore if you use it for other vars
COPY . .

# Build the React application for production.
# At this step, the REACT_APP_SERVER_URL from the ENV instruction above
# will be used and hardcoded into the client's JavaScript.
RUN npm run build

# Stage 2: Serve the built application with a lightweight server
FROM alpine:latest

# Install Node.js and npm (needed for 'serve' package)
# We need Node.js and npm in the final stage to run the 'serve' package.
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy the built React app from the builder stage
COPY --from=builder /app/build ./build

# Install 'serve' globally to serve static files
RUN npm install -g serve

# Expose the port where the app will be served
EXPOSE 3000

# Command to serve the built React application.
# The -s flag ensures it serves a single-page application (SPA)
# The -l 3000 flag specifies the port to listen on
CMD ["serve", "-s", "build", "-l", "3000"]
