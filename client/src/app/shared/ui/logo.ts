import { Component, input } from '@angular/core';

/**
 * The Raidzo mark + wordmark. The mark is a hexagon (a crate/package
 * silhouette - the inventory side of the product) with a checkmark cut into
 * it (the task/approval side) - a shape chosen to encode what actually makes
 * Raidzo different (boards AND materials in one tool), not a stock "letter
 * in a rounded square". Used anywhere the brand shows up - currently the
 * landing page's nav and footer.
 */
@Component({
  selector: 'app-logo',
  template: `
    <div class="group inline-flex items-center" [class.gap-2]="size() === 'sm'" [class.gap-2.5]="size() === 'md'">
      <svg
        [attr.width]="size() === 'sm' ? 28 : 42"
        [attr.height]="size() === 'sm' ? 28 : 42"
        viewBox="0 0 100 100"
        class="shrink-0 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110"
        style="filter: drop-shadow(0 3px 8px rgb(124 58 237 / 0.45))"
      >
        <defs>
          <linearGradient [attr.id]="gradientId" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#a78bfa" />
            <stop offset="50%" stop-color="#7c3aed" />
            <stop offset="100%" stop-color="#22d3ee" />
          </linearGradient>
        </defs>
        <!-- flat-top hexagon: a crate viewed face-on -->
        <polygon points="92,50 71,86.4 29,86.4 8,50 29,13.6 71,13.6" [attr.fill]="'url(#' + gradientId + ')'" />
        <!-- glossy top highlight -->
        <polygon points="71,13.6 29,13.6 20,29 80,29" fill="white" opacity="0.16" />
        <!-- checkmark, cut in white -->
        <path d="M31,51 L44,65 L71,35" fill="none" stroke="white" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      @if (wordmark()) {
        <span
          class="font-extrabold tracking-tight {{ size() === 'sm' ? 'text-sm' : 'text-lg' }} {{
            theme() === 'dark' ? 'text-white' : 'text-slate-800'
          }}"
        >
          Raidzo
        </span>
      }
    </div>
  `,
})
export class LogoComponent {
  readonly size = input<'sm' | 'md'>('md');
  readonly theme = input<'light' | 'dark'>('dark');
  readonly wordmark = input<boolean>(true);

  // unique per instance so two <app-logo>s on one page (nav + footer) don't
  // collide on the same #id inside their own <defs> gradient.
  protected readonly gradientId = `raidzo-mark-${Math.random().toString(36).slice(2, 9)}`;
}
