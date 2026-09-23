const CONVERSATIONS = [
  {
    id: "what-is-fhir",
    title: "1. What is FHIR?",
    durationHint: "3 min",
    lines: [
      {
        speaker: "maya",
        text: "Welcome to FHIR Learning & Development. I am Dr. Maya Krishnan, a clinical informaticist. Today we start with the question every newcomer asks: what is FHIR, and why does healthcare keep talking about it?"
      },
      {
        speaker: "alex",
        text: "I am Alex Duarte, a FHIR implementer. FHIR stands for Fast Healthcare Interoperability Resources. It is an HL7 specification for exchanging healthcare information electronically — clinical, administrative, financial, and public-health data."
      },
      {
        speaker: "maya",
        text: "The problem it solves is simple to feel and hard to fix. Patients move across clinics, hospitals, labs, pharmacies, payers, and apps. Their records must be available, discoverable, and understandable — by people and by machines."
      },
      {
        speaker: "alex",
        text: "HL7 has worked on that for decades with v2 messaging, v3, the RIM, and CDA. FHIR is a newer specification informed by those lessons. It aims to simplify implementation without sacrificing information integrity."
      },
      {
        speaker: "maya",
        text: "Think of FHIR resources as shared electronic forms: one shape for a patient, one for an allergy, one for a lab observation, one for a medication request. Systems can fill, store, search, and send those forms in a consistent way."
      },
      {
        speaker: "alex",
        text: "Under the hood those forms are defined resources with common metadata, reusable datatypes, a human-readable narrative, and machine-processable XML or JSON. You can also use RDF. REST is the most common exchange style, but it is not the only one."
      },
      {
        speaker: "maya",
        text: "That combination — clinically meaningful chunks plus web-native APIs — is why FHIR became the focus of so much health IT work, including SMART apps, national implementation guides, and bulk data export."
      },
      {
        speaker: "alex",
        text: "Official starting points live at fhir.org for implementers and at hl7.org/fhir for the specification. This L&D site is a guided classroom around that material — not a replacement for the standard."
      }
    ]
  },
  {
    id: "why-fhir",
    title: "2. Why FHIR exists",
    durationHint: "3 min",
    lines: [
      {
        speaker: "maya",
        text: "Before FHIR, interoperability often meant sending large documents or brittle messages. A clinician might receive a 20-page CCD when they only needed the latest potassium and the active allergy list."
      },
      {
        speaker: "alex",
        text: "FHIR’s design goal is granular access. A client can ask for Patient/123, or search Observation?patient=123&code=29463-7, instead of parsing an entire dump. That is closer to how modern web applications work."
      },
      {
        speaker: "maya",
        text: "Clinically, that matters for decision support, quality measurement, patient-facing apps, and care coordination. If the data is structured and coded, software can alert, trend, and reconcile — not just display a PDF."
      },
      {
        speaker: "alex",
        text: "FHIR also keeps a human-readable narrative inside every resource. If a receiving system does not understand an extension, a person can still read the story. Integrity for machines, safety for people."
      },
      {
        speaker: "maya",
        text: "And FHIR was never meant to erase v2 or CDA overnight. The specification says it can stand alone or work in partnership with those widely used standards. Mapping tables exist for a reason."
      },
      {
        speaker: "alex",
        text: "The other reason FHIR spread quickly: implementer experience. Open tooling, public test servers, connectathons, Implementation Guides, and a REST surface that software engineers already understand."
      }
    ]
  },
  {
    id: "resources",
    title: "3. Resources: the building blocks",
    durationHint: "4 min",
    lines: [
      {
        speaker: "alex",
        text: "The basic building block in FHIR is a Resource. All exchangeable content is defined as a resource. That is the sentence to memorize before you open the spec."
      },
      {
        speaker: "maya",
        text: "From a clinical view, resources are like paper forms: AllergyIntolerance, Condition, MedicationRequest, DiagnosticReport, Encounter, CarePlan. Each form captures one kind of real-world thing."
      },
      {
        speaker: "alex",
        text: "Every resource shares a common pattern: an identity, metadata such as lastUpdated and profile, a human-readable text narrative, and a set of data elements built from shared datatypes."
      },
      {
        speaker: "maya",
        text: "Resources refer to each other. A MedicationRequest points at a Patient, a Practitioner, and a Medication. An Observation points at the Patient and often at the Encounter. Composition is how you assemble a document."
      },
      {
        speaker: "alex",
        text: "If you are new, do this in order: skim the resource list, then study Patient end to end, then Observation, then Bundle. Patient shows identifiers, names, telecom, address, communication, and links between records."
      },
      {
        speaker: "maya",
        text: "Not every resource is clinical. CapabilityStatement describes what a server can do. StructureDefinition constrains a resource for a use case. CodeSystem and ValueSet carry terminology. Provenance records why a change happened."
      },
      {
        speaker: "alex",
        text: "Most resources include examples, mappings to v2, CDA, or DICOM where appropriate, and a maturity model. Do not treat every element as mandatory. Cardinality and Must Support rules live in the profile you actually implement."
      }
    ]
  },
  {
    id: "rest-exchange",
    title: "4. REST and the four paradigms",
    durationHint: "4 min",
    lines: [
      {
        speaker: "alex",
        text: "FHIR defines four primary exchange paradigms: REST, Documents, Messages, and Services. REST is the simplest and the one most learning programs start with."
      },
      {
        speaker: "maya",
        text: "The clinical metaphor I use: a RESTful server is a room of filing cabinets. One cabinet per resource type. Each folder is one real-world instance — one patient, one encounter — and papers in the folder are versions."
      },
      {
        speaker: "alex",
        text: "The HTTP verbs map cleanly. GET read or search. POST create. PUT update. PATCH partial update. DELETE remove where policy allows. HISTORY lets you walk those versions. A typical read is GET [base]/Patient/123."
      },
      {
        speaker: "maya",
        text: "Search is where clinicians feel the benefit. Find active problems, labs since yesterday, or medications that are still on the list. Search parameters are defined per resource, plus common ones like _id, _lastUpdated, and _include."
      },
      {
        speaker: "alex",
        text: "Documents package a Bundle with a Composition — think discharge summary or patient summary. Messages use a Bundle with MessageHeader for event-driven workflows. Services cover operation-style RPC such as $validate or $everything."
      },
      {
        speaker: "maya",
        text: "You do not have to use REST to use resources. A national network might drop FHIR documents on a transport you already have. A lab might send FHIR messages. Learn REST first, then pick the paradigm the use case demands."
      },
      {
        speaker: "alex",
        text: "CapabilityStatement is how a server advertises which resource types, interactions, search parameters, and operations it actually supports. Never assume a test server’s behavior is your production EHR."
      }
    ]
  },
  {
    id: "formats-extensibility",
    title: "5. Formats, narrative, extensions",
    durationHint: "3 min",
    lines: [
      {
        speaker: "alex",
        text: "FHIR instances are usually JSON or XML. JSON is dominant in new APIs. XML remains important for document-centric and enterprise stacks. The information model is the same; only the surface syntax changes."
      },
      {
        speaker: "maya",
        text: "The narrative — Resource.text — is not optional thinking. It is the human-readable representation. If an extension or coded element is missed by software, a clinician should still be able to read what was meant."
      },
      {
        speaker: "alex",
        text: "Extensibility is how FHIR stays small in the core and still covers local needs. Rather than putting every national identifier or local workflow flag into the base resource, you add an extension with a canonical URL."
      },
      {
        speaker: "maya",
        text: "That is the opposite of HL7 v3’s model-by-constraint in important ways. FHIR gives a composable core, then Implementation Guides constrain optionality, cardinality, terminology, and extensions for a specific exchange."
      },
      {
        speaker: "alex",
        text: "StructureDefinition is the computable form of those rules. CapabilityStatement says what an endpoint does. Together they are how you go from “FHIR in general” to “this hospital, this app, this national spec.”"
      },
      {
        speaker: "maya",
        text: "When you hear Must Support, it does not always mean the element is required to be present. It means if you have the data, you must be able to produce or consume it as the guide defines. Read the guide’s definition carefully."
      }
    ]
  },
  {
    id: "terminology",
    title: "6. Terminology that makes data comparable",
    durationHint: "3 min",
    lines: [
      {
        speaker: "maya",
        text: "A lab value without a code is a number floating in space. FHIR binds elements to terminologies so potassium, diabetes, and a flu vaccine mean the same thing across systems."
      },
      {
        speaker: "alex",
        text: "You will live in three artifacts: CodeSystem — the dictionary of codes; ValueSet — the allowed subset for a context; ConceptMap — translations between systems. NamingSystem describes identifier systems."
      },
      {
        speaker: "maya",
        text: "Common clinical bindings include LOINC for observations and documents, SNOMED CT for problems and procedures, RxNorm or local medication dictionaries for drugs, and ICD for billing or mortality in many regions."
      },
      {
        speaker: "alex",
        text: "CodeableConcept lets you send a coded coding plus optional text. You can include more than one coding — for example SNOMED and a local code — which is essential during migration."
      },
      {
        speaker: "maya",
        text: "Terminology services matter in production. $expand, $validate-code, and $translate keep ValueSets computable. Do not hard-code giant lists in every app if a terminology server can govern them."
      },
      {
        speaker: "alex",
        text: "Implementation Guides will tell you required versus extensible versus preferred versus example bindings. Required means you may not send a code outside the set. That is a conformance rule, not a suggestion."
      }
    ]
  },
  {
    id: "security-smart",
    title: "7. Security, privacy, SMART apps",
    durationHint: "4 min",
    lines: [
      {
        speaker: "maya",
        text: "Interoperability without authorization is a breach waiting to happen. FHIR assumes TLS in production, authenticates the client and often the user, and authorizes at a clinically meaningful scope — down to patient and category where required."
      },
      {
        speaker: "alex",
        text: "SMART App Launch is the common pattern. It uses OAuth 2.0 so a third-party app can launch inside an EHR or stand alone, obtain an access token, and call the FHIR API with scopes such as patient/Observation.read."
      },
      {
        speaker: "maya",
        text: "There are two launch flavors clinicians should recognize. EHR launch: the user is already in the chart and opens an app with patient context. Standalone launch: the user starts in the app and then selects a provider to connect."
      },
      {
        speaker: "alex",
        text: "Discovery uses .well-known/smart-configuration on the FHIR base URL. The app learns authorization_endpoint, token_endpoint, and capabilities, then follows the authorization-code flow, optionally with PKCE."
      },
      {
        speaker: "maya",
        text: "Backend services — also called SMART for Backend Services — cover headless jobs: bulk export, decision support without a clinician click, payer-to-provider pipelines. Those use system scopes and signed client assertions, not a browser login."
      },
      {
        speaker: "alex",
        text: "Security also includes AuditEvent, Provenance, Consent, and Signature. Break-the-glass, minors’ privacy, and sensitive diagnoses are policy problems that your profiles and scopes must encode — the REST verbs will not do it for you."
      }
    ]
  },
  {
    id: "implementation-guides",
    title: "8. Implementation Guides and registries",
    durationHint: "3 min",
    lines: [
      {
        speaker: "alex",
        text: "The base FHIR specification is a platform. It defines capabilities and an ecosystem. It does not, by itself, tell a US hospital, an NHS trust, or a lab network exactly which elements to send tomorrow morning."
      },
      {
        speaker: "maya",
        text: "That is the job of Implementation Guides. National programs, vendor consortiums, and clinical societies publish IGs that constrain resources, bind terminology, and define the actual exchange."
      },
      {
        speaker: "alex",
        text: "fhir.org hosts community entry points: Implementation Guide registry, SMART-on-FHIR app registry, design registry, and general application registry. The full IG catalog is also at registry.fhir.org."
      },
      {
        speaker: "maya",
        text: "You will meet guides such as US Core, International Patient Summary, SMART App Launch, Bulk Data, and countless realm-specific lab, imaging, and quality guides. Always implement the IG your contract names — not a generic Patient you invented."
      },
      {
        speaker: "alex",
        text: "Conformance testing, monthly product reports, and connectathons exist so implementers can prove behavior. CapabilityStatement plus IG constraints plus test scripts are how “we support FHIR” becomes something you can verify."
      },
      {
        speaker: "maya",
        text: "If you need to publish a guide, the Foundation documents registration via GitHub pull request or a submission to the FHIR Director. Treat published IGs as living contracts with versioning."
      }
    ]
  },
  {
    id: "getting-started",
    title: "9. How to start learning and building",
    durationHint: "3 min",
    lines: [
      {
        speaker: "maya",
        text: "If you are clinical: start with Patient, Encounter, Condition, AllergyIntolerance, Observation, MedicationRequest, and DiagnosticReport. Read the examples before the XML schema."
      },
      {
        speaker: "alex",
        text: "If you are technical: stand up or use a public test server, GET a Patient, POST an Observation, search, then read CapabilityStatement. After that, add SMART auth and one Implementation Guide profile."
      },
      {
        speaker: "maya",
        text: "Worked learning path on this site — later phases — will make each of those topics interactive: conversation first, then the resource walkthrough, then a short scenario you can complete."
      },
      {
        speaker: "alex",
        text: "Do not skip community channels. FHIR Chat, HL7 work groups, Stack Overflow’s fhir tag, and connectathons are how ambiguities get resolved. The spec is concise on purpose; implementer forums hold the rest."
      },
      {
        speaker: "maya",
        text: "And keep the ethics in view. Every Patient resource is a person. Minimum necessary access, accurate coding, and clear provenance are part of professional practice, not extras for the security chapter."
      },
      {
        speaker: "alex",
        text: "Phase 1 of this project is the landing experience and these conversation videos. After you review, we will grow each topic into a full interactive lesson on the Angular, Spring Boot, and Postgres stack you chose."
      }
    ]
  }
];

const SPEAKERS = {
  maya: {
    name: "Dr. Maya Krishnan",
    role: "Clinical informaticist",
    image: "assets/images/speaker-maya.jpg"
  },
  alex: {
    name: "Alex Duarte",
    role: "FHIR implementer",
    image: "assets/images/speaker-alex.jpg"
  }
};
