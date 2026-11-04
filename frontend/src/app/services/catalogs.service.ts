import { Injectable } from '@angular/core';
import { Role } from '../platform/view-config';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CatalogsService {
  constructor(private api: ApiService) {}
  roles() { return this.api.request<{items: {value: Role; label: string}[]}>('catalogs/roles.php'); }
  list(kind: 'researchers' | 'evaluators') {
    return this.api.request<{items: {id: number; name: string}[]}>(`catalogs/${kind}.php`);
  }
}
