package com.fhi.fhirlearning.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fhi.fhirlearning.config.FhirProperties;
import com.fhi.fhirlearning.domain.learner.Learner;
import com.fhi.fhirlearning.repo.LearnerRepository;

/**
 * Ensures the demo learner has a usable email/password for first login.
 */
@Component
@Order(1)
public class AuthBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AuthBootstrap.class);

    private final LearnerRepository learnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final FhirProperties props;

    public AuthBootstrap(
            LearnerRepository learnerRepository,
            PasswordEncoder passwordEncoder,
            FhirProperties props
    ) {
        this.learnerRepository = learnerRepository;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = props.auth().demoEmail();
        String password = props.auth().demoPassword();

        Learner learner = learnerRepository.findById(props.demoLearnerId()).orElseGet(() -> {
            Learner created = new Learner();
            created.setId(props.demoLearnerId());
            created.setDisplayName("Demo Learner");
            created.setInitials("MR");
            created.setExternalRef("local-demo");
            return created;
        });

        boolean changed = false;
        if (learner.getEmail() == null || learner.getEmail().isBlank()) {
            learner.setEmail(email);
            changed = true;
        }
        if (learner.getPasswordHash() == null || learner.getPasswordHash().isBlank()
                || !passwordEncoder.matches(password, learner.getPasswordHash())) {
            // Keep demo password in sync with application.yml for local/dev
            learner.setPasswordHash(passwordEncoder.encode(password));
            changed = true;
        }
        if (learner.getRole() == null || learner.getRole().isBlank()) {
            learner.setRole("LEARNER");
            changed = true;
        }
        if (changed) {
            learnerRepository.save(learner);
            log.info("Demo learner ready — email={} (password from fhir.auth.demo-password)", learner.getEmail());
        }
    }
}
