package com.fhi.fhirlearning.security;

import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static LearnerPrincipal requirePrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof LearnerPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        return principal;
    }

    public static UUID requireLearnerId() {
        return requirePrincipal().getId();
    }

    public static String initialsFromName(String displayName) {
        if (displayName == null || displayName.isBlank()) {
            return "LR";
        }
        String[] parts = displayName.trim().split("\\s+");
        if (parts.length == 1) {
            String p = parts[0];
            return p.substring(0, Math.min(2, p.length())).toUpperCase(Locale.ROOT);
        }
        String a = parts[0].substring(0, 1);
        String b = parts[parts.length - 1].substring(0, 1);
        return (a + b).toUpperCase(Locale.ROOT);
    }
}
