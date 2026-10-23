/* Conserva el rol elegido durante la navegación de demostración, sin autenticar ni guardar credenciales. */
import { Injectable } from '@angular/core';
import { Role } from './view-config';

@Injectable({ providedIn: 'root' })
export class DemoStateService {
  role: Role = 'student';
}
