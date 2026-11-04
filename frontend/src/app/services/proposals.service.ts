import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface Proposal {
  id: number; title: string; description: string; objectives: string; author_id: number;
  responsible_researcher_id: number; status: string; is_archived: number;
  correction_pending_resubmit: number; created_at: string; researcher_name: string;
}
export interface HistoryEntry {
  id: number; action: string; previous_status: string | null; new_status: string;
  actor_name: string | null; details: string | null; created_at: string;
}
@Injectable({ providedIn: 'root' })
export class ProposalsService {
  constructor(private api: ApiService) {}
  list(params: Record<string, string | number>) {
    return this.api.request<{items: Proposal[]; total: number}>('proposals/list.php', params);
  }
  detail(id: number) { return this.api.request<{proposal: Proposal}>('proposals/detail.php', { proposal_id: id }); }
  history(id: number) { return this.api.request<{items: HistoryEntry[]}>('proposals/history.php', { proposal_id: id }); }
  save(path: string, body: object) { return this.api.request<{proposal_id: number; status: string}>(path, {}, body); }
}
