package com.fhi.fhirlearning.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.util.StringUtils;

/**
 * Ensures the target PostgreSQL database exists before Hikari/Flyway connect.
 * Connects to the maintenance DB ({@code postgres}) and runs {@code CREATE DATABASE} if needed.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CreateDatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(CreateDatabaseEnvironmentPostProcessor.class);
    private static final Pattern JDBC_URL = Pattern.compile(
            "^jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+)(.*)$"
    );

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("spring.datasource.url");
        String username = environment.getProperty("spring.datasource.username");
        String password = environment.getProperty("spring.datasource.password", "");

        if (!StringUtils.hasText(url) || !url.startsWith("jdbc:postgresql:")) {
            return;
        }

        Matcher m = JDBC_URL.matcher(url);
        if (!m.matches()) {
            log.warn("Could not parse datasource URL for auto-create DB: {}", url);
            return;
        }

        String host = m.group(1);
        String port = m.group(2) != null ? m.group(2) : "5432";
        String dbName = m.group(3);
        String query = m.group(4) != null ? m.group(4) : "";

        if ("postgres".equalsIgnoreCase(dbName)) {
            return;
        }

        String baseUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;
        try (Connection conn = DriverManager.getConnection(baseUrl, username, password);
             Statement st = conn.createStatement()) {
            st.execute("CREATE SCHEMA IF NOT EXISTS academy");
            log.info("PostgreSQL database '{}' is reachable; schema academy is ready", dbName);
            return;
        } catch (SQLException ignored) {
            // Fall through and try CREATE DATABASE via the maintenance DB.
        }

        String adminUrl = "jdbc:postgresql://" + host + ":" + port + "/postgres" + query;

        try {
            ensureDatabase(adminUrl, username, password, dbName);
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "Could not create database '" + dbName + "'. "
                            + "Is PostgreSQL running on " + host + ":" + port + "? "
                            + "User '" + username + "' needs CREATEDB (or use the postgres superuser). "
                            + "Cause: " + e.getMessage(),
                    e
            );
        }
    }

    private void ensureDatabase(String adminUrl, String username, String password, String dbName)
            throws SQLException {
        try (Connection conn = DriverManager.getConnection(adminUrl, username, password);
             Statement st = conn.createStatement()) {

            boolean exists;
            try (ResultSet rs = st.executeQuery(
                    "SELECT 1 FROM pg_database WHERE datname = '" + escapeLiteral(dbName) + "'")) {
                exists = rs.next();
            }

            if (exists) {
                log.info("PostgreSQL database '{}' already exists", dbName);
                return;
            }

            // Identifiers cannot be parameterized; db name comes from our own config.
            st.executeUpdate("CREATE DATABASE \"" + escapeIdent(dbName) + "\"");
            log.info("Created PostgreSQL database '{}'", dbName);
        }
    }

    private static String escapeLiteral(String value) {
        return value.replace("'", "''");
    }

    private static String escapeIdent(String value) {
        return value.replace("\"", "\"\"");
    }
}
