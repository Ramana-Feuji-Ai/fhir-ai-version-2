import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { CurriculumApi } from './curriculum.api';
import { ConversationLibrary } from './conversation.library';
import { TopicDetail, Slide, PhaseDetail, PhaseResources, TopicSummary } from './models';

@Injectable({ providedIn: 'root' })
export class MockDataEnhancer {
  private readonly api = inject(CurriculumApi);
  private readonly conversations = inject(ConversationLibrary);

  /** Enhance topic with Maya/Alex conversation lessons and interactive slides */
  enhanceTopic(topicId: number): Observable<TopicDetail> {
    return this.api.topic(topicId).pipe(
      switchMap(topic => {
        if (!topic.slides.length) return of(topic);
        const lesson = this.conversations.forTopic(topic.id);

        const enhancedSlides: Slide[] = topic.slides.map((slide, index) => {
          const enhanced: Slide = { ...slide };

          if (index === 0 && lesson) {
            enhanced.conversation = lesson;
            enhanced.videoTitle = `${lesson.title} — Maya & Alex`;
          }

          const interactiveType = this.getInteractiveType(slide.title, index, topic.slides.length);
          if (interactiveType) {
            enhanced.interactiveType = interactiveType;
            enhanced.interactiveData = this.getInteractiveData(interactiveType, slide.title, topic.title);
          }

          return enhanced;
        });

        return of({ ...topic, slides: enhancedSlides });
      })
    );
  }

  /** Enhance phase with mock resources if empty, and add video/interactive flags to topics */
  enhancePhase(phaseId: number): Observable<PhaseDetail> {
    return this.api.phase(phaseId).pipe(
      switchMap(phase => {
        const resources = phase.resources;
        const hasContent = resources.specs.length || resources.examples.length || resources.lab || resources.quiz.length;
        
        // Enhance topic summaries with video/interactive flags (heuristic based on title/slideCount)
        const enhancedSections = phase.sections.map(section => ({
          ...section,
          topics: section.topics.map(topic => ({
            ...topic,
            hasVideo: !!this.conversations.forTopic(topic.id) || this.hasVideoHeuristic(topic),
            hasInteractive: this.hasInteractiveHeuristic(topic)
          }))
        }));
        
        const phaseWithEnhancedTopics = { ...phase, sections: enhancedSections };
        
        if (hasContent) return of(phaseWithEnhancedTopics);
        
        // Add mock resources for phases that don't have them
        const mockResources: PhaseResources = {
          specs: this.getMockSpecs(phase.id),
          examples: this.getMockExamples(phase.id),
          lab: this.getMockLab(phase.id),
          quiz: this.getMockQuiz(phase.id)
        };
        
        return of({ ...phaseWithEnhancedTopics, resources: mockResources });
      })
    );
  }

  private hasVideoHeuristic(topic: TopicSummary): boolean {
    const lower = topic.title.toLowerCase();
    return lower.includes('video') || lower.includes('overview') || lower.includes('introduction') || 
           lower.includes('demo') || lower.includes('walkthrough') || topic.slideCount >= 4;
  }

  private hasInteractiveHeuristic(topic: TopicSummary): boolean {
    const lower = topic.title.toLowerCase();
    return lower.includes('lab') || lower.includes('practice') || lower.includes('exercise') ||
           lower.includes('quiz') || lower.includes('exam') || lower.includes('code') ||
           lower.includes('fhirpath') || lower.includes('cql') || topic.slideCount >= 5;
  }

