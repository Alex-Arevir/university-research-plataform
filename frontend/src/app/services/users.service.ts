import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Role } from '../platform/view-config';

export interface Account {
  id: number; name: string; username: string; email: string | null;
  role: Role; status: 'active' | 'inactive';
}
@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private api: ApiService) {}
  list() { return this.api.request<{items: Account[]}>('users/list.php'); }
  detail(id: number) { return this.api.request<{user: Account}>('users/detail.php', { user_id: id }); }
  save(path: string, body: object) { return this.api.request<{user: Account}>(path, {}, body); }
}
