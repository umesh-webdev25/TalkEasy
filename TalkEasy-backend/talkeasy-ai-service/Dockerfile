FROM node:20-alpine

WORKDIR /app

# Install system dependencies for audio processing / image manipulation if needed
RUN apk add --no-cache ffmpeg

# Copy root package.json and workspace configuration
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY talkeasy-ai-service/package.json ./talkeasy-ai-service/

# Install dependencies
RUN npm ci

# Copy source code
COPY shared/ ./shared/
COPY talkeasy-ai-service/ ./talkeasy-ai-service/

# Set working directory to the service
WORKDIR /app/talkeasy-ai-service

EXPOSE 3002

CMD ["npm", "start"]
