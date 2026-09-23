#!/usr/bin/env python3
"""Build catalog.json from conversation scripts plus full lesson content."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "js" / "conversations.js"
OUT = ROOT / "backend" / "src" / "main" / "resources" / "catalog.json"

SPEAKERS = {
    "maya": ("Dr. Maya Krishnan", "Clinical informaticist"),
    "alex": ("Alex Duarte", "FHIR implementer"),
}


def parse_conversations():
    text = JS.read_text()
    match = re.search(r"const CONVERSATIONS = (\[.*\]);\s*const SPEAKERS", text, re.S)
    raw = re.sub(r"(\n\s*)([A-Za-z0-9_]+)(\s*:)", r'\1"\2"\3', match.group(1))
    return json.loads(raw)


def lines(items, slug):
    out = []
    for i, item in enumerate(items):
        out.append(
            {
                "speaker": item["speaker"],
                "text": item["text"],
                "audioPath": f"assets/audio/{slug}-{i}.mp3",
            }
        )
    return out


META = {
    "what-is-fhir": {
        "kicker": "Phase 1 · Orientation",
        "phase": 1,
        "durationHint": "20 min",
        "interactiveType": "module-map",
        "summary": "FHIR is an HL7 specification for exchanging healthcare information electronically. This lesson orients you to the Foundation, the specification, and how this L&D program is structured.",
        "references": ["https://fhir.org/", "https://fhir.org/about.html", "https://hl7.org/fhir/overview.html"],
        "sections": [
            {
                "heading": "The problem and the standard",
                "body": "Healthcare records are increasingly digitized. As patients move around the ecosystem, records must be available, discoverable, and understandable — by people and by machines. FHIR (Fast Healthcare Interoperability Resources) is the HL7 specification created for that job.\n\nThe HL7 FHIR Foundation promotes global adoption and implementation. fhir.org is the home for implementers. HL7 maintains the standard itself at hl7.org/fhir. This site is a guided classroom, not a replacement for the specification.",
            },
            {
                "heading": "Design aim",
                "body": "FHIR aims to simplify implementation without sacrificing information integrity. It is informed by HL7 v2, v3 and the RIM, and CDA. It can stand alone or work in partnership with those standards. The philosophy is a base set of resources that cover common use cases, plus extensions and Implementation Guides for the rest.",
            },
        ],
        "interactive": {
            "title": "Place each module on the map",
            "prompt": "Match the specification module to what it owns. Click a module, then its definition.",
            "pairs": [
                ["Foundation", "Definitional infrastructure the rest of the spec is built on"],
                ["Clinical", "Problems, allergies, care plans, referrals, and care process"],
                ["Diagnostics", "Observations, diagnostic reports, and related requests"],
                ["Security & Privacy", "Integrity, privacy, SMART App Launch, and related guidance"],
                ["Conformance", "Testing and defining Implementation Guides"],
                ["Terminology", "CodeSystem, ValueSet, ConceptMap, and bindings"],
            ],
        },
        "quiz": [
            {
                "prompt": "What is the basic building block of all exchangeable FHIR content?",
                "options": ["A CDA document", "A Resource", "An HL7 v2 segment", "A DICOM SOP instance"],
                "answer": 1,
                "explanation": "All exchangeable content is defined as a Resource. Documents and messages are ways of packaging resources.",
            },
            {
                "prompt": "Who maintains the FHIR standard versus who runs fhir.org?",
                "options": [
                    "Both are run only by ONC",
                    "HL7 maintains the standard; the FHIR Foundation runs fhir.org for implementers",
                    "WHO maintains both",
                    "IHE maintains the standard; HL7 hosts chat only",
                ],
                "answer": 1,
                "explanation": "HL7 develops FHIR. The HL7 FHIR Foundation focuses on implementation support at fhir.org.",
            },
        ],
    },
    "why-fhir": {
        "kicker": "Phase 1 · Motivation",
        "phase": 1,
        "durationHint": "18 min",
        "interactiveType": "compare-legacy",
        "summary": "Why granular, web-native exchange replaced dump-and-parse as the default implementer expectation — without pretending v2 or CDA disappeared.",
        "references": ["https://hl7.org/fhir/overview.html", "https://healthit.gov/interoperability/investments/fhir/"],
        "sections": [
            {
                "heading": "Granular access",
                "body": "Before FHIR, a clinician might receive a large CCD when they needed last night’s potassium and the active allergy list. FHIR’s design goal is granular access: GET Patient/123 or search Observation by patient and code, instead of parsing an entire dump.",
            },
            {
                "heading": "People and machines",
                "body": "Structured, coded data enables decision support, quality measurement, and patient apps. The narrative inside every resource remains a safety net when software does not understand an extension. FHIR can partner with v2 and CDA; mapping tables exist for a reason.",
            },
        ],
        "interactive": {
            "title": "Choose the better exchange",
            "scenarios": [
                {
                    "scene": "An ED doctor needs the active allergy list in under a second.",
                    "options": ["Send a 40-page CCD", "GET AllergyIntolerance?patient=123&clinical-status=active"],
                    "answer": 1,
                },
                {
                    "scene": "A national summary must travel as a signed clinical document.",
                    "options": ["A FHIR Document Bundle with Composition", "Only an unsolicited v2 ADT with no payload"],
                    "answer": 0,
                },
                {
                    "scene": "A lab wants event-driven notification when a report is final.",
                    "options": ["A FHIR Message Bundle with MessageHeader", "Emailing a screenshot"],
                    "answer": 0,
                },
            ],
        },
        "quiz": [
            {
                "prompt": "Why does FHIR keep a human-readable narrative on resources?",
                "options": [
                    "It replaces coded data",
                    "So people can still read meaning if software misses an extension",
                    "It is only for PDFs",
                    "Narratives are forbidden in JSON",
                ],
                "answer": 1,
                "explanation": "Narrative is a safety feature for humans when machines do not understand every extension or code.",
            }
        ],
    },
    "resources": {
        "kicker": "Phase 2 · Information model",
        "phase": 2,
        "durationHint": "30 min",
        "interactiveType": "resource-explorer",
        "summary": "Every exchangeable item is a Resource: identity, metadata, narrative, and data elements built from shared datatypes, linked by references.",
        "references": ["https://hl7.org/fhir/resourcelist.html", "https://hl7.org/fhir/patient.html"],
        "sections": [
            {
                "heading": "Shared characteristics",
                "body": "Resources share a common way to define and represent content, a common set of metadata, and a human-readable part. Uses range from CarePlan to CapabilityStatement. You do not have to use REST to use resources.",
            },
            {
                "heading": "Where to start",
                "body": "Skim the resource list, then study Patient, then Observation, then Bundle. Patient shows identifiers, names, telecom, address, communication, managing organization, and links. Cardinality and Must Support live in the profile you implement, not in a guess at the base resource.",
            },
        ],
        "interactive": {
            "title": "Explore a Patient instance",
            "resourceType": "Patient",
            "fields": [
                {"path": "id", "value": "example", "why": "Logical id used in REST URLs: Patient/example."},
                {"path": "identifier[0].value", "value": "12345", "why": "Business identifier, always pair with a system."},
                {"path": "name[0].family", "value": "Chalmers", "why": "HumanName.family — people have official, usual, and maiden names."},
                {"path": "gender", "value": "male", "why": "Administrative gender, not a complete clinical sex/gender model."},
                {"path": "birthDate", "value": "1974-12-25", "why": "Date datatype; precision can be year-only when that is all you know."},
                {"path": "telecom[0].value", "value": "(03) 5555 6473", "why": "ContactPoint with system and use."},
                {"path": "address[0].city", "value": "PleasantVille", "why": "Address is a shared datatype used on many resources."},
                {"path": "text.status", "value": "generated", "why": "Narrative so a person can still read the record."},
            ],
        },
        "quiz": [
            {
                "prompt": "Which special resource describes the interfaces an implementation exposes?",
                "options": ["Provenance", "CapabilityStatement", "Bundle", "Parameters"],
                "answer": 1,
                "explanation": "CapabilityStatement advertises resource types, interactions, search parameters, and operations.",
            }
        ],
    },
    "rest-exchange": {
        "kicker": "Phase 2 · Exchange",
        "phase": 2,
        "durationHint": "35 min",
        "interactiveType": "fhir-lab",
        "summary": "Four paradigms — REST, Documents, Messages, Services. Practice REST against a teaching FHIR Patient endpoint backed by PostgreSQL.",
        "references": ["https://hl7.org/fhir/http.html", "https://hl7.org/fhir/search.html", "https://hl7.org/fhir/overview-clinical.html"],
        "sections": [
            {
                "heading": "REST as filing cabinets",
                "body": "A RESTful server is a room of cabinets: one per resource type, one folder per instance, papers as versions. GET reads or searches. POST creates. PUT updates. PATCH partial update. DELETE where policy allows. HISTORY walks versions. Example: GET [base]/Patient/example.",
            },
            {
                "heading": "The other three paradigms",
                "body": "Documents: Bundle with Composition (discharge summary, IPS). Messages: Bundle with MessageHeader for events. Services: operations such as $validate or $everything. Learn REST first, then pick what the use case demands. Always read CapabilityStatement.",
            },
        ],
        "interactive": {
            "title": "Teaching FHIR Patient lab",
            "base": "/fhir",
            "hints": [
                "GET /fhir/Patient/example",
                "GET /fhir/Patient?family=Chalmers",
                "POST a Patient, then GET the Location id",
            ],
        },
        "quiz": [
            {
                "prompt": "Which HTTP interaction creates a new resource when the client does not assign the id?",
                "options": ["PUT", "POST", "PATCH", "HISTORY"],
                "answer": 1,
                "explanation": "POST create lets the server assign the id. PUT is update or update-as-create when the id is known.",
            }
        ],
    },
    "formats-extensibility": {
        "kicker": "Phase 2 · Formats",
        "phase": 2,
        "durationHint": "25 min",
        "interactiveType": "narrative-toggle",
        "summary": "JSON and XML serialize the same model. Narrative protects people. Extensions and StructureDefinition keep the core small.",
        "references": ["https://hl7.org/fhir/formats.html", "https://hl7.org/fhir/extensibility.html", "https://hl7.org/fhir/profiling.html"],
        "sections": [
            {
                "heading": "Formats",
                "body": "JSON dominates new APIs. XML remains important for document-centric stacks. RDF is also specified. Switch the spec header tabs: concise view, detailed descriptions, mappings, examples, and notes.",
            },
            {
                "heading": "Extensions, profiles, Must Support",
                "body": "Add local needs with an extension identified by a canonical URL. Implementation Guides constrain optionality, cardinality, terminology, and extensions. Must Support does not always mean the element is required to be present — read the guide.",
            },
        ],
        "interactive": {
            "title": "Narrative versus coded data",
            "coded": {
                "resourceType": "AllergyIntolerance",
                "code": {"coding": [{"system": "http://snomed.info/sct", "code": "387406002", "display": "Sulfonamide"}]},
                "clinicalStatus": {"coding": [{"code": "active"}]},
            },
            "narrative": "Sulfonamide allergy — active. Reaction: rash. Recorded by clinic allergy service.",
        },
        "quiz": [
            {
                "prompt": "What computable artifact carries extra rules that constrain a resource for a use case?",
                "options": ["AuditEvent", "StructureDefinition", "Binary", "Endpoint"],
                "answer": 1,
                "explanation": "StructureDefinition is the computable profile. CapabilityStatement describes the endpoint.",
            }
        ],
    },
    "terminology": {
        "kicker": "Phase 2 · Codes",
        "phase": 2,
        "durationHint": "25 min",
        "interactiveType": "code-match",
        "summary": "LOINC, SNOMED CT, RxNorm, and ICD make data comparable. CodeSystem, ValueSet, ConceptMap, and binding strength are the rules of the road.",
        "references": ["https://hl7.org/fhir/terminology-module.html", "https://loinc.org/", "https://www.snomed.org/"],
        "sections": [
            {
                "heading": "Three artifacts you will live in",
                "body": "CodeSystem is the dictionary. ValueSet is the allowed subset for a context. ConceptMap translates. NamingSystem describes identifier systems. CodeableConcept can carry more than one coding plus text — essential during migration.",
            },
            {
                "heading": "Binding strength",
                "body": "Required, extensible, preferred, or example. Required means you may not send a code outside the set. Terminology services ($expand, $validate-code, $translate) keep lists computable instead of hard-coded in every app.",
            },
        ],
        "interactive": {
            "title": "Match the code system to the job",
            "pairs": [
                ["LOINC", "Laboratory observations and many documents"],
                ["SNOMED CT", "Problems, procedures, and clinical findings"],
                ["RxNorm", "Medications in US-centric catalogs"],
                ["ICD", "Billing, mortality, and many national statistics"],
            ],
        },
        "quiz": [
            {
                "prompt": "A required binding means:",
                "options": [
                    "You should prefer the value set but any code is fine",
                    "You may not send a code outside the value set",
                    "Only example codes may be used",
                    "Narrative replaces codes",
                ],
                "answer": 1,
                "explanation": "Required is a conformance rule, not a suggestion.",
            }
        ],
    },
    "security-smart": {
        "kicker": "Phase 2 · Trust",
        "phase": 2,
        "durationHint": "30 min",
        "interactiveType": "smart-flow",
        "summary": "TLS, OAuth 2.0, SMART App Launch, backend services, Consent, AuditEvent, and Provenance. REST verbs do not encode privacy policy by themselves.",
        "references": [
            "https://hl7.org/fhir/smart-app-launch/",
            "https://hl7.org/fhir/security.html",
            "https://hl7.org/fhir/consent.html",
        ],
        "sections": [
            {
                "heading": "SMART App Launch",
                "body": "EHR launch shares patient context from the chart. Standalone launch starts in the app. Discovery is .well-known/smart-configuration. Authorization code flow, often with PKCE. Scopes such as patient/Observation.read. Backend services use system scopes and client assertions for bulk export and headless jobs.",
            },
            {
                "heading": "Privacy is not an HTTP verb",
                "body": "AuditEvent, Provenance, Consent, and Signature record what happened and under whose authority. Break-the-glass, minors, and sensitive diagnoses must be encoded in policy, profiles, and scopes.",
            },
        ],
        "interactive": {
            "title": "Walk a SMART launch",
            "steps": [
                {"title": "Register the app", "detail": "Client id, redirect URI, and allowed scopes are established with the EHR."},
                {"title": "Launch", "detail": "EHR launch includes iss and launch parameters. Standalone starts at the app."},
                {"title": "Discover", "detail": "GET {iss}/.well-known/smart-configuration for authorize and token URLs."},
                {"title": "Authorize", "detail": "Browser is sent to authorization_endpoint. User consents. Code is returned."},
                {"title": "Token", "detail": "App exchanges the code at token_endpoint. Receives access token and often patient id."},
                {"title": "FHIR API", "detail": "Authorization: Bearer {token} on GET /fhir/Observation?patient=..."},
            ],
        },
        "quiz": [
            {
                "prompt": "Which SMART flavor is designed for bulk export without a clinician clicking in the chart?",
                "options": ["EHR launch only", "Standalone patient app only", "Backend services (system scopes)", "Open FHIR with no TLS"],
                "answer": 2,
                "explanation": "SMART Backend Services cover headless jobs with system scopes and signed client assertions.",
            }
        ],
    },
    "implementation-guides": {
        "kicker": "Phase 2 · Contracts",
        "phase": 2,
        "durationHint": "22 min",
        "interactiveType": "ig-picker",
        "summary": "The base spec is a platform. Implementation Guides are the contract for a nation, network, or specialty. Registries live at fhir.org and registry.fhir.org.",
        "references": ["https://fhir.org/guides/registry/", "https://registry.fhir.org/", "https://hl7.org/fhir/us/core/"],
        "sections": [
            {
                "heading": "Platform versus IG",
                "body": "The specification defines capabilities. US Core, IPS, SMART App Launch, Bulk Data, and realm-specific lab or quality guides define tomorrow morning’s exchange. Implement the IG your contract names.",
            },
            {
                "heading": "Registries and testing",
                "body": "Implementation Guide registry, SMART app registry, design registry, general application registry. Conformance testing and connectathons turn “we support FHIR” into something verifiable. Version IGs as living contracts.",
            },
        ],
        "interactive": {
            "title": "Which guide would you open first?",
            "cases": [
                {"need": "US EHR patient-access API for USCDI data classes", "guide": "US Core"},
                {"need": "Launch a third-party app inside an EHR with OAuth", "guide": "SMART App Launch"},
                {"need": "Cross-border patient summary for a traveler", "guide": "International Patient Summary"},
                {"need": "Nightly population extract for a registry", "guide": "Bulk Data Access"},
            ],
        },
        "quiz": [
            {
                "prompt": "The base FHIR specification by itself tells a US hospital exactly which Must Support elements to send tomorrow.",
                "options": ["True", "False — that is the job of an Implementation Guide such as US Core"],
                "answer": 1,
                "explanation": "The base spec is a platform. IGs constrain it for a realm or use case.",
            }
        ],
    },
    "getting-started": {
        "kicker": "Phase 3 · Practice",
        "phase": 3,
        "durationHint": "20 min",
        "interactiveType": "start-checklist",
        "summary": "Official reader path plus a clinical and technical first week. Ethics: every Patient resource is a person.",
        "references": ["https://hl7.org/fhir/overview.html", "https://chat.fhir.org/", "https://confluence.hl7.org/display/FHIR/Chat"],
        "sections": [
            {
                "heading": "The editors’ road map",
                "body": "Skim the resource list. Read Patient end to end. Then resource definitions, narrative and references, formats, extensibility. If you know v2/v3/CDA, read the relationship pages. Use the header tabs. Then write software. Ambiguity lives on chat, Confluence, and Jira — the spec is concise on purpose.",
            }
        ],
        "interactive": {
            "title": "First-week checklist",
            "items": [
                "Read Patient examples before the schema",
                "GET a Patient from the teaching lab",
                "POST an Observation plan (even if you only draft JSON)",
                "Open CapabilityStatement on any public test server",
                "Pick one IG your organization actually named",
                "Join FHIR Chat for the work group you will implement",
            ],
        },
        "quiz": [
            {
                "prompt": "Where should you go for a formal change to the specification?",
                "options": ["A private Slack only", "HL7 Jira change requests", "Editing Wikipedia", "Emailing a random vendor list"],
                "answer": 1,
                "explanation": "Formal change requests go through HL7 Jira. Chat is for implementer support, not the conformance source.",
            }
        ],
    },
}

EXTRA = [
    {
        "slug": "clinical",
        "title": "Clinical resources in practice",
        "kicker": "Phase 3 · Clinical chart",
        "phase": 3,
        "durationHint": "28 min",
        "interactiveType": "patient-chart",
        "summary": "Condition, AllergyIntolerance, Observation, DiagnosticReport, Procedure, CarePlan, Goal, and Encounter — how a chart is composed from references.",
        "references": ["https://hl7.org/fhir/clinicalsummary-module.html", "https://hl7.org/fhir/condition.html", "https://hl7.org/fhir/observation.html"],
        "sections": [
            {
                "heading": "Forms for the care process",
                "body": "From a clinical perspective, resources are paper forms: one for allergies, one for problems, one for labs, one for the encounter. A chart is those forms linked to the same Patient and usually the same Encounter. Problems use Condition. Allergies use AllergyIntolerance. Vitals and labs use Observation. Summaries and pathology often use DiagnosticReport that points at Observations.",
            },
            {
                "heading": "Care planning",
                "body": "CarePlan and Goal describe intent. ServiceRequest and Procedure describe what was asked and what was done. Do not overload Observation with problems — that is what Condition is for. Status fields (clinicalStatus, verificationStatus) are how you avoid treating a refuted allergy as active.",
            },
        ],
        "conversation": [
            {"speaker": "maya", "text": "A chart is not one giant document. It is a Patient, the Encounter in front of you, then the active problems, allergies, meds, and the last labs — each as its own resource, linked by references."},
            {"speaker": "alex", "text": "Condition carries problems and diagnoses. AllergyIntolerance carries substances and reactions. Observation is the workhorse for vitals and laboratory results, with a code, a value, a time, and a subject."},
            {"speaker": "maya", "text": "DiagnosticReport is the clinician-facing wrapper — the pathologist’s or radiologist’s report — that points at the Observations underneath. Procedure is what was performed. Encounter is the context of the visit."},
            {"speaker": "alex", "text": "When you search, think clinically: Condition?patient=123&clinical-status=active. Observation?patient=123&code=http://loinc.org|29463-7 for body weight. Include the Encounter when the IG says you must."},
            {"speaker": "maya", "text": "CarePlan and Goal are how teams share intent, not just history. If you only send problems and labs, you have a rear-view mirror. Plans tell the next clinician what we are trying to do."},
            {"speaker": "alex", "text": "Status is a safety issue. A refuted allergy that still looks active can block a needed drug. A preliminary Observation that looks final can drive a wrong decision. Read the status value sets before you map your EHR flags."},
        ],
        "interactive": {
            "title": "Assemble the chart",
            "patient": "Patel, Asha · 62 y",
            "slots": [
                {"label": "Encounter", "resource": "Encounter / ER 2026-08-24"},
                {"label": "Problem", "resource": "Condition / Type 2 diabetes mellitus"},
                {"label": "Allergy", "resource": "AllergyIntolerance / Penicillin — rash"},
                {"label": "Vital", "resource": "Observation / Blood pressure 148/92 mmHg"},
                {"label": "Lab report", "resource": "DiagnosticReport / BMP with potassium 5.1"},
            ],
        },
        "quiz": [
            {
                "prompt": "Which resource is the appropriate home for an active problem list item such as type 2 diabetes?",
                "options": ["Observation", "Condition", "DiagnosticReport", "Binary"],
                "answer": 1,
                "explanation": "Problems and diagnoses belong on Condition. Observation is for measurements and assertions with values.",
            }
        ],
    },
    {
        "slug": "medications",
        "title": "Medications and immunizations",
        "kicker": "Phase 3 · Meds",
        "phase": 3,
        "durationHint": "24 min",
        "interactiveType": "med-timeline",
        "summary": "Medication, MedicationRequest, MedicationDispense, MedicationAdministration, and Immunization — the lifecycle from order to shot in the arm.",
        "references": ["https://hl7.org/fhir/medications-module.html", "https://hl7.org/fhir/medicationrequest.html", "https://hl7.org/fhir/immunization.html"],
        "sections": [
            {
                "heading": "The medication lifecycle",
                "body": "MedicationRequest is the order or prescription. MedicationDispense is what the pharmacy supplied. MedicationAdministration is what was given. MedicationStatement (in some releases) is what the patient reports they are taking. The Medication resource (or a codeable reference) identifies the product.",
            },
            {
                "heading": "Immunization",
                "body": "Immunization records a vaccine event: product, date, dose, site, performer, and protocol. Do not hide immunizations only as generic Procedures if your IG expects Immunization. Reconcile home meds carefully — they are often the most dangerous list in the chart.",
            },
        ],
        "conversation": [
            {"speaker": "alex", "text": "If you remember one chain, remember this: request, dispense, administer. MedicationRequest is intent. Dispense is supply. Administration is the event that reached the patient."},
            {"speaker": "maya", "text": "Clinicians live on the medication list and the immunization history. A request that was never dispensed is not the same as a dose that was given. Status again: active, completed, stopped, on-hold."},
            {"speaker": "alex", "text": "Code the product with RxNorm or your national dictionary. Include sig text in addition to structured dosage when the IG allows it — pharmacists still read sentences."},
            {"speaker": "maya", "text": "Immunization is its own resource because public health and clinical decision support need lot, occurrence, and protocol. A flu shot is not just a Procedure with a vague code if you can send Immunization."},
            {"speaker": "alex", "text": "When mapping an EHR, decide where PRN meds, infusions, and patient-reported supplements live. Mixing them into one list without status and category is how reconciliation fails."},
        ],
        "interactive": {
            "title": "Order to administration",
            "steps": [
                {"when": "08:02", "resource": "MedicationRequest", "detail": "Ceftriaxone 1 g IV every 24 hours — active"},
                {"when": "08:40", "resource": "MedicationDispense", "detail": "Pharmacy dispenses 1 g vial to ED"},
                {"when": "09:05", "resource": "MedicationAdministration", "detail": "Nurse documents 1 g IV given"},
                {"when": "10:15", "resource": "Immunization", "detail": "Influenza vaccine, quadrivalent, left deltoid"},
            ],
        },
        "quiz": [
            {
                "prompt": "A nurse documents that a dose was given. Which resource is that event?",
                "options": ["MedicationRequest", "MedicationAdministration", "Medication", "Provenance only"],
                "answer": 1,
                "explanation": "MedicationAdministration is the event. MedicationRequest is the order.",
            }
        ],
    },
    {
        "slug": "workflow-financial",
        "title": "Workflow and financial resources",
        "kicker": "Phase 3 · Operations",
        "phase": 3,
        "durationHint": "24 min",
        "interactiveType": "workflow-board",
        "summary": "Task, Appointment, ServiceRequest, and a working literacy of Claim, Coverage, and ExplanationOfBenefit.",
        "references": ["https://hl7.org/fhir/workflow-module.html", "https://hl7.org/fhir/financial-module.html", "https://hl7.org/fhir/servicerequest.html"],
        "sections": [
            {
                "heading": "Workflow",
                "body": "ServiceRequest is a request for a procedure, consult, or diagnostic. Task tracks a unit of work and who owns it. Appointment schedules a slot. These resources manage obligation — who must do what by when — which clinical resources alone do not.",
            },
            {
                "heading": "Financial literacy",
                "body": "Coverage is the insurance plan as known to the provider. Claim is what is submitted. ExplanationOfBenefit (EOB) is what came back. You do not need to become a billing coder in this lesson, but you must know which resource is which so you do not stuff payer data into Observation.",
            },
        ],
        "conversation": [
            {"speaker": "maya", "text": "A referral is not a PDF in a fax machine if we can help it. ServiceRequest says what is asked. Task says who is chasing it. Appointment says when the patient will be seen."},
            {"speaker": "alex", "text": "Workflow resources exist because clinical content does not carry obligation. An Observation does not assign a nurse. A Task does. Pair them instead of overloading Condition with to-do semantics."},
            {"speaker": "maya", "text": "On the financial side, clinicians still need Coverage at the front desk and after the visit. If Coverage is missing or expired, care coordination stalls even when the clinical FHIR is perfect."},
            {"speaker": "alex", "text": "Claim and ExplanationOfBenefit are how payers and providers reconcile money. Map them only when your use case is prior auth, attachments, or consumer billing transparency — not because someone said “put everything in FHIR.”"},
            {"speaker": "maya", "text": "Prior authorization often combines ServiceRequest, Claim, and Task. Read the Da Vinci or national IGs before inventing a local bundle."},
        ],
        "interactive": {
            "title": "Put the work on the right board",
            "cards": [
                {"text": "Cardiology consult requested", "bucket": "ServiceRequest"},
                {"text": "Referral coordinator assigned, due Friday", "bucket": "Task"},
                {"text": "Slot booked Thursday 14:00", "bucket": "Appointment"},
                {"text": "Active Medicaid plan on file", "bucket": "Coverage"},
                {"text": "Adjudicated outpatient claim returned", "bucket": "ExplanationOfBenefit"},
            ],
            "buckets": ["ServiceRequest", "Task", "Appointment", "Coverage", "ExplanationOfBenefit"],
        },
        "quiz": [
            {
                "prompt": "Which resource is the right place for “who is responsible for completing this referral by Friday”?",
                "options": ["Observation", "Task", "Patient.photo", "CodeSystem"],
                "answer": 1,
                "explanation": "Task tracks work and ownership. Clinical resources do not replace workflow.",
            }
        ],
    },
    {
        "slug": "testing-community",
        "title": "Testing, connectathons, and community",
        "kicker": "Phase 3 · Prove it",
        "phase": 3,
        "durationHint": "20 min",
        "interactiveType": "connectathon-board",
        "summary": "CapabilityStatement, test scripts, connectathons, FHIR Chat, work groups, and Jira. How “we support FHIR” becomes evidence.",
        "references": ["https://fhir.org/", "https://chat.fhir.org/", "https://confluence.hl7.org/display/FHIR/Connectathons", "https://hl7.org/fhir/testing.html"],
        "sections": [
            {
                "heading": "Prove behavior",
                "body": "CapabilityStatement is the advertisement. TestScript and Inferno-style suites are the exam. Connectathons are where vendors discover that their Patient is not your Patient. Monthly product reports and Foundation conformance services exist so buyers can see more than a marketing slide.",
            },
            {
                "heading": "Where humans still matter",
                "body": "FHIR Chat, HL7 work groups, Stack Overflow’s fhir tag, and Confluence methodology pages. Confluence is not the conformance source. Spec changes go through Jira. Trademark use of FHIR and the Flame mark has an application process on fhir.org.",
            },
        ],
        "conversation": [
            {"speaker": "alex", "text": "If your CapabilityStatement says you search Observation by patient and code, a test script should fail you when you do not. Write the statement last, after the server behaves, or you will advertise fiction."},
            {"speaker": "maya", "text": "Connectathons are not optional theater. They are where clinical scenarios meet other people’s interpretations. Bring real examples, not only happy-path Patient/example."},
            {"speaker": "alex", "text": "When the spec is unclear, ask on chat with a minimal resource and the IG version. Then file Jira if the text should change. Do not silently invent a private profile and call it FHIR."},
            {"speaker": "maya", "text": "Community also means ethics and trademark. This educational site identifies the standard; it is not an HL7 publication. Treat hl7.org/fhir as authoritative for conformance."},
            {"speaker": "alex", "text": "Your last job in this curriculum is to pick a track: implementer, informaticist, or product owner — and join the matching work group list. FHIR is maintained by people who show up."},
        ],
        "interactive": {
            "title": "Pick the right channel",
            "items": [
                {"q": "The spec text seems wrong for R5 Observation.status", "a": "HL7 Jira change request"},
                {"q": "How do I search include Provenance in this IG?", "a": "FHIR Chat / implementer forum"},
                {"q": "Prove our Patient matches US Core 6", "a": "TestScript / Inferno / connectathon"},
                {"q": "We want to use the FHIR name on a product", "a": "FHIR trademark application via the Foundation"},
            ],
        },
        "quiz": [
            {
                "prompt": "Which artifact is authoritative for determining conformance to FHIR?",
                "options": [
                    "A Confluence design note",
                    "The FHIR specification (and the IG you claimed)",
                    "A vendor blog post",
                    "This L&D website",
                ],
                "answer": 1,
                "explanation": "Confluence and this classroom are not the conformance source. The specification and named IGs are.",
            }
        ],
    },
]


def build():
    convos = {c["id"]: c for c in parse_conversations()}
    topics = []
    order = [
        "what-is-fhir",
        "why-fhir",
        "resources",
        "rest-exchange",
        "formats-extensibility",
        "terminology",
        "security-smart",
        "implementation-guides",
        "clinical",
        "medications",
        "workflow-financial",
        "testing-community",
        "getting-started",
    ]
    extra_by_slug = {e["slug"]: e for e in EXTRA}
    for slug in order:
        if slug in convos and slug in META:
            c = convos[slug]
            meta = META[slug]
            topic = {
                "slug": slug,
                "title": re.sub(r"^\d+\.\s*", "", c["title"]),
                **{k: meta[k] for k in meta},
                "conversation": lines(c["lines"], slug),
            }
            if slug == "getting-started":
                topic["conversation"][-1]["text"] = (
                    "This program now runs the full path: landing, conversation videos, interactive labs, "
                    "quizzes, and progress — on Angular, Spring Boot, and PostgreSQL. Keep the specification open beside you."
                )
            topics.append(topic)
        else:
            e = extra_by_slug[slug]
            topic = dict(e)
            topic["conversation"] = lines(e["conversation"], slug)
            topics.append(topic)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"topics": topics}, indent=2))
    print(f"wrote {OUT} ({len(topics)} topics)")
    missing = []
    audio_dir = ROOT / "assets" / "audio"
    for t in topics:
        for line in t["conversation"]:
            rel = ROOT / line["audioPath"]
            if not rel.exists():
                missing.append((t["slug"], line))
    print(f"missing audio clips: {len(missing)}")
    return missing


if __name__ == "__main__":
    build()
