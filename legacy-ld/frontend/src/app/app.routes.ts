import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { TopicComponent } from './topic.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'learn/:slug', component: TopicComponent },
  { path: '**', redirectTo: '' }
];
