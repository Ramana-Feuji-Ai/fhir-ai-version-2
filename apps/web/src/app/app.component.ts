import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header.component';
import { FooterComponent } from './layout/footer.component';
import { AiAssistantComponent } from './layout/ai-assistant.component';

@Component({
  selector: 'fhi-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AiAssistantComponent],
  template: `
    <fhi-header />
    <main id="app">
      <router-outlet />
    </main>
    <fhi-footer />
    <fhi-ai-assistant />
  `,
})
export class AppComponent {}
