import { inject, Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

/**
 * Converts a markdown string to sanitized HTML safe for Angular [innerHTML].
 *
 * Usage:  <div [innerHTML]="text | markdown"></div>
 */
@Pipe({
  name: 'markdown',
  standalone: true,
  pure: true,
})
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const raw = marked.parse(value, { async: false }) as string;
    // Sanitize via Angular's DomSanitizer to strip dangerous tags/attributes
    const safe = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(safe);
  }
}
