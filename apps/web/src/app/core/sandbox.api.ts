import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SandboxMeta } from './models';

@Injectable({ providedIn: 'root' })
export class SandboxApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/sandbox';

  meta(): Observable<SandboxMeta> {
    return this.http.get<SandboxMeta>(`${this.base}/meta`);
  }

  reset(): Observable<{ resourceCount: number }> {
    return this.http.post<{ resourceCount: number }>(`${this.base}/reset`, {});
  }

  read(type: string, id: string): Observable<HttpResponse<any>> {
    return this.http.get(`${this.base}/fhir/${type}/${id}`, { observe: 'response' });
  }

  search(type: string, params: Record<string, string>): Observable<HttpResponse<any>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) httpParams = httpParams.set(key, value);
    }
    return this.http.get(`${this.base}/fhir/${type}`, { observe: 'response', params: httpParams });
  }

  create(type: string, body: string): Observable<HttpResponse<any>> {
    return this.http.post(`${this.base}/fhir/${type}`, body, {
      observe: 'response',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  update(type: string, id: string, body: string): Observable<HttpResponse<any>> {
    return this.http.put(`${this.base}/fhir/${type}/${id}`, body, {
      observe: 'response',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  delete(type: string, id: string): Observable<HttpResponse<any>> {
    return this.http.delete(`${this.base}/fhir/${type}/${id}`, { observe: 'response' });
  }

  history(type: string, id: string): Observable<HttpResponse<any>> {
    return this.http.get(`${this.base}/fhir/${type}/${id}/_history`, { observe: 'response' });
  }

  processBundle(body: string): Observable<HttpResponse<any>> {
    return this.http.post(`${this.base}/fhir`, body, {
      observe: 'response',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
