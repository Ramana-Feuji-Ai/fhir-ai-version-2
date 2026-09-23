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
            <span class="trust-pill"><i>✓</i> 17 Learning Phases</span>
            <span class="trust-pill"><i>✓</i> 200+ Interactive Topics</span>
            <span class="trust-pill"><i>✓</i> Video-Enhanced Lessons</span>
            <span class="trust-pill"><i>✓</i> Hands-on Mock Assessments & Quizzes</span>
          </div>
          <div class="cta-row">
            <a class="btn primary" routerLink="/" fragment="courses">Explore Courses</a>
            <a class="btn secondary" routerLink="/phase/1">Start Phase 1 →</a>
          </div>
          <div class="stats-bar">
            <div class="stat"><b>{{ stats().learners }}</b><span>Active Learners</span></div>
            <div class="stat"><b>{{ stats().completion }}</b><span>Completion Rate</span></div>
            <div class="stat"><b>{{ stats().phases }}</b><span>Phases</span></div>
            <div class="stat"><b>{{ stats().hours }}</b><span>Learning Hours</span></div>
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
    .hero3d canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
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
      font-size: 13px;
      font-weight: 600;
      backdrop-filter: blur(10px);
      transition: transform 0.2s, background 0.2s, border-color 0.2s;
    }
    .trust-pill:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.15);
      border-color: rgba(224,160,106,0.5);
    }
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
    }
    .stat b {
      display: block;
      font-family: "IBM Plex Serif", Georgia, serif;
      font-size: 32px;
      font-weight: 700;
      color: #E0A06A;
      line-height: 1.2;
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
  private particles: Particle[] = [];
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;
  private isBrowser: boolean;

  readonly stats = signal({
    learners: '2,847',
    completion: '87%',
    phases: '17',
    hours: '120+',
  });

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.initCanvas();
    this.createParticles();
    this.animate();
    this.bindEvents();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
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
  };

  private createParticles(): void {
    this.particles = [];
    const count = Math.min(120, window.innerWidth / 8);
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle());
    }
  }

  private animate = (): void => {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.clearRect(0, 0, width, height);

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    this.particles.forEach(p => {
      p.update(width, height, this.mouseX, this.mouseY);
      p.draw(this.ctx!);
    });

    this.drawConnections(width, height);

    this.animationId = requestAnimationFrame(this.animate);
  };

  private drawConnections(width: number, height: number): void {
    if (!this.ctx) return;
    const maxDist = 140;
    this.ctx.strokeStyle = 'rgba(224,160,106,0.15)';
    this.ctx.lineWidth = 0.5;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          this.ctx.globalAlpha = (1 - dist / maxDist) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
    this.ctx.globalAlpha = 1;
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  baseX: number;
  baseY: number;
  angle: number;
  speed: number;
  orbitRadius: number;

  constructor() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.size = Math.random() * 2 + 0.5;
    this.color = Math.random() > 0.6 ? '#E0A06A' : (Math.random() > 0.3 ? '#3B8FD4' : '#4CAF7A');
    this.baseX = this.x;
    this.baseY = this.y;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.002 + 0.0005;
    this.orbitRadius = Math.random() * 30 + 10;
  }

  update(width: number, height: number, mouseX: number, mouseY: number): void {
    this.angle += this.speed;
    this.baseX += this.vx;
    this.baseY += this.vy;

    const targetX = width / 2 + mouseX * width * 0.3;
    const targetY = height / 2 + mouseY * height * 0.3;

    this.x = this.baseX + Math.cos(this.angle) * this.orbitRadius;
    this.y = this.baseY + Math.sin(this.angle) * this.orbitRadius;

    this.x += (targetX - this.x) * 0.001;
    this.y += (targetY - this.y) * 0.001;

    if (this.baseX < -50) this.baseX = width + 50;
    if (this.baseX > width + 50) this.baseX = -50;
    if (this.baseY < -50) this.baseY = height + 50;
    if (this.baseY > height + 50) this.baseY = -50;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}