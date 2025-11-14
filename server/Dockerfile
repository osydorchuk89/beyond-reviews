# Use official Node.js base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json prisma ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the necessary port
EXPOSE 8080

# Define the start command
CMD ["npm", "run", "start"]