  private getInteractiveType(title: string, index: number, total: number): 'quiz' | 'lab' | 'code' | 'diagram' | 'scenario' | null {
    const lower = title.toLowerCase();
    if (lower.includes('quiz') || lower.includes('exam') || lower.includes('practice')) return 'quiz';
    if (lower.includes('lab') || lower.includes('hands-on') || lower.includes('exercise')) return 'lab';
    if (lower.includes('code') || lower.includes('example') || lower.includes('json') || lower.includes('fhirpath')) return 'code';
    if (lower.includes('diagram') || lower.includes('flow') || lower.includes('sequence') || lower.includes('architecture')) return 'diagram';
    if (lower.includes('scenario') || lower.includes('roleplay') || lower.includes('interaction') || lower.includes('conversation') || lower.includes('boss') || lower.includes('facilitator') || lower.includes('team') || lower.includes('student')) return 'scenario';
    if (index === total - 1) return 'quiz';
    if (index > 0 && index % 4 === 0) return 'code';
    if (index > 0 && index % 5 === 0) return 'scenario';
    return null;
  }

  private getInteractiveData(type: string, slideTitle: string, topicTitle: string): any {
    switch (type) {
      case 'quiz':
        return this.getMockQuizData(slideTitle, topicTitle);
      case 'lab':
        return this.getMockLabData(slideTitle, topicTitle);
      case 'code':
        return this.getMockCodeData(slideTitle, topicTitle);
      case 'diagram':
        return this.getMockDiagramData(slideTitle, topicTitle);
      case 'scenario':
        return this.getMockScenarioData(slideTitle, topicTitle);
      default:
        return null;
    }
  }

  private getMockQuizData(slideTitle: string, topicTitle: string) {
    const quizzes = [
      {
        question: `What is the primary purpose of the ${topicTitle} resource?`,
        options: [
          'To represent a healthcare provider',
          'To represent a patient or person receiving care',
          'To represent a clinical observation',
          'To represent a medication order'
        ],
        correctIndex: 1,
        explanation: 'The Patient resource represents a person receiving healthcare services. It includes demographics, identifiers, and links to related resources.'
      },
      {
        question: 'Which search parameter would you use to find patients by family name?',
        options: ['name', 'family', 'given', 'identifier'],
        correctIndex: 1,
        explanation: 'The "family" search parameter searches on the family name component of the HumanName datatype.'
      },
      {
        question: 'What does the "_include" parameter do in a FHIR search?',
        options: [
          'Includes deleted resources in results',
          'Includes related resources in the search results bundle',
          'Includes only resources matching all criteria',
          'Includes resource version history'
        ],
        correctIndex: 1,
        explanation: '_include allows you to request that the server include additional resources that are referenced by the search results (e.g., _include=Patient:organization includes the Organization for each Patient).'
      },
      {
        question: 'Which HTTP status code indicates a successful FHIR resource creation?',
        options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
        correctIndex: 1,
        explanation: '201 Created is returned when a resource is successfully created via POST. The Location header contains the new resource URL.'
      },
      {
        question: 'What is the difference between a Profile and an Extension in FHIR?',
        options: [
          'Profiles add new elements; Extensions constrain existing ones',
          'Profiles constrain existing resources; Extensions add new elements',
          'They are the same thing',
          'Profiles are for validation; Extensions are for search'
        ],
        correctIndex: 1,
        explanation: 'Profiles (StructureDefinitions with kind=constraint) define rules that constrain existing resources. Extensions (StructureDefinitions with kind=extension) define new elements that can be added to any resource.'
      }
    ];
    const hash = (slideTitle + topicTitle).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return quizzes[hash % quizzes.length];
  }

