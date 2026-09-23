import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from './api.service';
import { ProgressRow, TopicSummary } from './models';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgClass],
  template: `
    <section class="hero">
      <div class="hero-media" aria-hidden="true">
        <img src="/assets/images/hero-learning.jpg" alt="">
      </div>
      <div class="wrap hero-copy">
        <p class="kicker">HL7 FHIR · Implementer education</p>
        <h1>Learn FHIR the way healthcare actually exchanges data.</h1>
        <p class="lede">Full curriculum: conversation videos with Maya and Alex, interactive labs, quizzes, and progress saved through Spring Boot into PostgreSQL. Angular delivers the classroom.</p>
        <div class="actions">
          <a class="btn btn-primary" href="#curriculum">Open the curriculum</a>
          <a class="btn btn-ghost" routerLink="/learn/what-is-fhir">Start topic 1</a>
        </div>
      </div>
    </section>
    <div class="trust-bar">
      <div class="wrap">
        <span>Aligned to fhir.org and the HL7 FHIR R5 overview</span>
        <span>Stack: Angular · Spring Boot · PostgreSQL</span>
        <span>{{ completedCount }} / {{ topics.length }} topics completed</span>
      </div>
    </div>
    <section class="section" id="curriculum">
      <div class="wrap">
        <h2>Curriculum</h2>
        <p class="intro">Every topic has a briefing, a two-speaker conversation with recorded audio, an interactive exercise, and a short quiz. Nothing essential from the Phase 1 outline is dropped.</p>
        @if (error) {
          <p class="error-banner">{{ error }}</p>
        }
        @if (offline) {
          <p class="error-banner">Spring Boot is not running on port 18081. Lessons still load from the local catalog; start the API for the FHIR lab and Postgres progress.</p>
        }
        @if (!topics.length && !error) {
          <p>Loading topics…</p>
        } @else {
          <div class="cards">
            @for (topic of topics; track topic.slug) {
              <a class="card topic-card" [routerLink]="['/learn', topic.slug]">
                <span class="num">Phase {{ topic.phase }} · {{ topic.durationHint }}</span>
                <h3>{{ topic.title }}</h3>
                <p>{{ topic.summary }}</p>
                <p class="card-status" [ngClass]="{ done: isDone(topic.slug) }">
                  {{ isDone(topic.slug) ? 'Completed' : 'Not started' }}
                </p>
              </a>
            }
          </div>
        }
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  topics: TopicSummary[] = [];
  progress: ProgressRow[] = [];
  error = '';
  offline = false;

  ngOnInit(): void {
    this.api.topics().subscribe({
      next: (rows: TopicSummary[]) => {
        this.topics = rows;
        this.offline = !this.api.apiOnline;
      },
      error: () => (this.error = 'Could not load topics from the API or the local catalog.')
    });
    this.api.progress().subscribe({
      next: (rows: ProgressRow[]) => (this.progress = rows),
      error: () => undefined
    });
  }

  get completedCount(): number {
    return this.progress.filter((p) => p.completed).length;
  }

  isDone(slug: string): boolean {
    return this.progress.some((p) => p.topicSlug === slug && p.completed);
  }
}
