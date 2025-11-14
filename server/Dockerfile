# Use official Node.js base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies to leverage Docker cache
RUN npm install

# Copy prisma schema and source code
COPY prisma ./prisma/
COPY . .

# Build TypeScript
RUN npm run build

# Expose the necessary port
EXPOSE 8080

# Define the start command
CMD ["npm", "run", "start"]