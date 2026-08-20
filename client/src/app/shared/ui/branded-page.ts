import { Component } from '@angular/core';

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
}

/**
 * Shared animated backdrop for every "outside the app shell" screen -
 * login/register/forgot/reset password, change-password, accept-invite.
 * Pure CSS: a slowly hue-shifting aurora layer, a rising particle field, and
 * a rotating gradient-glow ring around the card itself (transform/opacity/
 * filter only, GPU-friendly, respects prefers-reduced-motion) - no canvas or
 * JS animation loop needed.
 */
@Component({
  selector: 'app-branded-page',
  template: `
    <div class="branded-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div class="aurora-layer">
        <div class="aurora-orb aurora-orb-1"></div>
        <div class="aurora-orb aurora-orb-2"></div>
        <div class="aurora-orb aurora-orb-3"></div>
        <div class="aurora-orb aurora-orb-4"></div>
        <div class="aurora-orb aurora-orb-5"></div>
      </div>

      <div class="particle-field">
        @for (p of particles; track $index) {
          <span
            class="particle"
            [style.left.%]="p.left"
            [style.--size]="p.size + 'px'"
            [style.animation-duration.s]="p.duration"
            [style.animation-delay.s]="p.delay"
          ></span>
        }
      </div>

      <div class="pointer-events-none absolute inset-0 aurora-grid"></div>
      <div class="pointer-events-none absolute inset-0" style="background: radial-gradient(ellipse at center, transparent 30%, #0b1020 92%)"></div>

      <div class="relative w-full max-w-md">
        <div class="card-spotlight"></div>
        <div class="card-aura relative rounded-[26px] p-[2px]">
          <div class="auth-card animate-fade-in relative rounded-[24px] p-8">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BrandedPageComponent {
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
}
