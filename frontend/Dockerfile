# Base image for Node.js
FROM node:20-alpine

# Set working directory
WORKDIR /app

RUN corepack enable && corepack prepare yarn@stable --activate

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy app source code
COPY . .

# Build the React app
RUN yarn build

# Expose the frontend port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]