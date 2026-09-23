import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowDiagramComponent } from './flow-diagram.component';
import { SequenceDiagramComponent } from './sequence-diagram.component';
import { ResourceDiagramComponent } from './resource-diagram.component';

@Component({
  selector: 'fhi-diagram-widget',
  standalone: true,
  imports: [CommonModule, FlowDiagramComponent, SequenceDiagramComponent, ResourceDiagramComponent],
  template: `
    <div class="diagramWidget">
      <div class="diagramHeader">
        <span class="diagramBadge">Interactive Diagram</span>
        <h5>{{ data.title }}</h5>
        @if (data.description) {
          <p class="diagramDesc">{{ data.description }}</p>
        }
      </div>
      <div class="diagramCanvas" #canvas>
        @if (data.type === 'flow') {
          <fhi-flow-diagram [nodes]="data.nodes || []" [edges]="data.edges || []" [highlightNode]="highlightedNode()" (nodeClick)="onNodeClick($event)" />
        } @else if (data.type === 'sequence') {
          <fhi-sequence-diagram [steps]="data.steps || []" [currentStep]="currentStep()" (stepClick)="onStepClick($event)" />
        } @else if (data.type === 'resource') {
          <fhi-resource-diagram [resource]="data.resource || null" [highlightedPath]="highlightedPath()" (pathClick)="onPathClick($event)" />
        } @else {
          <div class="diagramPlaceholder">
            <svg viewBox="0 0 100 100" class="diagramIcon">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M30 50 L45 65 L70 35" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Diagram type "{{ data.type }}" not yet implemented</p>
          </div>
        }
      </div>
      @if (data.type === 'flow' && highlightedNode()) {
        <div class="diagramDetail">
          <h6>{{ highlightedNode()!.label }}</h6>
          <p>{{ highlightedNode()!.description }}</p>
          @if (highlightedNode()!.resources) {
            <div class="relatedResources">
              <strong>Related Resources:</strong>
              <span *ngFor="let r of highlightedNode()!.resources" class="resourceTag">{{ r }}</span>
            </div>
          }
        </div>
      }
      @if (data.type === 'sequence' && currentStep() !== null && data.steps && data.steps[currentStep()!]) {
        <div class="diagramDetail">
          <h6>Step {{ currentStep()! + 1 }}: {{ data.steps[currentStep()!].title }}</h6>
          <p>{{ data.steps[currentStep()!].description }}</p>
          @if (data.steps[currentStep()!].code) {
            <pre><code>{{ data.steps[currentStep()!].code }}</code></pre>
          }
        </div>
      }
      <div class="diagramControls">
        @if (data.type === 'sequence') {
          <button class="btn small" (click)="prevStep()" [disabled]="currentStep() === 0">← Previous</button>
          <span class="stepCounter">Step {{ currentStep()! + 1 }} of {{ data.steps?.length }}</span>
          <button class="btn small" (click)="nextStep()" [disabled]="currentStep() === (data.steps?.length || 1) - 1">Next →</button>
        }
        @if (data.type === 'resource') {
          <button class="btn small" (click)="expandAll()">Expand All</button>
          <button class="btn small" (click)="collapseAll()">Collapse All</button>
        }
      </div>
    </div>
  `,
  styles: `
    .diagramWidget {
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 10px;
      padding: 20px;
    }
    .diagramHeader {
      margin-bottom: 20px;
    }
    .diagramBadge {
      display: inline-block;
      padding: 3px 8px;
      background: var(--o1);
      color: var(--o7);
      border-radius: 4px;
      font-size: 10px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }
    .diagramHeader h5 {
      margin: 0 0 4px;
      font-size: 15px;
      color: var(--n9);
    }
    .diagramDesc {
      margin: 0;
      font-size: 13px;
      color: var(--n5);
    }
    .diagramCanvas {
      min-height: 300px;
      background: var(--n0);
      border: 1px solid #D7E2EC;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      overflow: auto;
    }
    .diagramPlaceholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 200px;
      color: var(--n5);
      text-align: center;
      gap: 12px;
    }
    .diagramIcon {
      width: 64px;
      height: 64px;
      color: var(--b6);
    }
    .diagramDetail {
      padding: 16px;
      background: linear-gradient(135deg, #F7FAFC 0%, #EEF3F7 100%);
      border: 1px solid #D7E2EC;
      border-radius: 8px;
      border-left: 4px solid var(--b6);
      margin-bottom: 16px;
    }
    .diagramDetail h6 {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--n9);
    }
    .diagramDetail p {
      margin: 0 0 12px;
      font-size: 13px;
      color: var(--n6);
      line-height: 1.5;
    }
    .relatedResources {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .relatedResources strong {
      font-size: 12px;
      color: var(--n6);
      margin-right: 8px;
    }
    .resourceTag {
      font-size: 11px;
      padding: 3px 8px;
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 999px;
      color: var(--b6);
    }
    .diagramDetail pre {
      margin: 0;
      padding: 12px;
      background: #0D1B2A;
      border-radius: 6px;
      overflow-x: auto;
    }
    .diagramDetail code {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 11px;
      color: #E0A06A;
      line-height: 1.5;
    }
    .diagramControls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--n1);
    }
    .stepCounter {
      font-size: 13px;
      color: var(--n6);
      font-weight: 500;
    }
    .btn.small {
      padding: 6px 12px;
      font-size: 11px;
      min-height: 32px;
    }
  `,
})
export class DiagramWidgetComponent {
  @Input({ required: true }) data!: {
    type: 'flow' | 'sequence' | 'resource';
    title: string;
    description?: string;
    nodes?: FlowNode[];
    edges?: FlowEdge[];
    steps?: SequenceStep[];
    resource?: ResourceNode;
  };

  readonly highlightedNode = signal<FlowNode | null>(null);
  readonly currentStep = signal(0);
  readonly highlightedPath = signal<string[]>([]);
  readonly expandedPaths = signal<Set<string>>(new Set());

  onNodeClick(node: FlowNode): void {
    this.highlightedNode.set(node);
  }

  onStepClick(index: number): void {
    this.currentStep.set(index);
  }

  onPathClick(path: string): void {
    this.expandedPaths.update(set => {
      const newSet = new Set(set);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }

  prevStep(): void {
    this.currentStep.update(s => Math.max(0, s - 1));
  }

  nextStep(): void {
    const max = (this.data.steps?.length || 1) - 1;
    this.currentStep.update(s => Math.min(max, s + 1));
  }

  expandAll(): void {
    if (this.data.resource) {
      this.collectAllPaths(this.data.resource).forEach(p => this.expandedPaths.update(s => s.add(p)));
    }
  }

  collapseAll(): void {
    this.expandedPaths.set(new Set());
  }

  private collectAllPaths(node: ResourceNode, prefix = ''): string[] {
    const path = prefix ? `${prefix}.${node.name}` : node.name;
    const paths = [path];
    if (node.children) {
      node.children.forEach(child => {
        paths.push(...this.collectAllPaths(child, path));
      });
    }
    return paths;
  }
}

interface FlowNode {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  type?: 'start' | 'process' | 'decision' | 'end';
  resources?: string[];
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface SequenceStep {
  title: string;
  description: string;
  code?: string;
  actor?: string;
}

interface ResourceNode {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  children?: ResourceNode[];
}