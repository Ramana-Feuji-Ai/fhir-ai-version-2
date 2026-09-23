import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'phase/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/phase/phase.page').then((m) => m.PhasePage),
  },
  {
    path: 'courses/:slug',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/course.page').then((m) => m.CoursePage),
  },
  {
    path: 'my-learning',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/my-learning.page').then((m) => m.MyLearningPage),
  },
  { path: '**', redirectTo: '' },
];
