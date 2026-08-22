import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon';
import { LogoComponent } from '../../shared/ui/logo';

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
}

interface Feature {
  icon: 'board' | 'key' | 'workflow' | 'building' | 'list' | 'tag';
  bg: string;
  text: string;
  title: string;
  description: string;
}

interface Team {
  icon: 'board' | 'tag' | 'user' | 'calendar' | 'building';
  bg: string;
  text: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, IconComponent, LogoComponent],
  templateUrl: './landing-page.html',
})
export class LandingPageComponent {
  protected readonly currentYear = new Date().getFullYear();

  // drives the fixed nav's transparent-over-aurora → solid-on-scroll swap.
  protected readonly scrolled = signal(false);

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  // same particle field as the auth pages (see BrandedPageComponent) - kept
  // as its own copy rather than a shared import since the hero here is a
  // different width/shape, not a drop-in reuse of that narrow card layout.
  protected readonly particles: Particle[] = [
    { left: 4, size: 3, duration: 11, delay: 0 },
    { left: 12, size: 2, duration: 14, delay: 2.2 },
    { left: 21, size: 4, duration: 10, delay: 4.5 },
    { left: 29, size: 2, duration: 16, delay: 1 },
    { left: 37, size: 3, duration: 12, delay: 6 },
    { left: 46, size: 2, duration: 15, delay: 3.3 },
    { left: 55, size: 4, duration: 11, delay: 7.5 },
    { left: 63, size: 2, duration: 13, delay: 0.8 },
    { left: 71, size: 3, duration: 17, delay: 5 },
    { left: 79, size: 2, duration: 10, delay: 2.8 },
    { left: 87, size: 4, duration: 14, delay: 8 },
    { left: 93, size: 2, duration: 12, delay: 4 },
    { left: 16, size: 3, duration: 18, delay: 9 },
    { left: 68, size: 3, duration: 9, delay: 1.6 },
  ];

  protected readonly teams: Team[] = [
    {
      icon: 'board',
      bg: 'bg-fuchsia-50',
      text: 'text-fuchsia-600',
      name: 'Software & engineering',
      description: 'Sprints, custom work item types, and a workflow you shape yourself — the original use case this whole thing grew out of.',
    },
    {
      icon: 'tag',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      name: 'Sales',
      description: 'Track deals from first contact to close with a pipeline board that matches how your team actually sells.',
    },
    {
      icon: 'user',
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      name: 'Customer Success',
      description: 'Onboarding checklists, due dates that flag a renewal in red before it slips, and a custom field for account health — one board per customer.',
    },
    {
      icon: 'calendar',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      name: 'Marketing',
      description: 'Plan campaigns and content calendars with custom fields for channel, launch date, and owner.',
    },
    {
      icon: 'building',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      name: 'Operations & field teams',
      description: 'The only one that also tracks materials, supply requests, and purchase orders alongside the work itself.',
    },
  ];

  // abstract mini-kanban motif for the flagship "Boards & sprints" feature
  // card - three columns of varying-height bars standing in for a board's
  // columns/cards, without needing another screenshot asset.
  protected readonly miniBoardColumns: { tint: string; bars: number[] }[] = [
    { tint: 'bg-violet-50', bars: [35, 22] },
    { tint: 'bg-sky-50', bars: [26, 38, 19] },
    { tint: 'bg-emerald-50', bars: [29] },
  ];

  protected readonly features: Feature[] = [
    {
      icon: 'board',
      bg: 'bg-violet-100',
      text: 'text-violet-600',
      title: 'Boards & sprints',
      description: 'Drag-and-drop boards and sprints, with a workflow you can actually reshape instead of one forced on you.',
    },
    {
      icon: 'key',
      bg: 'bg-sky-100',
      text: 'text-sky-600',
      title: 'Roles & permissions',
      description: 'Fine-grained, per-project roles control exactly who can view, edit, approve, or manage — nothing implicit.',
    },
    {
      icon: 'workflow',
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      title: 'Custom fields & workflows',
      description: 'Model the process your team already follows, with statuses and fields shaped for your industry.',
    },
    {
      icon: 'building',
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      title: 'Inventory tracking',
      description: 'Track materials by location — building, floor, site, whatever fits — with a full, append-only movement ledger.',
    },
    {
      icon: 'list',
      bg: 'bg-rose-100',
      text: 'text-rose-600',
      title: 'Supply requests',
      description: 'Anyone on the ground can flag what’s running low. A manager approves and fulfills it in a click.',
    },
    {
      icon: 'tag',
      bg: 'bg-cyan-100',
      text: 'text-cyan-600',
      title: 'Purchase orders',
      description: 'Bundle approved requests from any project into one bulk order per vendor — negotiate once, not five times.',
    },
  ];
}
