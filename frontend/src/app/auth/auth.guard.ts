/* Comprueba la sesión y el rol antes de abrir una ruta protegida. */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { VIEWS } from '../platform/view-config';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    const user = await auth.checkSession();
    if (!user) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    const section = route.paramMap.get('section') || 'dashboard';
    const view = VIEWS.find(item => item.key === section);
    const allowed = section === 'dashboard' || section === 'assistant' || view?.roles.includes(user.role);
    if (!allowed) return router.createUrlTree(['/app/dashboard'], { queryParams: { denied: '1' } });
    return true;
  } catch {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
};
