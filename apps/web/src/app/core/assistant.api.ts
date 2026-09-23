import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssistantAskResponse {
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class AssistantApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/assistant';

  ask(contextType: 'topic' | 'phase' | 'none', contextId: number | null, question: string): Observable<AssistantAskResponse> {
    return this.http.post<AssistantAskResponse>(`${this.base}/ask`, { contextType, contextId, question });
  }
}
