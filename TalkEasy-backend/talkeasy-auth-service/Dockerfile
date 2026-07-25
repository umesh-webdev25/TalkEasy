FROM node:20-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY talkeasy-auth-service/package.json ./talkeasy-auth-service/

# Install dependencies
RUN npm ci

# Copy source code
COPY shared/ ./shared/
COPY talkeasy-auth-service/ ./talkeasy-auth-service/

# Set working directory to the service
WORKDIR /app/talkeasy-auth-service

EXPOSE 3001

CMD ["npm", "start"]
