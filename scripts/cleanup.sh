#!/bin/bash
# Cleanup Script

echo "Cleaning up local environment..."
docker-compose down -v

echo "Cleaning up Kubernetes..."
kubectl delete namespace healthcare

echo "Cleanup complete."
