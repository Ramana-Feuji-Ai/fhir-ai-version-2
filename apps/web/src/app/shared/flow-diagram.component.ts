import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fhi-flow-diagram',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg #svgRef class="flowSvg" viewBox="0 0 800 500" (click)="onSvgClick()">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#9AA8B8" />
        </marker>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Edges -->
      @for (edge of edgeList(); track edge.id) {
        <path
          class="flowEdge"
          [attr.d]="getEdgePath(edge)"
          [attr.marker-end]="'url(#arrowhead)'"
          [class.highlighted]="isEdgeHighlighted(edge)"
          stroke="#9AA8B8"
          stroke-width="2"
          fill="none"
        />
        @if (edge.label) {
          <text class="edgeLabel" [attr.x]="getEdgeLabelX(edge)" [attr.y]="getEdgeLabelY(edge)" text-anchor="middle" font-size="11" fill="#5A7390">
            <textPath [attr.href]="'#edgePath-' + edge.id" startOffset="50%">{{ edge.label }}</textPath>
          </text>
        }
      }

      <!-- Nodes -->
      @for (node of nodeList(); track node.id) {
        <g class="flowNode" [attr.transform]="'translate(' + node.x + ',' + node.y + ')'" (click)="onNodeClick(node, $event)">
          <rect
            class="nodeShape"
            [attr.width]="nodeWidth(node)"
            [attr.height]="nodeHeight(node)"
            [attr.x]="-nodeWidth(node)/2"
            [attr.y]="-nodeHeight(node)/2"
            [attr.rx]="node.type === 'decision' ? 0 : 8"
            [attr.ry]="node.type === 'decision' ? 0 : 8"
            [attr.transform]="node.type === 'decision' ? 'rotate(45)' : ''"
            [attr.fill]="getNodeFill(node)"
            [attr.stroke]="getNodeStroke(node)"
            [attr.stroke-width]="getNodeStrokeWidth(node)"
            [attr.filter]="highlightedNode()?.id === node.id ? 'url(#glow)' : 'none'"
          />
          @if (node.type === 'start' || node.type === 'end') {
            <circle
              [attr.r]="minNodeDimension(node) / 2 - 4"
              [attr.fill]="getNodeFill(node)"
              [attr.stroke]="getNodeStroke(node)"
              [attr.stroke-width]="getNodeStrokeWidth(node)"
              [attr.filter]="highlightedNode()?.id === node.id ? 'url(#glow)' : 'none'"
            />
          }
          <text
            class="nodeLabel"
            x="0"
            y="0"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="11"
            font-weight="600"
            fill="white"
            [style.max-width.px]="nodeWidth(node) - 10"
          >{{ node.label }}</text>
        </g>
      }
    </svg>
  `,
  styles: [`
    .flowSvg {
      width: 100%;
      height: 100%;
      min-height: 300px;
      cursor: crosshair;
    }
    .flowEdge {
      transition: stroke 0.2s, stroke-width 0.2s;
    }
    .flowEdge.highlighted {
      stroke: var(--b6);
      stroke-width: 3;
    }
    .edgeLabel {
      pointer-events: none;
    }
    .flowNode {
      cursor: pointer;
      transition: transform 0.15s;
    }
    .flowNode:hover {
      transform: scale(1.05);
    }
    .nodeLabel {
      pointer-events: none;
      user-select: none;
    }
  `],
})
export class FlowDiagramComponent implements AfterViewInit {
  @ViewChild('svgRef') svgRef!: ElementRef<SVGSVGElement>;
  
  @Input() nodes: FlowNode[] = [];
  @Input() edges: FlowEdge[] = [];
  @Input() highlightNode: FlowNode | null = null;
  @Output() nodeClick = new EventEmitter<FlowNode>();

  readonly highlightedNode = signal<FlowNode | null>(null);

  protected readonly nodeList = computed(() => this.nodes);
  protected readonly edgeList = computed(() => this.edges.map((e, i) => ({ ...e, id: e.id || `edge-${i}` })));

  ngAfterViewInit(): void {
    // Force SVG to render properly
  }

  onNodeClick(node: FlowNode, event: MouseEvent): void {
    event.stopPropagation();
    this.highlightedNode.set(node);
    this.nodeClick.emit(node);
  }

  onSvgClick(_event?: MouseEvent): void {
    this.highlightedNode.set(null);
  }

  isEdgeHighlighted(edge: FlowEdge): boolean {
    const hn = this.highlightedNode();
    if (!hn) return false;
    return edge.from === hn.id || edge.to === hn.id;
  }

  getEdgePath(edge: FlowEdge): string {
    const fromNode = this.nodes.find(n => n.id === edge.from);
    const toNode = this.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return '';
    
    const x1 = fromNode.x;
    const y1 = fromNode.y;
    const x2 = toNode.x;
    const y2 = toNode.y;
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = Math.min(50, dist * 0.3);
    const perpX = -dy / dist * offset;
    const perpY = dx / dist * offset;
    
    return `M${x1},${y1} Q${midX + perpX},${midY + perpY} ${x2},${y2}`;
  }

  getEdgeLabelX(edge: FlowEdge): number {
    const fromNode = this.nodes.find(n => n.id === edge.from);
    const toNode = this.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return 0;
    return (fromNode.x + toNode.x) / 2;
  }

  getEdgeLabelY(edge: FlowEdge): number {
    const fromNode = this.nodes.find(n => n.id === edge.from);
    const toNode = this.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return 0;
    return (fromNode.y + toNode.y) / 2 - 10;
  }

  nodeWidth(node: FlowNode): number {
    const textWidth = node.label.length * 7;
    return Math.max(120, Math.min(200, textWidth + 24));
  }

  nodeHeight(node: FlowNode): number {
    if (node.type === 'decision') return 70;
    return 50;
  }

  minNodeDimension(node: FlowNode): number {
    return Math.min(this.nodeWidth(node), this.nodeHeight(node));
  }

  getNodeFill(node: FlowNode): string {
    const hn = this.highlightedNode();
    if (hn?.id === node.id) {
      return node.type === 'start' ? '#4CAF7A' : (node.type === 'end' ? '#c44' : (node.type === 'decision' ? '#E0A06A' : '#3B8FD4'));
    }
    switch (node.type) {
      case 'start': return '#4CAF7A';
      case 'end': return '#c44';
      case 'decision': return '#E0A06A';
      default: return '#3B8FD4';
    }
  }

  getNodeStroke(node: FlowNode): string {
    const hn = this.highlightedNode();
    if (hn?.id === node.id) return '#fff';
    return '#fff';
  }

  getNodeStrokeWidth(node: FlowNode): number {
    const hn = this.highlightedNode();
    return hn?.id === node.id ? 3 : 2;
  }
}

export interface FlowNode {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  type?: 'start' | 'process' | 'decision' | 'end';
  resources?: string[];
}

export interface FlowEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
}