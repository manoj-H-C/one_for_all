import { Component, ElementRef, OnDestroy, AfterViewInit, effect, input, model, signal, viewChild } from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import { IconComponent } from './icon';

/**
 * A true WYSIWYG editor (Tiptap/ProseMirror under the hood): clicking Bold
 * makes the selected text bold, no raw markdown syntax is ever shown. The
 * value is plain HTML - the same string that description was always stored
 * as, still a plain `text` column on the backend, just populated with
 * ProseMirror's HTML output instead of hand-typed text.
 *
 * Tiptap has no official Angular wrapper, so this drives its vanilla-JS
 * Editor class directly against a plain host div, which is the pattern
 * Tiptap's own docs recommend for non-React/Vue frameworks.
 */
@Component({
  selector: 'app-rich-text-editor',
  imports: [IconComponent],
  template: `
    <div class="tiptap-editor overflow-hidden rounded-xl border border-slate-300/90 bg-white transition-all duration-150 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/15">
      <div class="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/70 px-2 py-1.5">
        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('bold')" title="Bold" (mousedown)="$event.preventDefault()" (click)="toggleBold()">
          <span class="text-[13px] font-bold">B</span>
        </button>
        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('italic')" title="Italic" (mousedown)="$event.preventDefault()" (click)="toggleItalic()">
          <span class="text-[13px] italic">i</span>
        </button>
        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('underline')" title="Underline" (mousedown)="$event.preventDefault()" (click)="toggleUnderline()">
          <span class="text-[13px] underline">U</span>
        </button>
        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('strike')" title="Strikethrough" (mousedown)="$event.preventDefault()" (click)="toggleStrike()">
          <span class="text-[13px] line-through">S</span>
        </button>

        <span class="mx-1 h-4 w-px bg-slate-200"></span>

        <button
          type="button"
          class="fmt-btn"
          [class.fmt-btn-active]="active('heading', { level: 1 })"
          title="Heading"
          (mousedown)="$event.preventDefault()"
          (click)="toggleHeading(1)"
        >
          <span class="text-[11px] font-bold">H1</span>
        </button>
        <button
          type="button"
          class="fmt-btn"
          [class.fmt-btn-active]="active('heading', { level: 2 })"
          title="Subheading"
          (mousedown)="$event.preventDefault()"
          (click)="toggleHeading(2)"
        >
          <span class="text-[11px] font-bold">H2</span>
        </button>

        <span class="mx-1 h-4 w-px bg-slate-200"></span>

        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('bulletList')" title="Bulleted list" (mousedown)="$event.preventDefault()" (click)="toggleBulletList()">
          <app-icon name="list" [size]="14" />
        </button>
        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('orderedList')" title="Numbered list" (mousedown)="$event.preventDefault()" (click)="toggleOrderedList()">
          <span class="text-[11px] font-semibold">1.</span>
        </button>
        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('blockquote')" title="Quote" (mousedown)="$event.preventDefault()" (click)="toggleBlockquote()">
          <span class="text-[13px]">"</span>
        </button>

        <span class="mx-1 h-4 w-px bg-slate-200"></span>

        <button type="button" class="fmt-btn" [class.fmt-btn-active]="active('codeBlock')" title="Code block" (mousedown)="$event.preventDefault()" (click)="toggleCodeBlock()">
          <app-icon name="code" [size]="14" />
        </button>
      </div>

      <div #editorHost class="max-h-[28rem] cursor-text overflow-y-auto px-3.5 py-2.5" (click)="focusEditor()"></div>
    </div>
  `,
})
export class RichTextEditorComponent implements AfterViewInit, OnDestroy {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Add a description…');

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('editorHost');

  protected editor?: Editor;
  // bumped on every editor transaction purely to give the template's
  // active()/isActive() reads a signal to depend on - Tiptap's own state
  // isn't itself a signal, so without this the toolbar's pressed states
  // would never re-render as the cursor moves or marks toggle.
  private readonly tick = signal(0);

  constructor() {
    // syncs external resets (e.g. the work-item detail page's "Discard"
    // button) into the live editor. Guarded by the content comparison so
    // the editor's own onUpdate -> value.set() round-trip never feeds back
    // into itself and resets the cursor mid-keystroke.
    effect(() => {
      const next = this.value();
      if (this.editor && this.editor.getHTML() !== next) {
        this.editor.commands.setContent(next, { emitUpdate: false });
      }
    });
  }

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.hostRef().nativeElement,
      extensions: [
        // link and table stay registered (not `false`) even though the
        // toolbar no longer has buttons for either - disabling them outright
        // would make the schema forget those node/mark types, which means
        // any *existing* description that already has a table or a link
        // would silently lose that content the moment it's next parsed and
        // re-saved. Keeping the extensions just means old content keeps
        // round-tripping correctly; nothing in the UI offers a way to
        // create a new one.
        StarterKit.configure({ heading: { levels: [1, 2] } }),
        TableKit.configure({ table: { resizable: true } }),
        Placeholder.configure({ placeholder: this.placeholder() }),
      ],
      content: this.value(),
      editorProps: {
        attributes: { class: 'rich-text-body focus:outline-none' },
      },
      onUpdate: ({ editor }) => this.value.set(editor.getHTML()),
      onTransaction: () => this.tick.update((v) => v + 1),
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  protected active(name: string, attrs?: Record<string, unknown>): boolean {
    this.tick();
    return this.editor?.isActive(name, attrs) ?? false;
  }

  protected toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  protected toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  protected toggleUnderline(): void {
    this.editor?.chain().focus().toggleUnderline().run();
  }

  protected toggleStrike(): void {
    this.editor?.chain().focus().toggleStrike().run();
  }

  protected toggleHeading(level: 1 | 2): void {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }

  protected toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  protected toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  protected toggleBlockquote(): void {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  protected toggleCodeBlock(): void {
    this.editor?.chain().focus().toggleCodeBlock().run();
  }

  protected focusEditor(): void {
    this.editor?.commands.focus();
  }
}
