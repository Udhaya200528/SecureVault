FROM maven:3.9.9-eclipse-temurin-17

WORKDIR /app

COPY backend/pom.xml .

RUN mvn dependency:go-offline

COPY backend/src ./src

RUN mvn clean package -DskipTests

CMD ["java","-jar","target/*.jar"]