  private getMockLabData(slideTitle: string, topicTitle: string) {
    return {
      title: `Mock Assessment: ${slideTitle}`,
      description: `Hands-on exercise for ${topicTitle}. Practice creating, searching, and validating FHIR resources.`,
      steps: [
        {
          id: 'step1',
          title: 'Set up FHIR Client',
          description: 'Confirm you can reach the public HAPI R4 test server.',
          action: 'Copy the GET command, paste it in a terminal, and run it. A Bundle of Patient resources means the server is reachable.',
          command: 'curl -H "Accept: application/fhir+json" https://hapi.fhir.org/baseR4/Patient?_count=1',
          expectedOutput: '{"resourceType":"Bundle","type":"searchset","total":12345,"entry":[...]}'
        },
        {
          id: 'step2',
          title: 'Create a Patient Resource',
          description: 'Create a new Patient on the test server with name, gender, and birth date.',
          action: 'Copy the POST command and run it in a terminal. This sends John Doe to HAPI. You should get back the same Patient plus a server-assigned id (not necessarily 12345).',
          command: `curl -X POST -H "Content-Type: application/fhir+json" -H "Accept: application/fhir+json" \\
  -d '{"resourceType":"Patient","name":[{"family":"Doe","given":["John"]}],"gender":"male","birthDate":"1980-01-01"}' \\
  https://hapi.fhir.org/baseR4/Patient`,
          expectedOutput: '{"resourceType":"Patient","id":"12345","meta":{"versionId":"1","lastUpdated":"2024-01-15T10:30:00Z"},"name":[{"family":"Doe","given":["John"]}],"gender":"male","birthDate":"1980-01-01"}'
        },
        {
          id: 'step3',
          title: 'Search for the Created Patient',
          description: 'Find the Patient you just created using search parameters.',
          action: 'Run the GET search. Look for family=Doe and given=John in the returned searchset Bundle.',
          command: 'curl -H "Accept: application/fhir+json" "https://hapi.fhir.org/baseR4/Patient?family=Doe&given=John"',
          expectedOutput: '{"resourceType":"Bundle","type":"searchset","total":1,"entry":[{"resource":{"resourceType":"Patient","id":"12345",...}}]}'
        },
        {
          id: 'step4',
          title: 'Validate the Resource',
          description: 'Ask the server to validate a Patient body against FHIR rules.',
          action: 'Save the Patient JSON as patient.json, then run the $validate POST. An OperationOutcome with informational (not error) issues means it passed.',
          command: 'curl -X POST -H "Content-Type: application/fhir+json" -d @patient.json https://hapi.fhir.org/baseR4/Patient/$validate',
          expectedOutput: '{"resourceType":"OperationOutcome","issue":[{"severity":"information","code":"informational","details":{"text":"Validation successful"}}]}'
        }
      ],
      fhirServer: {
        baseUrl: 'https://hapi.fhir.org/baseR4',
        capabilities: ['R4', 'US Core', 'SMART on FHIR', 'Validation', 'Search', 'History']
      }
    };
  }

  private getMockCodeData(slideTitle: string, topicTitle: string) {
    const codeExamples = [
      {
        title: 'Patient Resource (JSON)',
        description: 'A minimal valid Patient resource with required fields.',
        code: `{
  "resourceType": "Patient",
  "id": "example",
  "identifier": [{
    "system": "http://hospital.example.org/patients",
    "value": "123456"
  }],
  "name": [{
    "family": "Doe",
    "given": ["John", "Michael"]
  }],
  "telecom": [{
    "system": "phone",
    "value": "+1-555-123-4567",
    "use": "home"
  }],
  "gender": "male",
  "birthDate": "1980-01-15",
  "address": [{
    "line": ["123 Main St"],
    "city": "Boston",
    "state": "MA",
    "postalCode": "02101",
    "country": "USA"
  }]
}`,
        language: 'json',
        filename: 'patient-example.json',
        editable: true,
        validation: true,
        explanation: 'This Patient resource follows US Core Patient profile requirements. The identifier, name, gender, and birthDate are required for US Core.'
      },
      {
        title: 'FHIR Search Bundle',
        description: 'Example search response Bundle with Patient entries.',
        code: `{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 2,
  "link": [{
    "relation": "self",
    "url": "https://hapi.fhir.org/baseR4/Patient?family=Smith"
  }],
  "entry": [{
    "fullUrl": "https://hapi.fhir.org/baseR4/Patient/123",
    "resource": {
      "resourceType": "Patient",
      "id": "123",
      "name": [{"family": "Smith", "given": ["Jane"]}],
      "gender": "female",
      "birthDate": "1990-05-20"
    },
    "search": {"mode": "match"}
  }]
}`,
        language: 'json',
        filename: 'search-bundle-example.json',
        editable: true,
        validation: true,
        explanation: 'Search results are always returned as a Bundle of type "searchset". Each entry has a fullUrl, the resource, and search metadata.'
      },
      {
        title: 'FHIRPath Expression Examples',
        description: 'Common FHIRPath expressions for Patient resource.',
        code: `// Get patient's full name
Patient.name.select(given + ' ' + family).first()

// Get all active patients
Patient.where(active = true)

// Calculate age from birthDate
Patient.birthDate.age()

// Check if patient has a specific identifier system
Patient.identifier.where(system = 'http://hl7.org/fhir/sid/us-ssn').exists()

// Get all observations for a patient
Observation.where(subject.reference = 'Patient/123')`,
        language: 'fhirpath',
        filename: 'fhirpath-examples.fp',
        editable: true,
        validation: false,
        explanation: 'FHIRPath is a path-based query language for FHIR resources. It is used in CQL, invariants, and search criteria.'
      }
    ];
    const hash = (slideTitle + topicTitle).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return codeExamples[hash % codeExamples.length];
  }

