import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KnowledgeAsset, KnowledgeAskResponse, KnowledgeStatus } from './models';

/** PRD 8.5 Enterprise Knowledge Assistant (FR-022..FR-026). */
@Injectable({ providedIn: 'root' })
export class KnowledgeApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/knowledge';

  listAssets(): Observable<KnowledgeAsset[]> {
    return this.http.get<KnowledgeAsset[]>(`${this.base}/assets`);
  }

  ask(persona: string, question: string): Observable<KnowledgeAskResponse> {
    return this.http.post<KnowledgeAskResponse>(`${this.base}/ask`, { persona, question });
  }

  updateStatus(id: string, status: KnowledgeStatus): Observable<KnowledgeAsset> {
    return this.http.put<KnowledgeAsset>(`${this.base}/assets/${id}/status`, { status });
  }
}
