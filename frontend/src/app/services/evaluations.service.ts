import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface Assignment { id: number; evaluator_name: string; assigned_at: string; }
export interface AssignmentSummary extends Assignment {
  proposal_id: number; title: string; status: string; is_archived: number;
}
@Injectable({ providedIn: 'root' })
export class EvaluationsService {
  constructor(private api: ApiService) {}
  assign(body: object) { return this.api.request('evaluations/assign.php', {}, body); }
  list() { return this.api.request<{items: AssignmentSummary[]}>('evaluations/assignments.php'); }
  assignments(id: number) {
    return this.api.request<{items: Assignment[]}>('evaluations/assignments.php', { proposal_id: id });
  }
}
