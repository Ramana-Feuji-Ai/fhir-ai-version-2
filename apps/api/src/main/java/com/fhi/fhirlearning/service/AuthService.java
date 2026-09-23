package com.fhi.fhirlearning.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fhi.fhirlearning.domain.learner.Learner;
import com.fhi.fhirlearning.repo.LearnerRepository;
import com.fhi.fhirlearning.security.JwtService;
import com.fhi.fhirlearning.security.LearnerPrincipal;
import com.fhi.fhirlearning.security.SecurityUtils;
import com.fhi.fhirlearning.web.dto.AuthDtos.AuthResponse;
import com.fhi.fhirlearning.web.dto.AuthDtos.LearnerMeDto;
import com.fhi.fhirlearning.web.dto.AuthDtos.LoginRequest;
import com.fhi.fhirlearning.web.dto.AuthDtos.RegisterRequest;

@Service
public class AuthService {

    private final LearnerRepository learnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            LearnerRepository learnerRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.learnerRepository = learnerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (learnerRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        Learner learner = new Learner();
        learner.setEmail(email);
        learner.setDisplayName(req.displayName().trim());
        learner.setInitials(SecurityUtils.initialsFromName(req.displayName()));
        learner.setPasswordHash(passwordEncoder.encode(req.password()));
        learner.setRole("LEARNER");
        learnerRepository.save(learner);
        LearnerPrincipal principal = new LearnerPrincipal(learner);
        return tokenResponse(principal);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email().trim(), req.password())
        );
        LearnerPrincipal principal = (LearnerPrincipal) authentication.getPrincipal();
        return tokenResponse(principal);
    }

    @Transactional(readOnly = true)
    public LearnerMeDto me() {
        return toMe(SecurityUtils.requirePrincipal());
    }

    private AuthResponse tokenResponse(LearnerPrincipal principal) {
        return new AuthResponse(jwtService.createToken(principal), "Bearer", toMe(principal));
    }

    private static LearnerMeDto toMe(LearnerPrincipal p) {
        return new LearnerMeDto(
                p.getId().toString(),
                p.getEmail(),
                p.getDisplayName(),
                p.getInitials(),
                p.getRole()
        );
    }
}
