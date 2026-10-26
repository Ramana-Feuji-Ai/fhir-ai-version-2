import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

/**
 * Renders AI-generated markdown (tables, headings, lists, bold) as HTML for an [innerHTML] binding.
 * Angular sanitizes [innerHTML] automatically (strips scripts/unsafe attrs), so no manual
 * sanitization is needed here. Pair with the global `.markdown` CSS (fhi-fhir-learning.css) so
 * tables and headings render legibly instead of collapsing to unstyled browser defaults.
 */
@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  transform(text: string | null | undefined): string {
    if (!text) return '';
    return marked.parse(text, { async: false, breaks: true }) as string;
  }
}
