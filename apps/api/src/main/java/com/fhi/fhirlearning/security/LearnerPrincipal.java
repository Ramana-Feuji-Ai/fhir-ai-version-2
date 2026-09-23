package com.fhi.fhirlearning.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fhi.fhirlearning.domain.learner.Learner;

public class LearnerPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final String displayName;
    private final String initials;
    private final String role;

    public LearnerPrincipal(Learner learner) {
        this.id = learner.getId();
        this.email = learner.getEmail();
        this.passwordHash = learner.getPasswordHash();
        this.displayName = learner.getDisplayName();
        this.initials = learner.getInitials();
        this.role = learner.getRole() == null ? "LEARNER" : learner.getRole();
    }

    public UUID getId() { return id; }
    public String getDisplayName() { return displayName; }
    public String getInitials() { return initials; }
    public String getRole() { return role; }
    public String getEmail() { return email; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return passwordHash != null && !passwordHash.isBlank(); }
}