  private getMockDiagramData(slideTitle: string, topicTitle: string) {
    const diagramTypes = ['flow', 'sequence', 'resource'] as const;
    const hash = (slideTitle + topicTitle).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const type = diagramTypes[hash % diagramTypes.length];

    if (type === 'flow') {
      return {
        type: 'flow',
        title: `${topicTitle} - Workflow`,
        description: `FHIR ${topicTitle} workflow showing key interactions.`,
        nodes: [
          { id: 'client', label: 'FHIR Client', description: 'SMART App or backend service', x: 100, y: 200, type: 'start' as const, resources: ['Patient', 'Observation'] },
          { id: 'auth', label: 'Auth Server', description: 'OAuth2 / SMART on FHIR authorization', x: 300, y: 100, type: 'process' as const, resources: ['Authorization', 'Token'] },
          { id: 'fhir', label: 'FHIR Server', description: 'HAPI FHIR / Azure API for FHIR', x: 500, y: 200, type: 'process' as const, resources: ['CapabilityStatement', 'OperationOutcome'] },
          { id: 'validate', label: 'Validate', description: 'Profile validation & business rules', x: 300, y: 300, type: 'decision' as const, resources: ['StructureDefinition', 'OperationOutcome'] },
          { id: 'done', label: 'Complete', description: 'Resource created/updated successfully', x: 700, y: 200, type: 'end' as const }
        ],
        edges: [
          { from: 'client', to: 'auth', label: '1. Authorize' },
          { from: 'auth', to: 'client', label: '2. Access Token' },
          { from: 'client', to: 'fhir', label: '3. FHIR Request + Bearer Token' },
          { from: 'fhir', to: 'validate', label: '4. Validate' },
          { from: 'validate', to: 'fhir', label: '5. Valid' },
          { from: 'fhir', to: 'done', label: '6. Response' }
        ]
      };
    } else if (type === 'sequence') {
      return {
        type: 'sequence',
        title: `${topicTitle} - Sequence`,
        description: `Sequence diagram for ${topicTitle.toLowerCase()} operations.`,
        steps: [
          { title: 'Client Registration', description: 'Register SMART app with FHIR server', actor: 'Client', target: 'Auth', async: false },
          { title: 'Authorization Request', description: 'Redirect user to auth server', actor: 'Client', target: 'Auth', async: false },
          { title: 'User Consent', description: 'User grants access to FHIR data', actor: 'User', target: 'Auth', async: true },
          { title: 'Token Exchange', description: 'Exchange auth code for access token', actor: 'Client', target: 'Auth', async: false },
          { title: 'FHIR Search', description: 'Search Patient resources with Bearer token', actor: 'Client', target: 'FHIR Server', async: false },
          { title: 'Bundle Response', description: 'Return search results as Bundle', actor: 'FHIR Server', target: 'Client', async: false }
        ]
      };
    } else {
      return {
        type: 'resource',
        title: `${topicTitle} - Resource Structure`,
        description: `Interactive ${topicTitle} resource tree. Click nodes to expand.`,
        resource: {
          name: 'Patient',
          type: 'DomainResource',
          description: 'Demographics and other administrative information about an individual receiving care.',
          required: true,
          children: [
            { name: 'id', type: 'id', description: 'Logical id of this artifact', required: true },
            { name: 'meta', type: 'Meta', description: 'Metadata about the resource', required: false },
            { name: 'identifier', type: 'Identifier[]', description: 'An identifier for this patient', required: true, children: [
              { name: 'system', type: 'uri', description: 'The namespace for the identifier value', required: true },
              { name: 'value', type: 'string', description: 'The value that is unique', required: true }
            ]},
            { name: 'name', type: 'HumanName[]', description: 'A name associated with the patient', required: true, children: [
              { name: 'use', type: 'code', description: 'usual | official | temp | nickname | anonymous | old | maiden' },
              { name: 'family', type: 'string', description: 'Family name (often called "Surname")', required: true },
              { name: 'given', type: 'string[]', description: 'Given names (not always "first" and "middle" names)', required: true }
            ]},
            { name: 'telecom', type: 'ContactPoint[]', description: 'A contact detail for the individual', required: false },
            { name: 'gender', type: 'code', description: 'male | female | other | unknown', required: true },
            { name: 'birthDate', type: 'date', description: 'The date of birth for the individual', required: true },
            { name: 'address', type: 'Address[]', description: 'Addresses for the individual', required: false },
            { name: 'generalPractitioner', type: 'Reference[]', description: "Patient's nominated primary care provider", required: false },
            { name: 'managingOrganization', type: 'Reference', description: "Organization that is the custodian of the patient record", required: false }
          ]
        }
      };
    }
  }

