# ============================================================
# Stage 1 — Build
# ============================================================
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn -B dependency:go-offline

COPY src ./src

RUN mvn -B clean package -DskipTests


# ============================================================
# Stage 2 — Healthcheck utility
# ============================================================
FROM busybox:1.36-musl AS busybox


# ============================================================
# Stage 3 — Runtime Distroless
# ============================================================
FROM gcr.io/distroless/java17-debian13:nonroot

WORKDIR /app

COPY --from=build /app/target/*.jar /app/app.jar

# Petit utilitaire statique uniquement pour le healthcheck
COPY --from=busybox /bin/busybox /busybox

EXPOSE 8080

USER nonroot:nonroot

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
  CMD ["/busybox", "wget", "-q", "-O", "-", "http://127.0.0.1:8080/actuator/health"]