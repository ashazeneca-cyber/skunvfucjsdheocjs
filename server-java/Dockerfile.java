FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/rapsonyx-java-server-1.0.0.jar app.jar
ENV PORT=7860
EXPOSE 7860
CMD ["java", "-jar", "app.jar"]
