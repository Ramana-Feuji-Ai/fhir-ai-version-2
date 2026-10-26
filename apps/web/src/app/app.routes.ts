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
  {
    path: 'sandbox',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sandbox/sandbox.page').then((m) => m.SandboxPage),
  },
  {
    path: 'design',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/design/design.page').then((m) => m.DesignPage),
  },
  {
    path: 'testing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/testing/testing.page').then((m) => m.TestingPage),
  },
  {
    path: 'knowledge',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/knowledge/knowledge.page').then((m) => m.KnowledgePage),
  },
  { path: '**', redirectTo: '' },
];
