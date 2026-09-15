package cm.procv;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest(properties = {"JWT_SECRET=test-secret-for-automated-tests-only-12345678901234567890", "JWT_EXPIRATION_MS=86400000"})
class ProcvApplicationTests {

    @Container
    static final MySQLContainer<?> mysql =
            new MySQLContainer<>("mysql:8.4")
                    .withDatabaseName("procv_test")
                    .withUsername("procv_test")
                    .withPassword("procv_test");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("DB_HOST", mysql::getHost);
        registry.add("DB_PORT", () -> mysql.getMappedPort(3306).toString());
        registry.add("DB_NAME", () -> "procv_test");
        registry.add("DB_USER", () -> "procv_test");
        registry.add("DB_PASSWORD", () -> "procv_test");
    }

    @Test
    void contextLoads() {
    }
}