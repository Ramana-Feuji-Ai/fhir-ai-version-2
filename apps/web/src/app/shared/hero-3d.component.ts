import { Component, OnInit, OnDestroy, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'fhi-hero-3d',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="hero3d" #canvasContainer>
      <canvas #canvas></canvas>
      <div class="heroGlow glowA" aria-hidden="true"></div>
      <div class="heroGlow glowB" aria-hidden="true"></div>
      <div class="hero3d-overlay">
        <div class="hero3d-content">
          <div class="hero3d-brand">
            <span class="logo">fhi</span>
            <div>
              <b>FHIR Learning Academy</b>
              <small>Health intelligence for implementers</small>
            </div>
          </div>
          <h1>Master FHIR R4 Certification</h1>
          <p class="lead">A structured, interactive academy from foundations through advanced mock assessments — featuring video lessons, hands-on exercises, progress tracking, and blueprint-aligned practice for real-world implementation.</p>
          <div class="trust-row">
            <button type="button" class="trust-pill" (click)="scrollTo('courses')"><i>✓</i> 17 Learning Phases</button>
            <button type="button" class="trust-pill" (click)="scrollTo('courses')"><i>✓</i> 200+ Interactive Topics</button>
            <button type="button" class="trust-pill" (click)="scrollTo('features')"><i>✓</i> Video-Enhanced Lessons</button>
            <button type="button" class="trust-pill" (click)="scrollTo('features')"><i>✓</i> Hands-on Mock Assessments & Quizzes</button>
          </div>
          <div class="cta-row">
            <a class="btn primary" routerLink="/" fragment="courses">Explore Courses</a>
            <a class="btn secondary" routerLink="/phase/1">Start Phase 1 →</a>
          </div>
          <div class="stats-bar">
            <div class="stat"><b>{{ displayStats().learners }}</b><span>Active Learners</span></div>
            <div class="stat"><b>{{ displayStats().completion }}</b><span>Completion Rate</span></div>
            <div class="stat"><b>{{ displayStats().phases }}</b><span>Phases</span></div>
            <div class="stat"><b>{{ displayStats().hours }}</b><span>Learning Hours</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .hero3d {
      position: relative;
      width: 100%;
      min-height: 600px;
      overflow: hidden;
      background: linear-gradient(135deg, #0B1C2C 0%, #14304A 50%, #1E3F5C 100%);
    }
    .hero3d::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 26px 26px;
      pointer-events: none;
    }
    .hero3d canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .heroGlow {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(6px);
      animation: heroGlowFloat 20s ease-in-out infinite;
    }
    .glowA { top: -110px; right: 6%; width: 340px; height: 340px; background: radial-gradient(circle, rgba(59,143,212,.22) 0%, transparent 70%); }
    .glowB { bottom: -130px; left: 4%; width: 280px; height: 280px; background: radial-gradient(circle, rgba(224,160,106,.18) 0%, transparent 70%); animation-duration: 26s; animation-delay: -8s; }
    @keyframes heroGlowFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(18px, -20px) scale(1.07); }
    }
    @media (prefers-reduced-motion: reduce) {
      .heroGlow { animation: none; }
    }
    .hero3d-overlay {
      position: relative;
      z-index: 10;
      padding: 80px 28px 60px;
      max-width: 1180px;
      margin: 0 auto;
      color: white;
    }
    .hero3d-content {
      max-width: 720px;
    }
    .hero3d-brand {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
      padding: 12px 18px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    .hero3d-brand .logo {
      font-family: "IBM Plex Serif", Georgia, serif;
      font-size: 36px;
      font-weight: 700;
      color: #E0A06A;
      letter-spacing: -0.04em;
    }
    .hero3d-brand b {
      display: block;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .hero3d-brand small {
      display: block;
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .hero3d-content h1 {
      font-family: "IBM Plex Serif", Georgia, serif;
      font-size: clamp(38px, 5vw, 56px);
      line-height: 1.1;
      letter-spacing: -0.03em;
      font-weight: 650;
      margin: 0 0 20px;
      background: linear-gradient(135deg, #fff 0%, #E0A06A 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .lead {
      font-size: clamp(16px, 2vw, 20px);
      line-height: 1.7;
      color: rgba(255,255,255,0.85);
      max-width: 640px;
      margin: 0 0 28px;
    }
    .trust-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 28px 0 32px;
    }
    .trust-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      appearance: none;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .trust-pill:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.15);
      border-color: rgba(224,160,106,0.5);
      box-shadow: 0 8px 20px rgba(0,0,0,.2);
    }
    .trust-pill:active { transform: translateY(0); }
    .trust-pill i {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: rgba(26,122,82,0.3);
      color: #4CAF7A;
      font-style: normal;
      font-size: 12px;
      font-weight: 700;
    }
    .cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 40px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: transform 0.15s, background 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .btn.primary {
      background: linear-gradient(135deg, #B85A12 0%, #E0A06A 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 20px rgba(184,90,18,0.4);
    }
    .btn.primary:hover {
      box-shadow: 0 6px 28px rgba(184,90,18,0.5);
    }
    .btn.secondary {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
    }
    .btn.secondary:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.3);
    }
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .stat {
      text-align: center;
      padding: 16px 12px;
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(6px);
      transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .stat:hover {
      transform: translateY(-3px);
      background: rgba(255,255,255,0.1);
      border-color: rgba(224,160,106,0.45);
      box-shadow: 0 10px 26px rgba(0,0,0,0.25);
    }
    .stat b {
      display: block;
      font-family: "IBM Plex Serif", Georgia, serif;
      font-size: 32px;
      font-weight: 700;
      color: #E0A06A;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }
    .stat span {
      display: block;
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    @media (max-width: 900px) {
      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 600px) {
      .hero3d-overlay {
        padding: 60px 16px 40px;
      }
      .hero3d-content h1 {
        font-size: 32px;
      }
      .lead {
        font-size: 15px;
      }
      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .stat b {
        font-size: 24px;
      }
    }
  `,
})
export class Hero3DComponent implements OnInit, OnDestroy {
  private animationId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private nodes: ResourceNode[] = [];
  private edges: ResourceEdge[] = [];
  private startTime = 0;
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;
  private rawMouseX = -9999;
  private rawMouseY = -9999;
  private isBrowser: boolean;

  private readonly statTargets = { learners: 2847, completion: 87, phases: 17, hours: 120 };
  private statsAnimationId: number | null = null;

  readonly displayStats = signal({
    learners: '0',
    completion: '0%',
    phases: '0',
    hours: '0+',
  });

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.initCanvas();
    this.createGraph();
    this.startTime = performance.now();
    this.animate();
    this.bindEvents();
    this.animateStats();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.statsAnimationId) {
      cancelAnimationFrame(this.statsAnimationId);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
  }

  /** Jumps to a section elsewhere on the home page (same-page anchor, not a route change). */
  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Counts the stat bar up from 0 to its real value instead of showing static numbers. */
  private animateStats(): void {
    const duration = 1400;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const { learners, completion, phases, hours } = this.statTargets;
      this.displayStats.set({
        learners: Math.round(learners * eased).toLocaleString('en-US'),
        completion: Math.round(completion * eased) + '%',
        phases: Math.round(phases * eased) + '',
        hours: Math.round(hours * eased) + '+',
      });
      this.statsAnimationId = t < 1 ? requestAnimationFrame(tick) : null;
    };
    this.statsAnimationId = requestAnimationFrame(tick);
  }

  private initCanvas(): void {
    const container = document.querySelector('.hero3d') as HTMLElement;
    this.canvas = container?.querySelector('canvas') ?? null;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
  }

  private resize = (): void => {
    if (!this.canvas || !this.ctx) return;
    const container = this.canvas.parentElement as HTMLElement;
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private onResize = (): void => {
    this.resize();
  };

  private onMouseMove = (e: MouseEvent): void => {
    const container = this.canvas?.parentElement as HTMLElement;
    const rect = container.getBoundingClientRect();
    this.targetMouseX = (e.clientX - rect.left) / rect.width - 0.5;
    this.targetMouseY = (e.clientY - rect.top) / rect.height - 0.5;
    this.rawMouseX = e.clientX - rect.left;
    this.rawMouseY = e.clientY - rect.top;
  };

  /** Builds the FHIR resource graph — nodes positioned across the right/lower canvas so they stay clear of the headline, with edges matching real FHIR references (most resources point back to Patient). */
  private createGraph(): void {
    const byLabel = new Map<string, ResourceNode>();
    this.nodes = RESOURCE_NODES.map((def) => {
      const node = new ResourceNode(def.label, def.color, def.xFrac, def.yFrac, !!def.hub);
      byLabel.set(def.label, node);
      return node;
    });
    this.edges = RESOURCE_EDGES.map(([a, b]) => new ResourceEdge(byLabel.get(a)!, byLabel.get(b)!));
  }

  private animate = (): void => {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.clearRect(0, 0, width, height);

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    const t = (performance.now() - this.startTime) / 1000;
    this.nodes.forEach((n) => n.update(width, height, this.mouseX, this.mouseY, t));
    this.edges.forEach((e) => e.draw(this.ctx!, t));

    const hoverRadius = 28;
    this.nodes.forEach((n) => {
      const dx = n.x - this.rawMouseX;
      const dy = n.y - this.rawMouseY;
      n.draw(this.ctx!, Math.sqrt(dx * dx + dy * dy) < hoverRadius);
    });

    this.animationId = requestAnimationFrame(this.animate);
  };
}

interface ResourceNodeDef {
  label: string;
  color: string;
  xFrac: number;
  yFrac: number;
  hub?: boolean;
}

/** Positioned across the canvas's right/lower two-thirds so the network stays clear of the headline text on the left. */
const RESOURCE_NODES: ResourceNodeDef[] = [
  { label: 'Patient', color: '#E0A06A', xFrac: 0.60, yFrac: 0.42, hub: true },
  { label: 'Encounter', color: '#3B8FD4', xFrac: 0.78, yFrac: 0.20 },
  { label: 'Observation', color: '#3B8FD4', xFrac: 0.93, yFrac: 0.38 },
  { label: 'Condition', color: '#3B8FD4', xFrac: 0.74, yFrac: 0.64 },
  { label: 'MedicationRequest', color: '#4CAF7A', xFrac: 0.88, yFrac: 0.70 },
  { label: 'Practitioner', color: '#E0A06A', xFrac: 0.56, yFrac: 0.76 },
  { label: 'Organization', color: '#E0A06A', xFrac: 0.96, yFrac: 0.82 },
  { label: 'DiagnosticReport', color: '#4CAF7A', xFrac: 0.68, yFrac: 0.90 },
  { label: 'AllergyIntolerance', color: '#3B8FD4', xFrac: 0.53, yFrac: 0.58 },
  { label: 'Immunization', color: '#3B8FD4', xFrac: 0.50, yFrac: 0.30 },
  { label: 'CarePlan', color: '#E0A06A', xFrac: 0.60, yFrac: 0.12 },
  { label: 'Procedure', color: '#3B8FD4', xFrac: 0.98, yFrac: 0.58 },
  { label: 'Coverage', color: '#4CAF7A', xFrac: 0.38, yFrac: 0.82 },
];

/** Mirrors real FHIR references (Patient is the subject of most clinical resources). */
const RESOURCE_EDGES: [string, string][] = [
  ['Patient', 'Encounter'], ['Patient', 'Observation'], ['Patient', 'Condition'],
  ['Patient', 'MedicationRequest'], ['Patient', 'AllergyIntolerance'], ['Patient', 'Immunization'],
  ['Patient', 'CarePlan'], ['Patient', 'Coverage'],
  ['Encounter', 'Practitioner'], ['Encounter', 'Organization'], ['Encounter', 'DiagnosticReport'],
  ['Condition', 'Procedure'], ['MedicationRequest', 'Practitioner'],
  ['DiagnosticReport', 'Observation'], ['CarePlan', 'Procedure'],
];

/** A FHIR resource type rendered as a softly glowing, gently drifting graph node. */
class ResourceNode {
  x = 0;
  y = 0;
  readonly radius: number;
  private readonly phaseX = Math.random() * Math.PI * 2;
  private readonly phaseY = Math.random() * Math.PI * 2;
  private readonly speed = 0.22 + Math.random() * 0.18;
  private readonly ampX = 10 + Math.random() * 8;
  private readonly ampY = 10 + Math.random() * 8;

  constructor(
    readonly label: string,
    readonly color: string,
    private readonly xFrac: number,
    private readonly yFrac: number,
    readonly hub: boolean,
  ) {
    this.radius = hub ? 8 : 5;
  }

  update(width: number, height: number, mouseX: number, mouseY: number, t: number): void {
    const anchorX = this.xFrac * width;
    const anchorY = this.yFrac * height;
    this.x = anchorX + Math.cos(t * this.speed + this.phaseX) * this.ampX + mouseX * 18;
    this.y = anchorY + Math.sin(t * this.speed * 1.2 + this.phaseY) * this.ampY + mouseY * 18;
  }

  draw(ctx: CanvasRenderingContext2D, hovered: boolean): void {
    const r = hovered ? this.radius * 1.5 : this.radius;

    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 4.5);
    glow.addColorStop(0, this.color + (hovered ? 'aa' : '4d'));
    glow.addColorStop(1, this.color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 4.5, 0, Math.PI * 2);
    ctx.fill();

    if (this.hub) {
      const pulseT = (performance.now() / 1000 * 0.35) % 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + pulseT * 34, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(224,160,106,${(1 - pulseT) * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.stroke();

    ctx.font = hovered || this.hub ? '600 12px system-ui, -apple-system, sans-serif' : '500 10.5px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = hovered ? 'rgba(255,255,255,0.95)' : this.hub ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText(this.label, this.x, this.y - r - 8);
  }
}

/** A reference between two resource nodes, drawn as a faint line with a data pulse travelling along it. */
class ResourceEdge {
  private readonly offset = Math.random();
  private readonly speed = 0.1 + Math.random() * 0.06;

  constructor(readonly a: ResourceNode, readonly b: ResourceNode) {}

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.strokeStyle = 'rgba(224,160,106,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const progress = (t * this.speed + this.offset) % 1;
    const px = this.a.x + (this.b.x - this.a.x) * progress;
    const py = this.a.y + (this.b.y - this.a.y) * progress;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#E0A06A';
    ctx.shadowColor = '#E0A06A';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}