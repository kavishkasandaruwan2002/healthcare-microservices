# Production-ready Run Stage
FROM eclipse-temurin:17-jdk
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Copy the locally built JAR file into the container
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
