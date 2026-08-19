import { Component, input } from '@angular/core';

export type IconName =
  | 'board'
  | 'members'
  | 'roles'
  | 'workflow'
  | 'fields'
  | 'settings'
  | 'folder'
  | 'bell'
  | 'building'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'logout'
  | 'key'
  | 'plus'
  | 'search'
  | 'check'
  | 'mail'
  | 'lock'
  | 'user'
  | 'sparkles'
  | 'arrow-left'
  | 'calendar'
  | 'filter'
  | 'trash'
  | 'grip'
  | 'text'
  | 'hash'
  | 'toggle'
  | 'list'
  | 'photo'
  | 'pin'
  | 'edit'
  | 'at'
  | 'message'
  | 'menu';

/** Inline Heroicons-style outline icons (24x24, stroke-based) - no external asset requests, no emoji. */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.viewBox]="'0 0 24 24'"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      [style.width.px]="size()"
      [style.height.px]="size()"
      class="shrink-0"
    >
      @switch (name()) {
        @case ('board') {
          <rect x="3.5" y="4" width="17" height="16" rx="2" />
          <path d="M9 4v16M15 4v16" />
        }
        @case ('members') {
          <path d="M17 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 5 18.5V20" />
          <circle cx="9.5" cy="8" r="3" />
          <path d="M19 20v-1.5a3 3 0 0 0-2-2.83M14.5 5.2a3 3 0 0 1 0 5.6" />
        }
        @case ('roles') {
          <path d="M12 3l7 3v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3z" />
          <path d="M9.5 12l1.8 1.8L15 10" />
        }
        @case ('workflow') {
          <path d="M4 6h9a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H8a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h12" />
          <path d="M16.5 15.5L20 18.5l-3.5 3M17.5 5.5L14 8.5l3.5 3" />
        }
        @case ('fields') {
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3.25" />
          <path
            d="M12 3.75v1.6M12 18.65v1.6M20.25 12h-1.6M5.35 12h-1.6M17.66 6.34l-1.13 1.13M7.47 16.53l-1.13 1.13M17.66 17.66l-1.13-1.13M7.47 7.47 6.34 6.34"
          />
        }
        @case ('folder') {
          <path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-11z" />
        }
        @case ('bell') {
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        }
        @case ('building') {
          <rect x="4" y="3.5" width="10" height="17" rx="1" />
          <path d="M14 9.5h5.5a1 1 0 0 1 1 1V20a.5.5 0 0 1-.5.5H14" />
          <path d="M7.5 7.5h.01M10.5 7.5h.01M7.5 11h.01M10.5 11h.01M7.5 14.5h.01M10.5 14.5h.01M17 13h.01M17 16.5h.01" />
        }
        @case ('chevron-left') {
          <path d="M14.5 5.5L8 12l6.5 6.5" />
        }
        @case ('chevron-right') {
          <path d="M9.5 5.5L16 12l-6.5 6.5" />
        }
        @case ('chevron-down') {
          <path d="M5.5 9.5L12 16l6.5-6.5" />
        }
        @case ('logout') {
          <path d="M15 17.5l4.5-5.5L15 6.5" />
          <path d="M19.3 12H9M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
        }
        @case ('key') {
          <circle cx="8" cy="15" r="4" />
          <path d="M11 12l7.5-7.5M16.5 6L19 8.5M13.5 9l2 2" />
        }
        @case ('plus') {
          <path d="M12 5.5v13M5.5 12h13" />
        }
        @case ('search') {
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.8-4.8" />
        }
        @case ('check') {
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        }
        @case ('mail') {
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="M4.5 7l7.5 6 7.5-6" />
        }
        @case ('lock') {
          <rect x="5" y="10.5" width="14" height="9" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        }
        @case ('user') {
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20v-1a7 7 0 0 1 14 0v1" />
        }
        @case ('sparkles') {
          <path d="M12 4l1.4 4.6L18 10l-4.6 1.4L12 16l-1.4-4.6L6 10l4.6-1.4L12 4z" />
          <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" />
        }
        @case ('arrow-left') {
          <path d="M19 12H5M11 6l-6 6 6 6" />
        }
        @case ('calendar') {
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
        }
        @case ('filter') {
          <path d="M4 5.5h16L14.5 12.5v6l-5 2v-8L4 5.5z" />
        }
        @case ('trash') {
          <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 .8 12.1a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9L19 7" />
          <path d="M10 11v6M14 11v6" />
        }
        @case ('grip') {
          <circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" />
        }
        @case ('text') {
          <path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h9.5" />
        }
        @case ('hash') {
          <path d="M9.5 3.5L7.5 20.5M16.5 3.5L14.5 20.5M4 8.5h16.5M3.5 15.5H20" />
        }
        @case ('toggle') {
          <rect x="3" y="7" width="18" height="10" rx="5" />
          <circle cx="15.5" cy="12" r="3" fill="currentColor" stroke="none" />
        }
        @case ('list') {
          <path d="M9 6.5h11M9 12h11M9 17.5h11" />
          <circle cx="4.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
        }
        @case ('photo') {
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <circle cx="9" cy="10" r="1.75" />
          <path d="M3.5 16.5l4.5-4.5a2 2 0 0 1 2.8 0l6.2 6.2M14.5 14l1.5-1.5a2 2 0 0 1 2.8 0l1.7 1.7" />
        }
        @case ('pin') {
          <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.25" />
        }
        @case ('edit') {
          <path d="M15.5 4.5l4 4L8 20H4v-4L15.5 4.5z" />
          <path d="M13.5 6.5l4 4" />
        }
        @case ('at') {
          <circle cx="12" cy="12" r="4" />
          <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4.5 7.79" />
        }
        @case ('message') {
          <path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" />
        }
        @case ('menu') {
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
        }
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(1.75);
}
