package com.fhi.fhirlearning.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.fhi.fhirlearning.repo.LearnerRepository;

@Service
public class LearnerUserDetailsService implements UserDetailsService {

    private final LearnerRepository learnerRepository;

    public LearnerUserDetailsService(LearnerRepository learnerRepository) {
        this.learnerRepository = learnerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return learnerRepository.findByEmailIgnoreCase(username.trim())
                .map(LearnerPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("No learner for email: " + username));
    }
}
