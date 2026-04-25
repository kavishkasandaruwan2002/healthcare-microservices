#!/bin/bash
# Microservices Build Script

echo "Building all microservices..."

# Build Java services
mvn clean package -DskipTests

# Build Frontend
cd client && npm install && npm run build && cd ..

# Build Docker images
docker-compose build

echo "Build complete."
