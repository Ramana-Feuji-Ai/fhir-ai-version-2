package com.fhi.fhirlearning.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fhi.fhirlearning.service.AuthService;
import com.fhi.fhirlearning.web.dto.AuthDtos.AuthResponse;
import com.fhi.fhirlearning.web.dto.AuthDtos.LearnerMeDto;
import com.fhi.fhirlearning.web.dto.AuthDtos.LoginRequest;
import com.fhi.fhirlearning.web.dto.AuthDtos.RegisterRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest body) {
        return authService.register(body);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest body) {
        return authService.login(body);
    }

    @GetMapping("/me")
    public LearnerMeDto me() {
        return authService.me();
    }
}
