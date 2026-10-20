/* Define las rutas de acceso, listados y detalles de las vistas estáticas. */
import { Routes } from '@angular/router';

const platform = () => import('./platform/platform.page').then(m => m.PlatformPage);

export const routes: Routes = [
  { path: 'login', loadComponent: platform, data: { demo: true } },
  { path: 'app/:section/:id', loadComponent: platform },
  { path: 'app/:section', loadComponent: platform },
  { path: 'home', redirectTo: 'app/dashboard', pathMatch: 'full' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
