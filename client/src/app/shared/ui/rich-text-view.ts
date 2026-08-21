import { Component, computed, input } from '@angular/core';
import DOMPurify from 'dompurify';

/**
 * Read-only render of HTML produced by RichTextEditorComponent (Tiptap).
 * Sanitized with DOMPurify before hitting [innerHTML] - the stored value
 * could in principle have come from anywhere (a direct API call, a future
 * import), not only this app's own editor, so it's never trusted as-is.
 * Angular's own template-binding sanitizer runs on top of that as a second
 * layer.
 */
@Component({
  selector: 'app-rich-text-view',
  template: `<div class="rich-text-body" [innerHTML]="html()"></div>`,
})
export class RichTextViewComponent {
  readonly content = input<string>('');

  readonly html = computed(() => {
    const raw = this.content()?.trim();
    return raw ? DOMPurify.sanitize(raw) : '';
  });
}