  private getMockScenarioData(slideTitle: string, topicTitle: string): any {
    const scenarios = [
      // Boss -> Team scenario
      {
        title: 'Sprint Planning: FHIR Implementation',
        characters: [
          { id: 'lead', name: 'Sarah Chen', role: 'boss', position: 'left', avatar: '👩‍💼', color: '#1A6BB8' },
          { id: 'dev1', name: 'Marcus', role: 'employee', position: 'center-left', avatar: '👨‍💻', color: '#1A7A52' },
          { id: 'dev2', name: 'Priya', role: 'employee', position: 'center-right', avatar: '👩‍💻', color: '#B85A12' },
          { id: 'qa', name: 'James', role: 'employee', position: 'right', avatar: '🧪', color: '#8B5CF6' }
        ],
        lines: [
          { characterId: 'lead', text: 'Team, we need to implement the Patient $everything operation by Friday. This is critical for the US Core certification.', delay: 300, duration: 4000, animation: 'typewriter' },
          { characterId: 'dev1', text: 'Got it. I\'ll handle the backend GraphQL resolver and the FHIR Bundle composition.', delay: 300, duration: 3500, animation: 'fade' },
          { characterId: 'dev2', text: 'I\'ll work on the validation logic and make sure we handle contained resources correctly.', delay: 300, duration: 3500, animation: 'fade' },
          { characterId: 'qa', text: 'I\'ll write integration tests against the HAPI FHIR test server. Need to cover edge cases.', delay: 300, duration: 3500, animation: 'pop' },
          { characterId: 'lead', text: 'Perfect. Daily standups at 9am. Blockers? Let\'s ship this! 🚀', delay: 300, duration: 3000, animation: 'typewriter' }
        ],
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 50%, #fffbeb 100%)',
        autoPlay: true,
        loop: false
      },
      // Facilitator -> Students scenario
      {
        title: 'Teaching FHIR Search Parameters',
        characters: [
          { id: 'facilitator', name: 'Dr. Ahmed', role: 'facilitator', position: 'left', avatar: '🎓', color: '#1A6BB8' },
          { id: 'student1', name: 'Alex', role: 'student', position: 'center-left', avatar: '🎒', color: '#1A7A52' },
          { id: 'student2', name: 'Jordan', role: 'student', position: 'center-right', avatar: '🎒', color: '#B85A12' },
          { id: 'student3', name: 'Casey', role: 'student', position: 'right', avatar: '🎒', color: '#8B5CF6' }
        ],
        lines: [
          { characterId: 'facilitator', text: 'Welcome to FHIR Search 101. Today we\'ll master _include, _revinclude, and chained searches.', delay: 300, duration: 4000, animation: 'typewriter' },
          { characterId: 'student1', text: 'What\'s the difference between _include and _revinclude again?', delay: 300, duration: 3000, animation: 'fade' },
          { characterId: 'facilitator', text: 'Great question! _include goes forward (Patient → Organization). _revinclude goes backward (Organization → Patient).', delay: 300, duration: 4500, animation: 'typewriter' },
          { characterId: 'student2', text: 'So if I search Observation and _include=Observation:patient, I get the Patient too?', delay: 300, duration: 3500, animation: 'pop' },
          { characterId: 'facilitator', text: 'Exactly! And chaining lets you do Patient?general-practitioner.organization.name=Acme. Any questions?', delay: 300, duration: 4000, animation: 'typewriter' },
          { characterId: 'student3', text: 'How does this affect performance on large datasets?', delay: 300, duration: 3000, animation: 'fade' },
          { characterId: 'facilitator', text: 'Good point. _include adds overhead. Use _summary=count first to gauge result size. Use _elements to limit fields.', delay: 300, duration: 4500, animation: 'typewriter' }
        ],
        background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #e0e7ff 100%)',
        autoPlay: true,
        loop: false
      },
      // Mentor -> Learner scenario
      {
        title: 'Code Review: FHIR Resource Design',
        characters: [
          { id: 'mentor', name: 'Dr. Kim', role: 'mentor', position: 'left', avatar: '🧙‍♀️', color: '#7C3AED' },
          { id: 'learner', name: 'Taylor', role: 'learner', position: 'right', avatar: '📚', color: '#1A6BB8' }
        ],
        lines: [
          { characterId: 'mentor', text: 'Let\'s review your Observation resource. I notice you\'re using a custom code instead of LOINC.', delay: 300, duration: 4000, animation: 'typewriter' },
          { characterId: 'learner', text: 'I thought our internal codes were fine since we\'re not exchanging externally yet.', delay: 300, duration: 3500, animation: 'fade' },
          { characterId: 'mentor', text: 'Even internally, LOINC enables analytics and future interoperability. Let\'s map 8480-6 (Systolic BP) to your code.', delay: 300, duration: 4500, animation: 'typewriter' },
          { characterId: 'learner', text: 'Makes sense. What about the valueQuantity? I used mmHg but saw kPa in some examples.', delay: 300, duration: 3500, animation: 'pop' },
          { characterId: 'mentor', text: 'UCUM units are required. mmHg is [mmHg]. The system is http://unitsofmeasure.org. Always include both value and unit.', delay: 300, duration: 4000, animation: 'typewriter' },
          { characterId: 'learner', text: 'Got it. I\'ll update the profile binding to required and add the LOINC mapping. Thanks!', delay: 300, duration: 3000, animation: 'fade' }
        ],
        background: 'linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 50%, #fce7f3 100%)',
        autoPlay: true,
        loop: false
      },
      // Team Standup scenario
      {
        title: 'Daily Standup: Bulk Data Export',
        characters: [
          { id: 'scrum', name: 'Maria', role: 'boss', position: 'left', avatar: '👩‍💼', color: '#1A6BB8' },
          { id: 'backend', name: 'David', role: 'employee', position: 'center-left', avatar: '👨‍💻', color: '#1A7A52' },
          { id: 'frontend', name: 'Lisa', role: 'employee', position: 'center-right', avatar: '👩‍💻', color: '#B85A12' },
          { id: 'devops', name: 'Kevin', role: 'employee', position: 'right', avatar: '☁️', color: '#8B5CF6' }
        ],
        lines: [
          { characterId: 'scrum', text: 'Standup time! Bulk Data Export status check. We\'re targeting the $export endpoint for Patient and Observation.', delay: 300, duration: 4000, animation: 'typewriter' },
          { characterId: 'backend', text: 'Yesterday: Implemented the kickoff request with _type filter. Today: Adding status polling and NDJSON streaming.', delay: 300, duration: 4000, animation: 'fade' },
          { characterId: 'frontend', text: 'Built the export dashboard with progress tracking. Need the API to return job status and file URLs.', delay: 300, duration: 3500, animation: 'pop' },
          { characterId: 'devops', text: 'Provisioned the S3 bucket with lifecycle policies. Configured CloudFront for signed URLs. 7-day expiry.', delay: 300, duration: 3500, animation: 'fade' },
          { characterId: 'scrum', text: 'Excellent progress! Blockers? David, need help with the $export spec?', delay: 300, duration: 3000, animation: 'typewriter' },
          { characterId: 'backend', text: 'Just need clarification on _since parameter for incremental exports. Reading the spec now.', delay: 300, duration: 3500, animation: 'fade' },
          { characterId: 'scrum', text: 'Check the HL7 Bulk Data IG section 3.2. Let\'s sync after standup. Keep crushing it! 💪', delay: 300, duration: 3000, animation: 'typewriter' }
        ],
        background: 'linear-gradient(135deg, #dbeafe 0%, #dcfce7 50%, #fef3c7 100%)',
        autoPlay: true,
        loop: false
      }
    ];

    const hash = (slideTitle + topicTitle).split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    return scenarios[hash % scenarios.length];
  }

