import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExplainIgResponse, GenerateApiResponse, GeneratePayloadResponse, RecommendResourcesResponse } from './models';

/** PRD 8.3 FHIR Design and Development Assistant (FR-011..FR-016). */
@Injectable({ providedIn: 'root' })
export class DesignApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/design';

  recommendResources(persona: string, fhirVersion: string, implementationGuide: string, workflow: string): Observable<RecommendResourcesResponse> {
    return this.http.post<RecommendResourcesResponse>(`${this.base}/recommend-resources`, { persona, fhirVersion, implementationGuide, workflow });
  }

  generatePayload(fhirVersion: string, implementationGuide: string, artifact: string, intent: string): Observable<GeneratePayloadResponse> {
    return this.http.post<GeneratePayloadResponse>(`${this.base}/generate-payload`, { fhirVersion, implementationGuide, artifact, intent });
  }

  generateApiExample(resource: string, interaction: string, requirement: string, fhirVersion: string): Observable<GenerateApiResponse> {
    return this.http.post<GenerateApiResponse>(`${this.base}/generate-api-example`, { resource, interaction, requirement, fhirVersion });
  }

  explainIg(persona: string, fhirVersion: string, implementationGuide: string, resourceType: string, question: string): Observable<ExplainIgResponse> {
    return this.http.post<ExplainIgResponse>(`${this.base}/explain-ig`, { persona, fhirVersion, implementationGuide, resourceType, question });
  }
}
