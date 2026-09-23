package com.fhi.fhirlearning;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FhirLearningApplication {

    public static void main(String[] args) {
        SpringApplication.run(FhirLearningApplication.class, args);
    }
}
