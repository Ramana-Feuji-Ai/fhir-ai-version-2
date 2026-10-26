import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DefectInjection, ExplainFailureResponse, GenerateTestCasesResponse, GenerateTestDataResponse } from './models';

/** PRD 8.4 Test Case and Test Data Assistant (FR-017..FR-020). Export (FR-021) is done client-side. */
@Injectable({ providedIn: 'root' })
export class TestingApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/testing';

  generateTestCases(resource: string, taxonomy: string, acceptanceCriteria: string): Observable<GenerateTestCasesResponse> {
    return this.http.post<GenerateTestCasesResponse>(`${this.base}/generate-test-cases`, { resource, taxonomy, acceptanceCriteria });
  }

  generateTestData(
    scenario: string,
    patientCount: number,
    fhirVersion: string,
    defectInjection: DefectInjection,
    seed: number | null,
    writeToSandbox: boolean
  ): Observable<GenerateTestDataResponse> {
    return this.http.post<GenerateTestDataResponse>(`${this.base}/generate-test-data`, {
      scenario, patientCount, fhirVersion, defectInjection, seed, writeToSandbox,
    });
  }

  explainFailure(resourceType: string, payload: string, observedError: string): Observable<ExplainFailureResponse> {
    return this.http.post<ExplainFailureResponse>(`${this.base}/explain-failure`, { resourceType, payload, observedError });
  }
}
