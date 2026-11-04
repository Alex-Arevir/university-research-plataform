/* Conecta el login, la consulta de sesión y el cierre con PHP mediante su cookie HttpOnly. */
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, VIEWS } from '../platform/view-config';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: Role;
  status: 'active';
}

interface SessionResponse { user: AuthUser; }

export class AuthError extends Error {
  constructor(message: string, public readonly status = 0) { super(message); }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<AuthUser | null>(null);
  readonly user = this.currentUser.asReadonly();
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly inactivityMs = 30 * 60 * 1000;
  private readonly activityCheckMs = 60 * 1000;
  private lastActivity = 0;
  private lastCheck = 0;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private listening = false;
  private sessionRequest?: Promise<AuthUser | null>;
  private expiring = false;
  private generation = 0;
  sessionMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  // El rol viene del servidor. No se reciben roles ni permisos desde el formulario.
  async login(username: string, password: string): Promise<AuthUser> {
    ++this.generation;
    try {
      const response = await firstValueFrom(this.http.post<SessionResponse>(
        `${this.baseUrl}/auth/login.php`, { username: username.trim(), password },
        { withCredentials: true },
      ).pipe(timeout(10000)));
      const user = this.validateUser(response);
      this.sessionMessage = '';
      this.lastActivity = Date.now();
      this.acceptUser(user);
      return user;
    } catch (error) {
      this.clearUser();
      throw this.explainError(error, true);
    }
  }

  // Se consulta al recargar, navegar y durante actividad real; no hay latido permanente.
  checkSession(): Promise<AuthUser | null> {
    if (this.sessionRequest) return this.sessionRequest;
    const request = this.fetchSession();
    this.sessionRequest = request;
    request.finally(() => { if (this.sessionRequest === request) this.sessionRequest = undefined; }).catch(() => {});
    return request;
  }

  private async fetchSession(): Promise<AuthUser | null> {
    const generation = this.generation;
    try {
      const response = await firstValueFrom(this.http.get<SessionResponse>(
        `${this.baseUrl}/auth/session.php`, { withCredentials: true },
      ).pipe(timeout(10000)));
      if (generation !== this.generation) return this.user();
      const user = this.validateUser(response);
      if (!this.lastActivity) this.lastActivity = Date.now();
      this.acceptUser(user);
      this.sessionMessage = '';
      return user;
    } catch (error) {
      if (generation !== this.generation) return this.user();
      const failure = this.explainError(error);
      const hadUser = this.user() !== null;
      this.clearUser();
      if (failure.status === 401) {
        this.sessionMessage = hadUser ? 'Tu sesión terminó. Vuelve a iniciar sesión.' : '';
        return null;
      }
      this.sessionMessage = failure.message;
      throw failure;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.baseUrl}/auth/logout.php`, {},
        { withCredentials: true }).pipe(timeout(10000)));
      this.clearUser();
      this.sessionMessage = '';
    } catch (error) {
      throw this.explainError(error);
    }
  }

  // Si se cumple el tiempo local, se oculta el contenido y se intenta cerrar en el servidor.
  private async expireSession(): Promise<void> {
    if (this.expiring) return;
    this.expiring = true;
    this.clearUser();
    this.sessionMessage = 'Tu sesión terminó por inactividad. Vuelve a iniciar sesión.';
    try {
      await firstValueFrom(this.http.post(`${this.baseUrl}/auth/logout.php`, {},
        { withCredentials: true }).pipe(timeout(10000)));
    } catch { /* El backend también valida la expiración antes de permitir el acceso. */ }
    await this.router.navigate(['/login'], { replaceUrl: true });
    this.expiring = false;
  }

  private acceptUser(user: AuthUser): void {
    this.currentUser.set(user);
    this.lastCheck = Date.now();
    this.startTracking();
    this.scheduleExpiry();
  }

  private clearUser(): void {
    ++this.generation;
    this.currentUser.set(null);
    this.lastActivity = 0;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
    if (this.listening) {
      for (const event of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
        window.removeEventListener(event, this.onActivity, true);
      }
      window.removeEventListener('focus', this.onFocus);
      this.listening = false;
    }
  }

  private startTracking(): void {
    if (this.listening) return;
    this.listening = true;
    for (const event of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
      window.addEventListener(event, this.onActivity, { passive: true, capture: true });
    }
    window.addEventListener('focus', this.onFocus);
  }

  private readonly onActivity = (): void => {
    if (!this.user()) return;
    const now = Date.now();
    // No reactiva una sesión si el navegador suspendió la pestaña durante más de 30 minutos.
    if (now - this.lastActivity >= this.inactivityMs) { void this.expireSession(); return; }
    this.lastActivity = now;
    this.scheduleExpiry();
    if (now - this.lastCheck >= this.activityCheckMs) void this.refreshWhileActive();
  };

  private readonly onFocus = (): void => {
    if (!this.user()) return;
    if (Date.now() - this.lastActivity >= this.inactivityMs) { void this.expireSession(); return; }
    void this.refreshWhileActive();
  };

  private async refreshWhileActive(): Promise<void> {
    const previousRole = this.user()?.role;
    try {
      const user = await this.checkSession();
      if (!user) {
        await this.router.navigate(['/login'], { replaceUrl: true });
      } else if (user.role !== previousRole && this.router.url.startsWith('/app/')) {
        const section = this.router.url.split('/')[2]?.split('?')[0];
        const view = VIEWS.find(item => item.key === section);
        if (view && !view.roles.includes(user.role)) {
          await this.router.navigate(['/app/dashboard'], { queryParams: { denied: '1' }, replaceUrl: true });
        }
      }
    } catch {
      await this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private scheduleExpiry(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => void this.expireSession(),
      Math.max(0, this.inactivityMs - (Date.now() - this.lastActivity)));
  }

  private validateUser(response: SessionResponse): AuthUser {
    const user = response?.user;
    const roles = ['student', 'researcher', 'evaluator', 'coordinator'];
    if (!user || !Number.isInteger(user.id) || user.id <= 0 ||
        typeof user.name !== 'string' || typeof user.username !== 'string' ||
        user.status !== 'active' || !roles.includes(user.role)) {
      throw new AuthError('La API devolvió una sesión no válida. Revisa la configuración del backend.', 502);
    }
    return user;
  }

  private explainError(error: unknown, login = false): AuthError {
    if (error instanceof AuthError) return error;
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return new AuthError(login ? 'Usuario o contraseña incorrectos.' : 'Tu sesión terminó. Vuelve a iniciar sesión.', 401);
      if (error.status === 403) return new AuthError(login ? 'La cuenta está inactiva o el acceso no está autorizado.' : 'No tienes permiso para realizar esta operación.', 403);
      if (error.status === 400 || error.status === 422) return new AuthError('Escribe tu usuario y contraseña.', error.status);
      if (error.status === 404) return new AuthError('No se encontró la API. Revisa la dirección configurada del backend.', 404);
      if (error.status === 0) return new AuthError('No se pudo conectar con la API. Revisa Apache, la dirección y los permisos de conexión.', 0);
      return new AuthError('No se pudo completar la solicitud. Comprueba que el backend y MySQL estén disponibles.', error.status);
    }
    return new AuthError('La solicitud no pudo completarse. Revisa tu conexión e inténtalo de nuevo.');
  }
}
