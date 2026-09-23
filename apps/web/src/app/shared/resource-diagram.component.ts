import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceNodeComponent } from './resource-node.component';

@Component({
  selector: 'fhi-resource-diagram',
  standalone: true,
  imports: [CommonModule, ResourceNodeComponent],
  template: `
    <div class="resourceDiagram" #container>
      @if (resourceSig()) {
        <div class="resourceTree">
          <fhi-resource-node
            [node]="resourceSig()!"
            [path]="'root'"
            [expandedPaths]="expandedPaths()"
            [highlightedPath]="highlightedPath"
            [level]="0"
            (toggle)="onToggle($event)"
            (click)="onNodeClick($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .resourceDiagram {
      width: 100%;
      min-height: 300px;
      overflow: auto;
      font-family: var(--font);
    }
    .resourceTree {
      padding: 10px;
    }
  `],
})
export class ResourceDiagramComponent {
  @Input() resource: ResourceNode | null = null;
  @Input() highlightedPath: string[] = [];
  @Output() pathClick = new EventEmitter<string>();

  protected readonly resourceSig = computed(() => this.resource);
  readonly expandedPaths = signal<Set<string>>(new Set(['root']));

  onToggle(path: string): void {
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

  onNodeClick(path: string): void {
    this.pathClick.emit(path);
  }
}

export interface ResourceNode {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  children?: ResourceNode[];
}