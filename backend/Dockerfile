FROM maven:3.9.9-eclipse-temurin-17

WORKDIR /app

COPY backend ./backend

WORKDIR /app/backend

RUN mvn clean package -DskipTests

CMD ["sh", "-c", "java -jar target/*.jar"]