import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceNode } from './resource-diagram.component';

@Component({
  selector: 'fhi-resource-node',
  standalone: true,
  imports: [CommonModule, ResourceNodeComponent],
  template: `
    <div class="resourceNode" [class.highlighted]="isHighlighted()">
      <div class="nodeHeader" (click)="onHeaderClick(path)">
        <button 
          class="expandBtn" 
          (click)="onToggle(path)"
          [attr.aria-expanded]="isExpanded()"
          *ngIf="hasChildren()"
        >
          {{ isExpanded() ? '▼' : '▶' }}
        </button>
        <span class="required" *ngIf="node.required" title="Required">●</span>
        <span class="nodeName">{{ node.name }}</span>
        <span class="nodeType">{{ node.type }}</span>
        <span class="nodePath" *ngIf="path !== 'root'">{{ path }}</span>
      </div>
      <div class="nodeDescription" *ngIf="node.description">{{ node.description }}</div>
      <div class="nodeChildren" *ngIf="isExpanded() && hasChildren()">
        @for (child of node.children || []; track child.name) {
          <fhi-resource-node
            [node]="child"
            [path]="path + '.' + child.name"
            [expandedPaths]="expandedPaths"
            [highlightedPath]="highlightedPath"
            [level]="level + 1"
            (toggle)="onToggle($event)"
            (click)="onNodeClick($event)"
          />
        }
      </div>
    </div>
  `,
  styles: [`
    .resourceNode {
      border-left: 2px solid var(--n1);
      margin-left: 12px;
      padding-left: 12px;
      position: relative;
    }
    .resourceNode.highlighted {
      border-left-color: var(--b6);
    }
    .resourceNode.highlighted .nodeHeader {
      background: var(--b1);
      border-radius: 4px;
    }
    .nodeHeader {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
      user-select: none;
    }
    .nodeHeader:hover {
      background: var(--n0);
    }
    .expandBtn {
      width: 20px;
      height: 20px;
      border: none;
      background: var(--n0);
      border-radius: 4px;
      display: grid;
      place-items: center;
      font-size: 10px;
      color: var(--n6);
      cursor: pointer;
      flex: none;
    }
    .expandBtn:hover {
      background: var(--b1);
      color: var(--b6);
    }
    .required {
      color: #c44;
      font-size: 10px;
      line-height: 1;
    }
    .nodeName {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 12px;
      font-weight: 600;
      color: var(--n9);
    }
    .nodeType {
      font-size: 10px;
      padding: 2px 6px;
      background: var(--b1);
      color: var(--b6);
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .nodePath {
      font-size: 9px;
      color: var(--n5);
      font-family: ui-monospace, Consolas, monospace;
      margin-left: auto;
    }
    .nodeDescription {
      margin: 4px 0 8px 28px;
      font-size: 11px;
      color: var(--n5);
      line-height: 1.4;
    }
    .nodeChildren {
      animation: slideDown 0.2s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: none; }
    }
  `],
})
export class ResourceNodeComponent {
  @Input({ required: true }) node!: ResourceNode;
  @Input({ required: true }) path!: string;
  @Input({ required: true }) expandedPaths!: Set<string>;
  @Input({ required: true }) highlightedPath!: string[];
  @Input({ required: true }) level!: number;
  @Output() toggle = new EventEmitter<string>();
  @Output() click = new EventEmitter<string>();

  isExpanded(): boolean {
    return this.expandedPaths.has(this.path);
  }

  isHighlighted(): boolean {
    return this.highlightedPath.includes(this.path);
  }

  hasChildren(): boolean {
    return !!(this.node.children && this.node.children.length > 0);
  }

  onToggle(path: string): void {
    this.toggle.emit(path);
  }

  onHeaderClick(path: string): void {
    if (this.hasChildren()) return;
    this.click.emit(path);
  }

  onNodeClick(path: string): void {
    this.click.emit(path);
  }
}