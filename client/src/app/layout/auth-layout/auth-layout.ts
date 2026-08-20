import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrandedPageComponent } from '../../shared/ui/branded-page';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, BrandedPageComponent],
  template: `
    <app-branded-page>
      <router-outlet></router-outlet>
    </app-branded-page>
  `,
})
export class AuthLayoutComponent {}
