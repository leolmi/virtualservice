import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToolbarService } from '../core/services/toolbar.service';

@Component({
  selector: 'vs-management',
  standalone: true,
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementComponent {
  private router = inject(Router);
  private toolbarService = inject(ToolbarService);

  constructor() {
    this.toolbarService.set([
      {
        id: 'services',
        icon: 'view_module',
        tooltip: 'My services list',
        action: () => this.router.navigate(['/services']),
      },
    ]);
    inject(DestroyRef).onDestroy(() => this.toolbarService.clear());
  }
}
