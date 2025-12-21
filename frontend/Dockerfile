# Base image for Node.js
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source code
COPY . .

# Build the React app
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]