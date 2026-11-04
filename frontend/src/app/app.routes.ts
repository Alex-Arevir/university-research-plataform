/* Define el acceso y las rutas protegidas por sesión y rol. */
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

const platform = () => import('./platform/platform.page').then(m => m.PlatformPage);

export const routes: Routes = [
  { path: 'login', loadComponent: platform },
  { path: 'app/:section/:id', loadComponent: platform, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
  { path: 'app/:section', loadComponent: platform, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
  { path: 'home', redirectTo: 'app/dashboard', pathMatch: 'full' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
