# Use Node.js 18 LTS as the base image
# Node 18 is the current LTS (Long Term Support) release with excellent stability
# The 'alpine' variant is a minimal Linux distribution that keeps image size small
FROM node:18-alpine

# Set the working directory where all commands will execute
WORKDIR /app

# Copy package files first for better layer caching
# These files change less frequently than source code
# By copying them first, we can cache the npm install layer
COPY package.json package-lock.json ./

# Install dependencies
# npm ci is preferred over npm install for CI/CD and containers because:
# - It's faster (sometimes 2-3x) especially with a clean slate
# - It strictly follows package-lock.json versions
# - It fails if package.json and package-lock.json are out of sync
# - It automatically removes node_modules before installing
RUN npm ci

# Copy the rest of the application code
# This layer rebuilds whenever any source file changes
COPY . .

# Expose port 3000 where React development server runs
# This is documentation and doesn't actually publish the port
EXPOSE 3000

# Start the React development server
# The development server provides hot module replacement
# Changes to source files trigger automatic reloading
CMD ["npm", "start"]
