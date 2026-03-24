$services = @('gateway', 'auth-service', 'patient-service', 'doctor-service', 'appointment-service', 'payment-service', 'notification-service', 'telemedicine-service', 'ai-service', 'client')
$infra = @('mysql', 'mongo', 'rabbitmq')

function Get-Deployment($name, $image, $port, $envVars=@()) {
    $envStr = ""
    foreach ($env in $envVars) {
        $envStr += "`n        - name: $($env.Name)`n          value: $($env.Value)"
    }
    
    return @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $name
  namespace: healthcare
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $name
  template:
    metadata:
      labels:
        app: $name
    spec:
      containers:
      - name: $name
        image: healthcare/$name:latest
        ports:
        - containerPort: $port$envStr
"@
}

function Get-Service($name, $port) {
    return @"
apiVersion: v1
kind: Service
metadata:
  name: $name
  namespace: healthcare
spec:
  selector:
    app: $name
  ports:
  - protocol: TCP
    port: $port
    targetPort: $port
"@
}

foreach ($svc in $services) {
    $port = 8080
    if ($svc -eq 'client') { $port = 3000 }
    if ($svc -eq 'ai-service') { $port = 5000 }
    
    $deployment = Get-Deployment $svc "healthcare/$svc:latest" $port
    $service = Get-Service $svc $port
    
    Set-Content -Path "k8s/$svc-deployment.yaml" -Value $deployment
    Set-Content -Path "k8s/$svc-service.yaml" -Value $service
}

# Infra
foreach ($inf in $infra) {
    $port = 3306
    if ($inf -eq 'mongo') { $port = 27017 }
    if ($inf -eq 'rabbitmq') { $port = 5672 }
    
    $deployment = Get-Deployment $inf $inf $port
    $service = Get-Service $inf $port
    
    Set-Content -Path "k8s/$inf-deployment.yaml" -Value $deployment
    Set-Content -Path "k8s/$inf-service.yaml" -Value $service
}

# Configs & Ingress
Set-Content -Path "k8s/ingress.yaml" -Value @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: healthcare-ingress
  namespace: healthcare
spec:
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: gateway
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: client
            port:
              number: 3000
"@