  private getMockSpecs(phaseId: number) {
    return [
      { label: 'FHIR R4 Specification', url: 'https://hl7.org/fhir/R4/', note: 'Core FHIR R4 specification' },
      { label: 'US Core Implementation Guide', url: 'https://hl7.org/fhir/us/core/', note: 'US Core profiles for interoperability' },
      { label: 'SMART App Launch Framework', url: 'https://hl7.org/fhir/smart-app-launch/', note: 'OAuth2-based authorization for FHIR apps' },
      { label: 'FHIRPath Specification', url: 'https://hl7.org/fhirpath/', note: 'Path-based query language for FHIR' }
    ];
  }

  private getMockExamples(phaseId: number) {
    return [
      { title: 'Patient Search', body: 'Search for patients by name, identifier, or birth date using FHIR RESTful search.' },
      { title: 'Create Observation', body: 'POST a vital signs Observation with proper coding (LOINC) and valueQuantity.' },
      { title: 'Bundle Transaction', body: 'Use a transaction Bundle to create multiple related resources atomically.' },
      { title: 'FHIRPath Queries', body: 'Extract specific data from resources using FHIRPath expressions.' }
    ];
  }

  private getMockLab(phaseId: number) {
    return {
      title: 'FHIR Mock Assessment',
      body: 'Complete a series of guided exercises using a live FHIR server. Practice creating resources, searching, and validating against profiles.'
    };
  }

  private getMockQuiz(phaseId: number) {
    return [
      { id: 1, prompt: 'What HTTP method creates a new FHIR resource?', choices: ['GET', 'POST', 'PUT', 'PATCH'], answerIndex: 1, explanation: 'POST to the resource type endpoint (e.g., POST /Patient) creates a new resource.' },
      { id: 2, prompt: 'Which header specifies the FHIR version?', choices: ['Accept', 'Content-Type', 'FHIR-Version', 'Prefer'], answerIndex: 0, explanation: 'Accept: application/fhir+json indicates FHIR JSON format.' },
      { id: 3, prompt: 'What does a 409 Conflict mean in FHIR?', choices: ['Resource not found', 'Version conflict on update', 'Invalid JSON', 'Unauthorized'], answerIndex: 1, explanation: '409 indicates a version conflict (optimistic locking) when updating a resource.' }
    ];
  }
}