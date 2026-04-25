$services = @('gateway', 'auth-service', 'patient-service', 'doctor-service', 'appointment-service', 'payment-service', 'notification-service', 'telemedicine-service')

function Get-Pom($svc) {
    if ($svc -eq 'gateway') {
        $extraDep = "<dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-gateway</artifactId></dependency>"
    } else {
        $extraDep = ""
    }
    
    return @"
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.healthcare</groupId>
  <artifactId>$svc</artifactId>
  <version>1.0.0</version>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.5</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    $extraDep
  </dependencies>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-dependencies</artifactId>
        <version>2021.0.3</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
"@
}

$dockerfile = @'
# Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
'@

foreach ($svc in $services) {
    if ($svc -eq 'gateway') { $dir = 'gateway' } else { $dir = "services/$svc" }
    
    # POM
    $pom = Get-Pom $svc
    Set-Content -Path "$dir/pom.xml" -Value $pom
    
    # Dockerfile
    Set-Content -Path "$dir/Dockerfile" -Value $dockerfile
}
