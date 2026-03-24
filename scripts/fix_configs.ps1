$services = @('auth-service', 'patient-service', 'doctor-service', 'appointment-service', 'payment-service', 'notification-service', 'telemedicine-service')
foreach ($svc in $services) {
    $dir = "services/$svc/src/main/resources"
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $yml = @"
server:
  port: 8080

spring:
  application:
    name: $svc
  datasource:
    url: jdbc:mysql://mysql:3306/$($svc.Replace('-','_'))
    username: root
    password: password
  data:
    mongodb:
      uri: mongodb://mongo:27017/$($svc.Replace('-','_'))

eureka:
  client:
    serviceUrl:
      defaultZone: http://eureka:8761/eureka/

management:
  endpoints:
    web:
      exposure:
        include: "*"
"@
    Set-Content -Path "$dir/application.yml" -Value $yml
}

# Integrations
$integrations = @(
    @('payment-service', 'StripePaymentService', 'public void processPayment() { System.out.println("Processing Stripe Payment..."); }'),
    @('telemedicine-service', 'AgoraVideoService', 'public void createRoom() { System.out.println("Creating Agora Video Room..."); }'),
    @('notification-service', 'EmailSmsService', 'public void sendNotification() { System.out.println("Sending Email/SMS..."); }')
)

foreach ($int in $integrations) {
    $svc = $int[0]
    $className = $int[1]
    $method = $int[2]
    $packageSvc = $svc.Replace("-", "")
    $dir = "services/$svc/src/main/java/com/healthcare/$packageSvc/integration"
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $code = @"
package com.healthcare.$packageSvc.integration;

public class $className {
    $method
}
"@
    Set-Content -Path "$dir/$className.java" -Value $code
}
