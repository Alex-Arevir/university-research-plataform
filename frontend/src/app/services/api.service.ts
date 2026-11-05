import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient, private router: Router) {}

  async request<T>(path: string, params: Record<string, string | number> = {}, body?: object): Promise<T> {
    const url = environment.apiBaseUrl.replace(/\/$/, '') + '/' + path;
    try {
      const options = { params, withCredentials: true };
      return await firstValueFrom((body ? this.http.post<T>(url, body, options)
        : this.http.get<T>(url, options)).pipe(timeout(path.startsWith('assistant/') ? 65000 : 15000)));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        await this.router.navigate(['/login'], { replaceUrl: true });
        throw new Error('Tu sesión terminó. Vuelve a iniciar sesión.');
      }
      throw new Error(error instanceof HttpErrorResponse && error.error?.message
        ? error.error.message : 'No se pudo completar la solicitud. Revisa la conexión con la API.');
    }
  }
}
