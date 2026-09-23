import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Clear session only when an authenticated API call is rejected.
 * Avoids bouncing the user back to /login on benign failures.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const isAuthCall =
          req.url.includes('/api/v1/auth/login') ||
          req.url.includes('/api/v1/auth/register');
        const hadBearer = !!req.headers.get('Authorization');
        if (!isAuthCall && hadBearer && auth.isLoggedIn()) {
          auth.logout();
        }
      }
      return throwError(() => err);
    })
  );
};
