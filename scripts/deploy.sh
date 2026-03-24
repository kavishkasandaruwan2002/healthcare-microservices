#!/bin/bash
# Kubernetes Deployment Script

echo "Deploying to Kubernetes..."

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/

echo "Deployment complete. Use 'kubectl get pods -n healthcare' to check status."
